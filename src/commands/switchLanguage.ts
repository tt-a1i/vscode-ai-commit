import * as vscode from 'vscode';
import { LANGUAGE_NAMES } from '../prompt';

/**
 * Command: Switch the output language
 */
export async function switchLanguage(): Promise<void> {
    const config = vscode.workspace.getConfiguration('gitMessage');
    const currentLanguage = config.get<string>('language', 'en');
    
    const languages = Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
        label: currentLanguage === code ? `$(check) ${name}` : name,
        description: code,
        value: code
    }));
    
    const selected = await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select output language for commit messages'
    });
    
    if (!selected) {
        return;
    }
    
    await config.update('language', selected.value, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(`Language set to ${LANGUAGE_NAMES[selected.value]}`);
}
