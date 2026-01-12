import * as vscode from 'vscode';
import { generateCommitMessage } from './commands/generateCommit';
import { setApiKey } from './commands/setApiKey';
import { switchProvider } from './commands/switchProvider';
import { switchLanguage } from './commands/switchLanguage';
import { getOutputChannel } from './utils/log';

export function activate(context: vscode.ExtensionContext) {
    console.log('Git Message Generator is now active!');

    context.subscriptions.push(getOutputChannel());

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gitMessage.generate', () => generateCommitMessage(context)),
        vscode.commands.registerCommand('gitMessage.setApiKey', () => setApiKey(context)),
        vscode.commands.registerCommand('gitMessage.switchProvider', () => switchProvider()),
        vscode.commands.registerCommand('gitMessage.switchLanguage', () => switchLanguage())
    );
}

export function deactivate() {}
