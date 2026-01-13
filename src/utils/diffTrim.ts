export function trimDiffSmart(diff: string, maxChars: number): { text: string; trimmed: boolean } {
    if (diff.length <= maxChars) {
        return { text: diff, trimmed: false };
    }

    const blocks = splitDiffByFile(diff);
    if (blocks.length <= 1) {
        return { text: diff.slice(0, maxChars) + '\n\n... (diff truncated)', trimmed: true };
    }

    const budget = Math.max(200, maxChars - 40);
    let out = '';

    for (const block of blocks) {
        if (out.length >= budget) break;

        const trimmedBlock = summarizeDiffBlock(block, budget - out.length);
        out += (out ? '\n' : '') + trimmedBlock;
    }

    const final = out.length > maxChars ? out.slice(0, maxChars) : out;
    const trimmed = final.length < diff.length;
    return {
        text: trimmed ? final + '\n\n... (diff trimmed)' : final,
        trimmed
    };
}

function splitDiffByFile(diff: string): string[] {
    const re = /^diff --git .*$/gm;
    const matches: Array<{ index: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(diff)) !== null) {
        matches.push({ index: m.index });
    }
    if (matches.length === 0) return [diff];

    const blocks: string[] = [];
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i + 1 < matches.length ? matches[i + 1].index : diff.length;
        blocks.push(diff.slice(start, end).trimEnd());
    }
    return blocks;
}

function summarizeDiffBlock(block: string, remaining: number): string {
    if (block.length <= remaining) return block;

    const lines = block.split(/\r?\n/);
    const header: string[] = [];
    const important: string[] = [];

    const signatureLike = /^(?:[+\- ]\s*)?(export\s+)?(default\s+)?(async\s+)?(function|class|interface|type|enum)\b|^(?:[+\- ]\s*)?(def|class)\s+\w+|^(?:[+\- ]\s*)?(func)\s+\w+|^(?:[+\- ]\s*)?(public|private|protected)\b/;
    const commentLike = /^(?:[+\- ]\s*)?(\/\/|#|\/\*|\*|\s*\*\/)/;
    const importLike = /^(?:[+\- ]\s*)?(import\s+|from\s+\S+\s+import\s+)/;

    let inHunk = false;
    let hunkChangeCount = 0;

    for (const line of lines) {
        if (header.length < 12 && !line.startsWith('@@')) {
            header.push(line);
            continue;
        }

        if (line.startsWith('@@')) {
            inHunk = true;
            hunkChangeCount = 0;
            important.push(line);
            continue;
        }

        if (!inHunk) continue;

        const isChange = line.startsWith('+') || line.startsWith('-');
        if (isChange) hunkChangeCount++;

        if (isChange && hunkChangeCount <= 6) {
            important.push(line);
            continue;
        }

        if (signatureLike.test(line) || commentLike.test(line) || importLike.test(line)) {
            important.push(line);
        }
    }

    const combined = [...header, ...important];
    const result = combined.join('\n');
    return result.length > remaining ? result.slice(0, remaining) : result;
}

