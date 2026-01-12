/**
 * Base interface for all AI model providers
 */
export interface ModelProvider {
    readonly name: string;
    readonly displayName: string;
    
    /**
     * Generate commit message from prompt
     */
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
    
    /**
     * Test if the provider is properly configured
     */
    testConnection(): Promise<boolean>;
}

/**
 * Configuration for a model provider
 */
export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}

export interface GenerateOptions {
    signal?: AbortSignal;
}

/**
 * Common error for provider issues
 */
export class ProviderError extends Error {
    constructor(
        public readonly provider: string,
        message: string,
        public readonly statusCode?: number
    ) {
        super(`[${provider}] ${message}`);
        this.name = 'ProviderError';
    }
}

/**
 * Base class with common functionality
 */
export abstract class BaseProvider implements ModelProvider {
    abstract readonly name: string;
    abstract readonly displayName: string;
    
    protected config: ProviderConfig;
    
    constructor(config: ProviderConfig) {
        this.config = config;
    }
    
    abstract generate(prompt: string, options?: GenerateOptions): Promise<string>;
    
    async testConnection(): Promise<boolean> {
        try {
            await this.generate('Say "OK" if you can read this.');
            return true;
        } catch {
            return false;
        }
    }
    
    protected validateApiKey(): void {
        if (!this.config.apiKey) {
            throw new ProviderError(this.name, 'API key is not configured. Run "Git Message: Set API Key" command.');
        }
    }

    protected validateModel(): void {
        if (!this.config.model) {
            throw new ProviderError(this.name, `Model is not configured. Set gitMessage.providers.${this.name}.model in settings.`);
        }
    }
}
