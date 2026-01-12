import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // Some environments set this globally; it breaks launching VS Code for tests on macOS.
        delete process.env.ELECTRON_RUN_AS_NODE;

        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-message-generator-'));

        await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs: [workspacePath] });
    } catch (error) {
        console.error('Failed to run tests', error);
        process.exit(1);
    }
}

void main();
