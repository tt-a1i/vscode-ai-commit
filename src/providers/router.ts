import * as vscode from 'vscode';
import { ModelProvider, ProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { CustomProvider } from './custom';

export type ProviderType = 'openai' | 'claude' | 'gemini' | 'custom';

/**
 * Factory and manager for AI providers
 */
export class ProviderRouter {
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    /**
     * Get the currently configured provider
     */
    async getProvider(): Promise<ModelProvider> {
        const config = vscode.workspace.getConfiguration('gitMessage');
        const providerType = config.get<ProviderType>('defaultProvider', 'openai');
        
        return this.createProvider(providerType);
    }
    
    /**
     * Create a specific provider instance
     */
    async createProvider(type: ProviderType): Promise<ModelProvider> {
        const config = await this.getProviderConfig(type);
        
        switch (type) {
            case 'openai':
                return new OpenAIProvider(config);
            case 'claude':
                return new ClaudeProvider(config);
            case 'gemini':
                return new GeminiProvider(config);
            case 'custom':
                return new CustomProvider(config);
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
    
    /**
     * Get configuration for a provider, including API key from secure storage
     */
    private async getProviderConfig(type: ProviderType): Promise<ProviderConfig> {
        const config = vscode.workspace.getConfiguration('gitMessage');
        const providerConfig = config.get<Record<string, string>>(`providers.${type}`, {});
        
        // Get API key from secure storage
        const apiKey = await this.context.secrets.get(`gitMessage.${type}.apiKey`);
        
        return {
            apiKey,
            model: providerConfig['model'] || '',
            baseUrl: providerConfig['baseUrl'],
        };
    }
    
    /**
     * Store API key securely
     */
    async setApiKey(type: ProviderType, apiKey: string): Promise<void> {
        await this.context.secrets.store(`gitMessage.${type}.apiKey`, apiKey);
    }
    
    /**
     * Get all available provider types
     */
    getAvailableProviders(): Array<{ type: ProviderType; label: string }> {
        return [
            { type: 'openai', label: 'OpenAI (GPT-4o, GPT-4, GPT-3.5)' },
            { type: 'claude', label: 'Anthropic Claude (Claude 3.5 Sonnet)' },
            { type: 'gemini', label: 'Google Gemini (Gemini Pro)' },
            { type: 'custom', label: 'Custom OpenAI-compatible API' }
        ];
    }
}
