import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills({
			include: ['buffer', 'process', 'stream', 'util'],
			globals: {
				Buffer: true,
				global: true,
				process: true
			}
		})
	],
	server: {
		port: 5173,
		strictPort: false
	},
	optimizeDeps: {
		exclude: ['@solana/web3.js'],
		esbuildOptions: {
			target: 'esnext',
			define: {
				global: 'globalThis'
			}
		}
	},
	build: {
		target: 'esnext',
		commonjsOptions: {
			transformMixedEsModules: true
		},
		// SECURITY FIX 8: Strip console.log/warn from production bundles
		// to prevent internal state leakage. console.error is preserved.
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: undefined
			}
		}
	},
	esbuild: {
		drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
	}
});
