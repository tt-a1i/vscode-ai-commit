export type ConventionalType =
    | 'feat'
    | 'fix'
    | 'docs'
    | 'style'
    | 'refactor'
    | 'perf'
    | 'test'
    | 'build'
    | 'ci'
    | 'chore'
    | 'revert';

export function inferType(files: string[], allowedTypes?: string[]): string {
    const normalized = files.map(f => f.replace(/\\/g, '/'));

    const isDocsFile = (f: string) =>
        f === 'README.md' ||
        f.endsWith('.md') ||
        f.startsWith('docs/') ||
        f.startsWith('doc/') ||
        f.startsWith('documentation/') ||
        f === 'CHANGELOG.md' ||
        f === 'LICENSE';

    const isTestFile = (f: string) =>
        f.startsWith('test/') ||
        f.startsWith('tests/') ||
        f.includes('__tests__/') ||
        /\.(test|spec)\.[jt]sx?$/.test(f) ||
        f.endsWith('.snap');

    const isCIFile = (f: string) =>
        f.startsWith('.github/workflows/') ||
        f.startsWith('.github/actions/') ||
        f.startsWith('ci/');

    const isBuildFile = (f: string) =>
        f === 'package.json' ||
        f === 'package-lock.json' ||
        f === 'pnpm-lock.yaml' ||
        f === 'yarn.lock' ||
        f === 'tsconfig.json' ||
        f.endsWith('.gradle') ||
        f === 'Cargo.toml' ||
        f === 'go.mod' ||
        f === 'pyproject.toml' ||
        f === 'requirements.txt' ||
        f === 'poetry.lock';

    const allDocs = normalized.length > 0 && normalized.every(isDocsFile);
    const allTests = normalized.length > 0 && normalized.every(isTestFile);
    const anyCI = normalized.some(isCIFile);
    const anyBuild = normalized.some(isBuildFile);

    let inferred: ConventionalType = 'chore';
    if (anyCI) inferred = 'ci';
    else if (anyBuild) inferred = 'build';
    else if (allDocs) inferred = 'docs';
    else if (allTests) inferred = 'test';
    else inferred = 'feat';

    if (allowedTypes && allowedTypes.length > 0) {
        const allowed = new Set(allowedTypes);
        if (allowed.has(inferred)) return inferred;
        if (allowed.has('chore')) return 'chore';
        return allowedTypes[0];
    }

    return inferred;
}

export function inferScope(files: string[], allowedScopes?: string[]): string {
    const normalized = files.map(f => f.replace(/\\/g, '/')).filter(Boolean);
    const candidates: string[] = [];

    for (const file of normalized) {
        const parts = file.split('/').filter(Boolean);
        if (parts.length === 0) continue;

        if (parts[0] === 'packages' && parts.length >= 2) {
            candidates.push(parts[1]);
            continue;
        }

        const ignored = new Set(['src', 'app', 'lib', 'packages', 'test', 'tests', 'docs', '.github']);
        if (parts.length >= 2 && ignored.has(parts[0])) {
            candidates.push(parts[1]);
            continue;
        }

        candidates.push(parts[0]);
    }

    const counts = new Map<string, number>();
    for (const c of candidates) {
        const cleaned = c.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        if (!cleaned) continue;
        counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
    }

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const best = sorted[0]?.[0] ?? '';
    const second = sorted[1]?.[0];

    if (!best) return '';
    if (second && sorted[0][1] === sorted[1][1]) return '';

    if (allowedScopes && allowedScopes.length > 0) {
        const allowedMap = new Map<string, string>();
        for (const s of allowedScopes) {
            const lower = s.toLowerCase();
            if (!allowedMap.has(lower)) {
                allowedMap.set(lower, s);
            }
        }
        return allowedMap.get(best) ?? '';
    }

    return best;
}
