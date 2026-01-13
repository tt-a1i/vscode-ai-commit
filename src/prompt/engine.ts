import * as vscode from 'vscode';
import { DEFAULT_PROMPT, getLanguage, getLanguageDisplayName } from './templates';
import { loadCommitlintRules, formatRulesForPrompt } from './commitlint';
import { inferScope, inferType } from '../utils/commitHeuristics';
import { trimDiffSmart } from '../utils/diffTrim';
import { logDebug } from '../utils/log';

/**
 * Context for prompt template rendering
 */
export interface PromptContext {
    diff: string;
    files: string[];
    branch: string;
}

export type OutputStyle = 'headerOnly' | 'headerAndBody';

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
        const enableHeuristics = config.get<boolean>('enableHeuristics', true);
        const smartDiffTrim = config.get<boolean>('smartDiffTrim', true);
        const outputStyle = config.get<OutputStyle>('outputStyle', 'headerOnly');
        
        // Use custom prompt if provided, otherwise use default
        let template = customPrompt?.trim() || DEFAULT_PROMPT;
        
        // Load commitlint rules
        const commitlintRules = await loadCommitlintRules();
        const rulesText = formatRulesForPrompt(commitlintRules);
        const suggestedType = enableHeuristics ? inferType(context.files, commitlintRules?.types) : '';
        const suggestedScope = enableHeuristics ? inferScope(context.files, commitlintRules?.scopes) : '';
        
        // Get language
        const language = getLanguage();
        const languageName = getLanguageDisplayName(language);
        
        // Truncate/trim diff if too long
        let diff = context.diff;
        if (diff.length > maxDiffLength) {
            if (smartDiffTrim) {
                const trimmed = trimDiffSmart(diff, maxDiffLength);
                diff = trimmed.text;
                if (trimmed.trimmed) {
                    logDebug(`Diff trimmed: original=${context.diff.length} chars, used=${diff.length} chars`);
                }
            } else {
                diff = diff.substring(0, maxDiffLength) + '\n\n... (diff truncated)';
            }
        }
        
        // Replace template variables
        let prompt = template
            .replace(/\{\{diff\}\}/g, diff)
            .replace(/\{\{files\}\}/g, context.files.join('\n'))
            .replace(/\{\{branch\}\}/g, context.branch)
            .replace(/\{\{language\}\}/g, languageName)
            .replace(/\{\{commitlint_rules\}\}/g, rulesText)
            .replace(/\{\{suggested_type\}\}/g, suggestedType)
            .replace(/\{\{suggested_scope\}\}/g, suggestedScope);

        prompt = applyIfBlocks(prompt, {
            commitlint_rules: rulesText,
            suggested_type: suggestedType,
            suggested_scope: suggestedScope,
            header_only: outputStyle === 'headerOnly' ? '1' : '',
            allow_body: outputStyle === 'headerAndBody' ? '1' : ''
        });
        
        return prompt.trim();
    }
}

function applyIfBlocks(prompt: string, vars: Record<string, string>): string {
    let result = prompt;
    let prev = '';
    
    // Keep applying until no more changes (handles nested blocks)
    while (result !== prev) {
        prev = result;
        result = result.replace(/\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, name: string, content: string) => {
            const v = vars[name];
            return v ? content : '';
        });
    }
    
    return result;
}
