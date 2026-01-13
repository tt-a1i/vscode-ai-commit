import * as vscode from 'vscode';
import { generateCommitMessage } from './commands/generateCommit';
import { getOutputChannel } from './utils/log';

export function activate(context: vscode.ExtensionContext) {
    console.log('Git Message Generator is now active!');

    context.subscriptions.push(getOutputChannel());

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gitMessage.generate', () => generateCommitMessage(context)),
        vscode.commands.registerCommand('gitMessage.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'gitMessage.custom');
        })
    );
}

export function deactivate() {}
