import * as vscode from 'vscode';

/**
 * Configuration for the AI provider
 */
export interface ProviderConfig {
    apiKey: string;
    model: string;
    baseUrl: string;
}

/**
 * Provider error
 */
export class ProviderError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
        this.name = 'ProviderError';
    }
}

/**
 * Simple OpenAI-compatible provider
 * Works with OpenAI, Claude (via proxy), Gemini (via proxy), Ollama, etc.
 */
export class AIProvider {
    readonly displayName = 'AI Provider';
    private config: ProviderConfig;
    
    constructor(config: ProviderConfig) {
        this.config = config;
    }
    
    async generate(prompt: string, options?: { signal?: AbortSignal }): Promise<string> {
        if (!this.config.apiKey) {
            throw new ProviderError('API key is not configured. Set gitMessage.custom.apiKey in settings.');
        }
        
        if (!this.config.model) {
            throw new ProviderError('Model is not configured. Set gitMessage.custom.model in settings.');
        }

        if (!this.config.baseUrl) {
            throw new ProviderError('Base URL is not configured. Set gitMessage.custom.baseUrl in settings.');
        }
        
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            signal: options?.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new ProviderError(`API error: ${error}`, response.status);
        }
        
        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
        };
        
        return data.choices[0]?.message?.content?.trim() || '';
    }
}

/**
 * Get provider configuration from settings
 */
export function getProviderConfig(): ProviderConfig {
    const config = vscode.workspace.getConfiguration('gitMessage');
    
    return {
        apiKey: config.get<string>('custom.apiKey', ''),
        model: config.get<string>('custom.model', ''),
        baseUrl: config.get<string>('custom.baseUrl', '')
    };
}

/**
 * Check if provider configuration is present
 */
export function isProviderConfigured(): boolean {
    const config = vscode.workspace.getConfiguration('gitMessage');
    return !!config.get<string>('custom.apiKey', '') && !!config.get<string>('custom.model', '') && !!config.get<string>('custom.baseUrl', '');
}

/**
 * Create a new provider instance
 */
export function createProvider(): AIProvider {
    return new AIProvider(getProviderConfig());
}
