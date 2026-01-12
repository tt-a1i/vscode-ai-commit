import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
    if (!channel) {
        channel = vscode.window.createOutputChannel('Git Message Generator');
    }
    return channel;
}

function nowTime(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function isDebugEnabled(): boolean {
    return vscode.workspace.getConfiguration('gitMessage').get<boolean>('debug', false);
}

function canLogPrompt(): boolean {
    return vscode.workspace.getConfiguration('gitMessage').get<boolean>('debugLogPrompt', false);
}

export function logInfo(message: string): void {
    getOutputChannel().appendLine(`[INFO ${nowTime()}] ${message}`);
}

export function logError(message: string): void {
    getOutputChannel().appendLine(`[ERROR ${nowTime()}] ${message}`);
}

export function logDebug(message: string): void {
    if (!isDebugEnabled()) {
        return;
    }

    if (message.startsWith('Prompt:') && !canLogPrompt()) {
        getOutputChannel().appendLine(`[DEBUG ${nowTime()}] Prompt logging disabled (set gitMessage.debugLogPrompt=true to enable).`);
        return;
    }

    getOutputChannel().appendLine(`[DEBUG ${nowTime()}] ${message}`);
}
