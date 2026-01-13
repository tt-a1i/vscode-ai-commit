import * as assert from 'assert';
import * as vscode from 'vscode';
import { readOpenAICompatibleStream } from '../../utils/openaiStream';
import { inferScope, inferType } from '../../utils/commitHeuristics';
import { trimDiffSmart } from '../../utils/diffTrim';
import { normalizeCommitMessage } from '../../utils/commitMessage';

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

    test('inferType returns docs for docs-only changes', () => {
        assert.strictEqual(inferType(['README.md', 'docs/usage.md']), 'docs');
    });

    test('inferScope returns package name for monorepo paths', () => {
        assert.strictEqual(inferScope(['packages/auth/src/index.ts', 'packages/auth/README.md']), 'auth');
    });

    test('inferScope respects commitlint scope casing when provided', () => {
        assert.strictEqual(inferScope(['packages/auth/src/index.ts'], ['Auth', 'Core']), 'Auth');
    });

    test('trimDiffSmart reduces very large diffs', () => {
        const big = [
            'diff --git a/src/a.ts b/src/a.ts',
            'index 000..111 100644',
            '--- a/src/a.ts',
            '+++ b/src/a.ts',
            '@@ -1,1 +1,10 @@',
            '+export function foo() {',
            '+  // comment',
            '+  return 1;',
            '+}',
            '+'.repeat(5000)
        ].join('\\n');

        const out = trimDiffSmart(big, 500);
        assert.ok(out.trimmed);
        assert.ok(out.text.length <= 560);
        assert.ok(out.text.includes('export function foo'));
    });

    test('normalizeCommitMessage enforces headerOnly', () => {
        const raw = `Commit message: feat(api): add x\n\nDetails here\n`;
        assert.strictEqual(normalizeCommitMessage(raw, { headerOnly: true }), 'feat(api): add x');
    });
});
