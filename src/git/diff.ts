import * as vscode from 'vscode';
import * as cp from 'child_process';

/**
 * Git operations for collecting diff and file information
 */
export class GitDiff {
    private cwd: string;
    
    constructor(cwd?: string) {
        if (cwd) {
            this.cwd = cwd;
            return;
        }

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            throw new Error('No workspace folder open');
        }
        this.cwd = folders[0].uri.fsPath;
    }
    
    /**
     * Get the staged diff
     */
    async getStagedDiff(): Promise<string> {
        return this.exec('git diff --cached');
    }

    /**
     * Get the unstaged diff (working tree changes)
     */
    async getUnstagedDiff(): Promise<string> {
        return this.exec('git diff');
    }
    
    /**
     * Get list of staged files
     */
    async getStagedFiles(): Promise<string[]> {
        const output = await this.exec('git diff --cached --name-only');
        return output.trim().split('\n').filter(f => f.length > 0);
    }

    /**
     * Get list of unstaged files
     */
    async getUnstagedFiles(): Promise<string[]> {
        const output = await this.exec('git diff --name-only');
        return output.trim().split('\n').filter(f => f.length > 0);
    }
    
    /**
     * Get current branch name
     */
    async getCurrentBranch(): Promise<string> {
        try {
            return (await this.exec('git rev-parse --abbrev-ref HEAD')).trim();
        } catch {
            return 'unknown';
        }
    }
    
    /**
     * Check if there are staged changes
     */
    async hasStagedChanges(): Promise<boolean> {
        const files = await this.getStagedFiles();
        return files.length > 0;
    }

    /**
     * Check if there are unstaged changes
     */
    async hasUnstagedChanges(): Promise<boolean> {
        const files = await this.getUnstagedFiles();
        return files.length > 0;
    }
    
    /**
     * Execute a git command
     */
    private exec(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            cp.exec(command, { cwd: this.cwd, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}
