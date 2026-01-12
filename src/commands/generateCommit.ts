import * as vscode from 'vscode';
import { ProviderRouter } from '../providers';
import { PromptEngine } from '../prompt';
import { GitDiff } from '../git';

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
                cancellable: false
            },
            async () => {
                const repo = await getActiveRepository();
                const git = new GitDiff(repo.rootUri.fsPath);

                if (!(await git.hasStagedChanges())) {
                    vscode.window.showWarningMessage('No staged changes. Please stage some files first.');
                    return;
                }

                const diff = await git.getStagedDiff();
                const files = await git.getStagedFiles();
                const branch = await git.getCurrentBranch();
                
                // Build prompt
                const promptEngine = new PromptEngine();
                const prompt = await promptEngine.buildPrompt({ diff, files, branch });
                
                // Get provider and generate
                const router = new ProviderRouter(context);
                const provider = await router.getProvider();
                
                const message = await provider.generate(prompt);
                
                if (!message) {
                    vscode.window.showErrorMessage('Failed to generate commit message: empty response');
                    return;
                }
                
                // Set the commit message in SCM input box
                repo.inputBox.value = message;
                
                vscode.window.showInformationMessage(`Commit message generated using ${provider.displayName}`);
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
