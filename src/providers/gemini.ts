import { BaseProvider, ProviderConfig, ProviderError, GenerateOptions } from './base';

export class GeminiProvider extends BaseProvider {
    readonly name = 'gemini';
    readonly displayName = 'Google Gemini';
    
    constructor(config: ProviderConfig) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 500
        });
    }
    
    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        this.validateApiKey();
        this.validateModel();
        
        const response = await fetch(
            `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
            {
                method: 'POST',
                signal: options?.signal,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: this.config.temperature,
                        maxOutputTokens: this.config.maxTokens
                    }
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.text();
            throw new ProviderError(this.name, `API error: ${error}`, response.status);
        }
        
        const data = await response.json() as {
            candidates: Array<{
                content: {
                    parts: Array<{ text: string }>;
                };
            }>;
        };
        
        return data.candidates[0]?.content?.parts[0]?.text?.trim() || '';
    }
}
