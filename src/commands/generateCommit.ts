import * as vscode from 'vscode';
import { createProvider, isProviderConfigured, ProviderError } from '../providers';
import { PromptEngine } from '../prompt';
import { GitDiff } from '../git';
import { getOutputChannel, logDebug, logError, logInfo } from '../utils/log';
import { formatProviderErrorMessage, getSafeHostFromBaseUrl } from '../utils/httpErrors';
import { normalizeCommitMessage } from '../utils/commitMessage';

/**
 * Main command: Generate commit message
 */
export async function generateCommitMessage(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating commit message...',
                cancellable: true
            },
            async (_progress, token) => {
                const output = getOutputChannel();
                const abortController = new AbortController();

                token.onCancellationRequested(() => {
                    abortController.abort();
                    logInfo('Generation cancelled by user.');
                });

                const repo = await getActiveRepository();
                const git = new GitDiff(repo.rootUri.fsPath);

                const hasStaged = await git.hasStagedChanges();
                const hasUnstaged = await git.hasUnstagedChanges();

                if (!hasStaged && !hasUnstaged) {
                    vscode.window.showWarningMessage('No changes found. Make some changes first.');
                    return;
                }

                let source: 'staged' | 'unstaged';
                if (hasStaged && hasUnstaged) {
                    const picked = await vscode.window.showWarningMessage(
                        'You have both staged and unstaged changes. Choose one to generate the commit message from.',
                        { modal: false },
                        'Use Staged',
                        'Use Unstaged'
                    );

                    if (!picked) {
                        return;
                    }

                    source = picked === 'Use Staged' ? 'staged' : 'unstaged';
                } else {
                    source = hasStaged ? 'staged' : 'unstaged';
                }

                const diff = source === 'staged' ? await git.getStagedDiff() : await git.getUnstagedDiff();
                const files = source === 'staged' ? await git.getStagedFiles() : await git.getUnstagedFiles();
                const branch = await git.getCurrentBranch();

                logInfo(`Repo: ${repo.rootUri.fsPath}`);
                logInfo(`Branch: ${branch}`);
                logInfo(`Files: ${files.length}`);
                logInfo(`Diff source: ${source}`);

                // Check if provider config is configured
                if (!isProviderConfigured()) {
                    const action = await vscode.window.showWarningMessage(
                        'Custom endpoint is not fully configured. Please set baseUrl, model, and apiKey in settings.',
                        'Open Settings'
                    );

                    if (action === 'Open Settings') {
                        await vscode.commands.executeCommand('workbench.action.openSettings', 'gitMessage.custom');
                    }
                    return;
                }

                const promptEngine = new PromptEngine();
                const prompt = await promptEngine.buildPrompt({ diff, files, branch });

                let provider = createProvider();
                const getBaseUrl = () => vscode.workspace.getConfiguration('gitMessage').get<string>('custom.baseUrl', '');
                const outputStyle = vscode.workspace.getConfiguration('gitMessage').get<string>('outputStyle', 'headerOnly');
                const headerOnly = outputStyle === 'headerOnly';

                logInfo(`Model: ${vscode.workspace.getConfiguration('gitMessage').get('custom.model')}`);
                logInfo(`Endpoint host: ${getSafeHostFromBaseUrl(getBaseUrl())}`);
                logInfo(`Prompt length: ${prompt.length}`);
                logDebug('Prompt:\n' + prompt);

                while (true) {
                    if (token.isCancellationRequested) {
                        return;
                    }

                    try {
                        const baseUrl = getBaseUrl();

                        repo.inputBox.value = '';
                        let pending = '';
                        let flushTimer: NodeJS.Timeout | undefined;
                        let sawNewline = false;

                        const flush = () => {
                            flushTimer = undefined;
                            if (!pending) return;
                            repo.inputBox.value = repo.inputBox.value + pending;
                            pending = '';
                        };

                        let message = '';
                        try {
                            message = await provider.generate(prompt, {
                                signal: abortController.signal,
                                onToken: (text) => {
                                    if (headerOnly) {
                                        const newlineIndex = text.search(/\r?\n/);
                                        if (newlineIndex !== -1) {
                                            const before = text.slice(0, newlineIndex);
                                            if (before) pending += before;
                                            sawNewline = true;
                                            logDebug('Aborted stream at first newline (headerOnly mode)');
                                            abortController.abort();
                                            return;
                                        }
                                    }
                                    pending += text;
                                    if (!flushTimer) {
                                        flushTimer = setTimeout(flush, 60);
                                    }
                                }
                            });
                        } finally {
                            if (flushTimer) {
                                clearTimeout(flushTimer);
                                flushTimer = undefined;
                            }
                            flush();
                        }

                        // If we aborted after the first newline in header-only mode, treat it as success.
                        if (headerOnly && sawNewline && abortController.signal.aborted) {
                            const normalized = normalizeCommitMessage(repo.inputBox.value, { headerOnly: true });
                            repo.inputBox.value = normalized;
                            logInfo(`Generated message: ${normalized}`);
                            vscode.window.showInformationMessage('Commit message generated!');
                            return;
                        }

                        if (!message) {
                            throw new Error('Empty response');
                        }

                        // Ensure final output matches returned message (in case of non-stream fallback)
                        const normalized = normalizeCommitMessage(message, { headerOnly });
                        repo.inputBox.value = normalized;
                        logInfo(`Generated message: ${normalized.replace(/\s+/g, ' ').trim()}`);
                        vscode.window.showInformationMessage('Commit message generated!');
                        return;
                    } catch (error) {
                        if (token.isCancellationRequested) {
                            return;
                        }

                        if (abortController.signal.aborted) {
                            // In header-only mode we might abort to stop at first newline; if no content, just return.
                            if (headerOnly) {
                                const normalized = normalizeCommitMessage(repo.inputBox.value, { headerOnly: true });
                                if (normalized) {
                                    repo.inputBox.value = normalized;
                                    logInfo(`Generated message: ${normalized}`);
                                    vscode.window.showInformationMessage('Commit message generated!');
                                }
                            }
                            return;
                        }

                        const baseUrl = getBaseUrl();
                        const { userMessage, logMessage } = formatProviderErrorMessage(error, baseUrl);
                        logError(logMessage);
                        output.show(true);

                        const actions = ['Retry', 'Open Settings', 'Show Logs'] as const;
                        const picked = await vscode.window.showErrorMessage(
                            userMessage,
                            ...actions
                        );

                        if (picked === 'Retry') {
                            provider = createProvider();
                            continue;
                        }

                        if (picked === 'Open Settings') {
                            await vscode.commands.executeCommand('workbench.action.openSettings', 'gitMessage.custom');
                            continue;
                        }

                        if (picked === 'Show Logs') {
                            output.show(true);
                            continue;
                        }

                        return;
                    }
                }
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(errorMessage);

        if (error instanceof ProviderError) {
            vscode.window.showErrorMessage(error.message);
            return;
        }

        vscode.window.showErrorMessage(`Failed to generate commit message: ${errorMessage}`);
    }
}

async function getActiveRepository(): Promise<import('vscode').SourceControl & { rootUri: vscode.Uri; inputBox: vscode.SourceControlInputBox }> {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension) {
        throw new Error('Git extension not found');
    }

    if (!gitExtension.isActive) {
        await gitExtension.activate();
    }

    const git = gitExtension.exports.getAPI(1) as {
        repositories: Array<{ rootUri: vscode.Uri; inputBox: vscode.SourceControlInputBox }>;
        getRepository(uri: vscode.Uri): { rootUri: vscode.Uri; inputBox: vscode.SourceControlInputBox } | null;
    };

    if (!git.repositories || git.repositories.length === 0) {
        throw new Error('No Git repository found');
    }

    const activeUri = vscode.window.activeTextEditor?.document.uri;
    if (activeUri) {
        const repo = git.getRepository(activeUri);
        if (repo) {
            return repo as any;
        }
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const repo = git.getRepository(workspaceFolder.uri);
        if (repo) {
            return repo as any;
        }
    }

    return git.repositories[0] as any;
}
