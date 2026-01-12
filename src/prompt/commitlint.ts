import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/**
 * Parsed commitlint rules
 */
export interface CommitlintRules {
    types?: string[];
    scopes?: string[];
    maxHeaderLength?: number;
    bodyMaxLineLength?: number;
}

/**
 * Supported commitlint config files
 */
const CONFIG_FILES = [
    '.commitlintrc',
    '.commitlintrc.json',
    '.commitlintrc.yaml',
    '.commitlintrc.yml',
    '.commitlintrc.js',
    '.commitlintrc.cjs',
    'commitlint.config.js',
    'commitlint.config.cjs'
];

/**
 * Load and parse commitlint configuration from workspace
 */
export async function loadCommitlintRules(): Promise<CommitlintRules | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }
    
    const rootPath = workspaceFolders[0].uri.fsPath;
    
    for (const configFile of CONFIG_FILES) {
        const configPath = path.join(rootPath, configFile);
        
        if (fs.existsSync(configPath)) {
            try {
                return await parseConfigFile(configPath, configFile);
            } catch (error) {
                console.error(`Failed to parse ${configFile}:`, error);
            }
        }
    }
    
    // Also check package.json for commitlint config
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.commitlint) {
                return extractRules(packageJson.commitlint);
            }
        } catch (error) {
            console.error('Failed to parse package.json commitlint config:', error);
        }
    }
    
    return null;
}

/**
 * Parse a specific config file
 */
async function parseConfigFile(configPath: string, fileName: string): Promise<CommitlintRules> {
    const content = fs.readFileSync(configPath, 'utf-8');
    
    if (fileName.endsWith('.json') || fileName === '.commitlintrc') {
        // Try JSON first
        try {
            const config = JSON.parse(content);
            return extractRules(config);
        } catch {
            // Not JSON, might be YAML
        }
    }
    
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml') || fileName === '.commitlintrc') {
        // Try YAML
        try {
            const yaml = await import('yaml');
            const config = yaml.parse(content);
            return extractRules(config);
        } catch {
            // Not valid YAML
        }
    }
    
    if (fileName.endsWith('.js') || fileName.endsWith('.cjs')) {
        try {
            const require = createRequire(configPath);
            const loaded = require(configPath) as any;
            const config = loaded?.default ?? loaded;
            if (typeof config === 'function') {
                return extractRules(config());
            }
            return extractRules(config || {});
        } catch (error) {
            console.error(`Failed to load JS commitlint config ${fileName}:`, error);
            return {};
        }
    }
    
    return {};
}

/**
 * Extract relevant rules from commitlint config
 */
function extractRules(config: Record<string, unknown>): CommitlintRules {
    const rules: CommitlintRules = {};
    
    // Check for @commitlint/config-conventional extends
    const extendsConfig = config.extends as string | string[] | undefined;
    if (extendsConfig) {
        const extendsList = Array.isArray(extendsConfig) ? extendsConfig : [extendsConfig];
        if (extendsList.some(e => e.includes('conventional'))) {
            // Default conventional commit types
            rules.types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
        }
    }
    
    // Parse rules object
    const rulesConfig = config.rules as Record<string, unknown> | undefined;
    if (rulesConfig) {
        // type-enum rule
        const typeEnum = rulesConfig['type-enum'] as [number, string, string[]] | undefined;
        if (typeEnum && Array.isArray(typeEnum) && typeEnum[2]) {
            rules.types = typeEnum[2];
        }
        
        // scope-enum rule
        const scopeEnum = rulesConfig['scope-enum'] as [number, string, string[]] | undefined;
        if (scopeEnum && Array.isArray(scopeEnum) && scopeEnum[2]) {
            rules.scopes = scopeEnum[2];
        }
        
        // header-max-length rule
        const headerMaxLength = rulesConfig['header-max-length'] as [number, string, number] | undefined;
        if (headerMaxLength && Array.isArray(headerMaxLength) && headerMaxLength[2]) {
            rules.maxHeaderLength = headerMaxLength[2];
        }
        
        // body-max-line-length rule
        const bodyMaxLineLength = rulesConfig['body-max-line-length'] as [number, string, number] | undefined;
        if (bodyMaxLineLength && Array.isArray(bodyMaxLineLength) && bodyMaxLineLength[2]) {
            rules.bodyMaxLineLength = bodyMaxLineLength[2];
        }
    }
    
    return rules;
}

/**
 * Format rules as a string for the prompt
 */
export function formatRulesForPrompt(rules: CommitlintRules | null): string {
    if (!rules) {
        return '';
    }
    
    const lines: string[] = [];
    
    if (rules.types && rules.types.length > 0) {
        lines.push(`- Allowed types: ${rules.types.join(', ')}`);
    }
    
    if (rules.scopes && rules.scopes.length > 0) {
        lines.push(`- Allowed scopes: ${rules.scopes.join(', ')}`);
    }
    
    if (rules.maxHeaderLength) {
        lines.push(`- Maximum header length: ${rules.maxHeaderLength} characters`);
    }
    
    if (rules.bodyMaxLineLength) {
        lines.push(`- Maximum body line length: ${rules.bodyMaxLineLength} characters`);
    }
    
    return lines.join('\n');
}
