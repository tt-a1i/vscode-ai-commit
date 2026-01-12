import * as vscode from 'vscode';
import { DEFAULT_PROMPT, getLanguage, getLanguageDisplayName } from './templates';
import { loadCommitlintRules, formatRulesForPrompt } from './commitlint';

/**
 * Context for prompt template rendering
 */
export interface PromptContext {
    diff: string;
    files: string[];
    branch: string;
}

/**
 * Prompt engine for building and rendering prompts
 */
export class PromptEngine {
    /**
     * Build the complete prompt for commit message generation
     */
    async buildPrompt(context: PromptContext): Promise<string> {
        const config = vscode.workspace.getConfiguration('gitMessage');
        const customPrompt = config.get<string>('customPrompt', '');
        const maxDiffLength = config.get<number>('maxDiffLength', 4000);
        
        // Use custom prompt if provided, otherwise use default
        let template = customPrompt?.trim() || DEFAULT_PROMPT;
        
        // Load commitlint rules
        const commitlintRules = await loadCommitlintRules();
        const rulesText = formatRulesForPrompt(commitlintRules);
        
        // Get language
        const language = getLanguage();
        const languageName = getLanguageDisplayName(language);
        
        // Truncate diff if too long
        let diff = context.diff;
        if (diff.length > maxDiffLength) {
            diff = diff.substring(0, maxDiffLength) + '\n\n... (diff truncated)';
        }
        
        // Replace template variables
        let prompt = template
            .replace(/\{\{diff\}\}/g, diff)
            .replace(/\{\{files\}\}/g, context.files.join('\n'))
            .replace(/\{\{branch\}\}/g, context.branch)
            .replace(/\{\{language\}\}/g, languageName)
            .replace(/\{\{commitlint_rules\}\}/g, rulesText);
        
        // Handle conditional blocks {{#if commitlint_rules}}...{{/if}}
        if (rulesText) {
            prompt = prompt.replace(
                /\{\{#if commitlint_rules\}\}([\s\S]*?)\{\{\/if\}\}/g,
                '$1'
            );
        } else {
            prompt = prompt.replace(
                /\{\{#if commitlint_rules\}\}[\s\S]*?\{\{\/if\}\}/g,
                ''
            );
        }
        
        return prompt.trim();
    }
}
