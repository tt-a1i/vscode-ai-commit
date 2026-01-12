import { BaseProvider, ProviderConfig, ProviderError, GenerateOptions } from './base';

export class ClaudeProvider extends BaseProvider {
    readonly name = 'claude';
    readonly displayName = 'Anthropic Claude';
    
    constructor(config: ProviderConfig) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://api.anthropic.com',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 500
        });
    }
    
    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        this.validateApiKey();
        this.validateModel();
        
        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
            method: 'POST',
            signal: options?.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new ProviderError(this.name, `API error: ${error}`, response.status);
        }
        
        const data = await response.json() as {
            content: Array<{ type: string; text: string }>;
        };
        
        const textContent = data.content.find(c => c.type === 'text');
        return textContent?.text?.trim() || '';
    }
}
