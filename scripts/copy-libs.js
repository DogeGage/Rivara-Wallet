import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dest = resolve(root, 'static/libs');

mkdirSync(dest, { recursive: true });

const libs = [
	['chart.js/dist/chart.umd.js',                         'chart.umd.min.js'],
	['ethers/dist/ethers.umd.min.js',                      'ethers.umd.min.js'],
	['bitcoinjs-lib-browser/bitcoinjs.min.js',             'bitcoinjs.min.js'],
	['tronweb/dist/TronWeb.js',                            'TronWeb.js'],
	['tweetnacl/nacl-fast.min.js',                         'nacl-fast.min.js'],
	['@solana/web3.js/lib/index.iife.min.js',              'solana-web3.iife.min.js'],
];

for (const [src, out] of libs) {
	const from = resolve(root, 'node_modules', src);
	const to = resolve(dest, out);
	copyFileSync(from, to);
	console.log(`copied ${src} → static/libs/${out}`);
}
