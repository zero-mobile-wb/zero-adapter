import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: process.env.NODE_ENV === 'production',
    external: [
        '@solana/wallet-adapter-base',
        '@solana/web3.js',
        '@solana/wallet-standard-features',
        '@wallet-standard/core',
        '@wallet-standard/features',
        '@wallet-standard/wallet'
    ],
});
