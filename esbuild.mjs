import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node16',
    sourcemap: true,
    minify: production,
    outfile: 'dist/extension.js',
    external: ['vscode']
});

if (watch) {
    await ctx.watch();
    // eslint-disable-next-line no-console
    console.log('esbuild: watching...');
} else {
    await ctx.rebuild();
    await ctx.dispose();
}

