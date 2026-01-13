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

{{#if suggested_type}}
## Suggestions (optional)
- Suggested type: {{suggested_type}}
{{#if suggested_scope}}
- Suggested scope: {{suggested_scope}}
{{/if}}
{{/if}}

{{#if header_only}}
## Examples (header only)
- feat(auth): add token refresh on 401
- fix(api): handle null response from upstream
- docs(readme): document setup and test commands
- ci: run lint and tests on pull requests
{{/if}}

{{#if allow_body}}
## Examples (header + body)
feat(auth): add token refresh on 401

Handle expired access tokens by attempting a refresh once.
{{/if}}

Requirements:
- Use Conventional Commits format: <type>[optional scope]: <description>
- Available types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Write the description in {{language}}
{{#if header_only}}
- Output ONLY ONE line (header only): no body, no footer
- Keep it concise and clear (max 72 characters if possible)
{{/if}}
{{#if allow_body}}
- Output a header line and optionally a short body (blank line between)
{{/if}}
- Focus on WHAT changed and WHY, not HOW

{{#if header_only}}
Output ONLY the commit header line, no explanations, no markdown.
{{/if}}
{{#if allow_body}}
Output ONLY the commit message (header + optional body), no explanations, no markdown.
{{/if}}`;

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
