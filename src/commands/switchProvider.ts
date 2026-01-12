import * as vscode from 'vscode';
import { ProviderType } from '../providers';

/**
 * Command: Switch the default AI provider
 */
export async function switchProvider(): Promise<void> {
    const config = vscode.workspace.getConfiguration('gitMessage');
    const currentProvider = config.get<string>('defaultProvider', 'openai');
    
    const providers: Array<{ label: string; description: string; value: ProviderType }> = [
        { label: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5', value: 'openai' },
        { label: 'Anthropic Claude', description: 'Claude 3.5 Sonnet', value: 'claude' },
        { label: 'Google Gemini', description: 'Gemini Pro, Flash', value: 'gemini' },
        { label: 'Custom API', description: 'OpenAI-compatible endpoint', value: 'custom' }
    ];
    
    // Mark current provider
    const items = providers.map(p => ({
        ...p,
        label: p.value === currentProvider ? `$(check) ${p.label}` : p.label
    }));
    
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select AI provider'
    });
    
    if (!selected) {
        return;
    }
    
    await config.update('defaultProvider', selected.value, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(`Switched to ${selected.label.replace('$(check) ', '')}`);
}
