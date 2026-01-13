import * as assert from 'assert';
import * as vscode from 'vscode';
import { readOpenAICompatibleStream } from '../../utils/openaiStream';

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

    test('OpenAI-compatible stream parser collects deltas', async () => {
        const encoder = new TextEncoder();
        const chunks = [
            'data: {"choices":[{"delta":{"content":"feat:"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" add"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" streaming"}}]}\n\n',
            'data: [DONE]\n\n'
        ];

        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                for (const c of chunks) controller.enqueue(encoder.encode(c));
                controller.close();
            }
        });

        let seen = '';
        const result = await readOpenAICompatibleStream(stream, (t) => { seen += t; });
        assert.strictEqual(result, 'feat: add streaming');
        assert.strictEqual(seen, 'feat: add streaming');
    });
});
