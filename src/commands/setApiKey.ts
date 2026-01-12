import * as vscode from 'vscode';
import { ProviderRouter, ProviderType } from '../providers';

/**
 * Command: Set API Key for a provider
 */
export async function setApiKey(context: vscode.ExtensionContext): Promise<void> {
    const router = new ProviderRouter(context);
    const providers = router.getAvailableProviders();
    
    // Let user select provider
    const selected = await vscode.window.showQuickPick(
        providers.map(p => ({
            label: p.label,
            description: p.type,
            type: p.type
        })),
        {
            placeHolder: 'Select AI provider to configure API key'
        }
    );
    
    if (!selected) {
        return;
    }
    
    const providerType = selected.type as ProviderType;
    
    // Prompt for API key
    const apiKey = await vscode.window.showInputBox({
        prompt: `Enter API key for ${selected.label}`,
        password: true,
        placeHolder: 'sk-...',
        ignoreFocusOut: true
    });
    
    if (!apiKey) {
        return;
    }
    
    // Store the API key
    await router.setApiKey(providerType, apiKey);
    
    vscode.window.showInformationMessage(`API key saved for ${selected.label}`);
}
