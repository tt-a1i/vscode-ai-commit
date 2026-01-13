export function normalizeCommitMessage(raw: string, options: { headerOnly: boolean }): string {
    let text = raw ?? '';

    // Remove surrounding markdown code fences
    text = text.replace(/```[\s\S]*?```/g, (block) => {
        // If it's a fenced block, try to strip the fences and keep inner content.
        const lines = block.split(/\r?\n/);
        if (lines.length >= 2 && lines[0].startsWith('```') && lines[lines.length - 1].startsWith('```')) {
            return lines.slice(1, -1).join('\n');
        }
        return '';
    });

    // Strip common prefixes
    text = text.replace(/^\s*(commit message|message)\s*:\s*/i, '');

    // Trim and normalize newlines
    text = text.replace(/\r\n/g, '\n').trim();

    // Strip wrapping quotes
    text = text.replace(/^["'`]+|["'`]+$/g, '').trim();

    if (options.headerOnly) {
        // Take first non-empty line
        const line = text.split('\n').map(l => l.trim()).find(l => l.length > 0) ?? '';
        return line;
    }

    // For multi-line, collapse excessive blank lines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
}

