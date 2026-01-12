import * as vscode from 'vscode';

/**
 * Default prompt template for commit message generation
 */
export const DEFAULT_PROMPT = `You are a professional Git commit message generator.

## Code Changes
\`\`\`diff
{{diff}}
\`\`\`

## Changed Files
{{files}}

## Current Branch
{{branch}}

{{#if commitlint_rules}}
## Project Commit Rules
{{commitlint_rules}}
{{/if}}

## Task
Generate a commit message based on the changes above.

Requirements:
- Use Conventional Commits format: <type>[optional scope]: <description>
- Available types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Write the description in {{language}}
- Be concise and clear
- Focus on WHAT changed and WHY, not HOW
- Add a body with details if the change is complex

Output ONLY the commit message, no explanations.`;

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English',
    'zh-CN': '简体中文 (Simplified Chinese)',
    'zh-TW': '繁體中文 (Traditional Chinese)',
    'ja': '日本語 (Japanese)',
    'ko': '한국어 (Korean)'
};

/**
 * Get the configured language
 */
export function getLanguage(): string {
    const config = vscode.workspace.getConfiguration('gitMessage');
    return config.get<string>('language', 'en');
}

/**
 * Get the language display name
 */
export function getLanguageDisplayName(lang: string): string {
    return LANGUAGE_NAMES[lang] || lang;
}
