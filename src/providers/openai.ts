import { BaseProvider, ProviderConfig, ProviderError } from './base';

export class OpenAIProvider extends BaseProvider {
    readonly name = 'openai';
    readonly displayName = 'OpenAI';
    
    constructor(config: ProviderConfig) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://api.openai.com/v1',
            model: config.model || 'gpt-4o',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 500
        });
    }
    
    async generate(prompt: string): Promise<string> {
        this.validateApiKey();
        
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
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
