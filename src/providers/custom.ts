import { BaseProvider, ProviderConfig, ProviderError, GenerateOptions } from './base';

/**
 * Custom provider for any OpenAI-compatible API
 * (e.g., Ollama, LocalAI, vLLM, etc.)
 */
export class CustomProvider extends BaseProvider {
    readonly name = 'custom';
    readonly displayName = 'Custom API';
    
    constructor(config: ProviderConfig) {
        super({
            ...config,
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 500
        });
    }
    
    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        if (!this.config.baseUrl) {
            throw new ProviderError(this.name, 'Base URL is not configured. Set gitMessage.providers.custom.baseUrl in settings.');
        }
        
        if (!this.config.model) {
            throw new ProviderError(this.name, 'Model is not configured. Set gitMessage.providers.custom.model in settings.');
        }
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        // API key is optional for local services like Ollama
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            signal: options?.signal,
            headers,
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new ProviderError(this.name, `API error: ${error}`, response.status);
        }
        
        const data = await response.json() as {
            choices: Array<{ message: { content: string } }>;
        };
        
        return data.choices[0]?.message?.content?.trim() || '';
    }
}
