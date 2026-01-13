import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('git-message.git-message-generator'));
    });

    test('Should register generate command', async () => {
        await vscode.extensions.getExtension('git-message.git-message-generator')?.activate();
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('gitMessage.generate'));
    });

    test('Should register openSettings command', async () => {
        await vscode.extensions.getExtension('git-message.git-message-generator')?.activate();
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('gitMessage.openSettings'));
    });
});
