import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PromptEngine } from '../../prompt';
import { loadCommitlintRules } from '../../prompt/commitlint';
import { OpenAIProvider } from '../../providers/openai';
import { ProviderError } from '../../providers/base';

suite('Git Message Generator', () => {
    test('test harness works', () => {
        assert.strictEqual(1 + 1, 2);
    });

    test('requires model configuration (OpenAI)', async () => {
        const provider = new OpenAIProvider({
            apiKey: 'test-key',
            baseUrl: 'https://example.invalid',
            model: ''
        });

        await assert.rejects(
            () => provider.generate('hello'),
            (err: unknown) => err instanceof ProviderError && err.message.includes('Model is not configured')
        );
    });

    test('prompt engine truncates diff and renders language', async () => {
        const config = vscode.workspace.getConfiguration('gitMessage');
        await config.update('language', 'en', vscode.ConfigurationTarget.Global);
        await config.update('maxDiffLength', 10, vscode.ConfigurationTarget.Global);
        await config.update('customPrompt', 'DIFF={{diff}}\nLANG={{language}}', vscode.ConfigurationTarget.Global);

        const engine = new PromptEngine();
        const prompt = await engine.buildPrompt({
            diff: '0123456789ABCDEFGHIJ',
            files: ['a.ts'],
            branch: 'main'
        });

        assert.ok(prompt.includes('LANG=English'));
        assert.ok(prompt.includes('... (diff truncated)'));
    });

    test('loads commitlint rules from .commitlintrc.json', async () => {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        assert.ok(root, 'workspace root not found');

        const filePath = path.join(root, '.commitlintrc.json');
        fs.writeFileSync(
            filePath,
            JSON.stringify({
                rules: {
                    'type-enum': [2, 'always', ['feat', 'fix']],
                    'header-max-length': [2, 'always', 72]
                }
            }),
            'utf8'
        );

        try {
            const rules = await loadCommitlintRules();
            assert.ok(rules);
            assert.deepStrictEqual(rules.types, ['feat', 'fix']);
            assert.strictEqual(rules.maxHeaderLength, 72);
        } finally {
            fs.unlinkSync(filePath);
        }
    });

    test('loads commitlint rules from commitlint.config.cjs', async () => {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        assert.ok(root, 'workspace root not found');

        const filePath = path.join(root, 'commitlint.config.cjs');
        fs.writeFileSync(
            filePath,
            `module.exports = { rules: { 'type-enum': [2, 'always', ['chore', 'docs']] } };`,
            'utf8'
        );

        try {
            const rules = await loadCommitlintRules();
            assert.ok(rules);
            assert.deepStrictEqual(rules.types, ['chore', 'docs']);
        } finally {
            fs.unlinkSync(filePath);
        }
    });
});
