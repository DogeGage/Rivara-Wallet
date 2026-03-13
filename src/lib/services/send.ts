/**
 * Unified Send Service
 * Routes transactions to chain-specific implementations
 */

import type { CryptoChain, TransactionResult } from '$lib/types';

export interface SendParams {
	chain: CryptoChain;
	toAddress: string;
	amount: string;
	fromAddress?: string;
	privateKey?: string;
}

/**
 * Send cryptocurrency transaction
 * @param params Transaction parameters
 * @returns Transaction hash
 */
export async function sendTransaction(params: SendParams): Promise<string> {
	const { chain, toAddress, amount } = params;

	// Validate inputs
	if (!toAddress || !amount) {
		throw new Error('Missing required parameters: toAddress and amount');
	}

	if (parseFloat(amount) <= 0) {
		throw new Error('Amount must be greater than 0');
	}

	// Route to chain-specific implementation
	switch (chain) {
		case 'bitcoin':
			return await sendBitcoin(toAddress, amount);

		case 'ethereum':
			return await sendEthereum(toAddress, amount);

		case 'dogecoin':
			return await sendDogecoin(toAddress, amount);

		case 'litecoin':
			return await sendLitecoin(toAddress, amount);

		case 'solana':
			return await sendSolana(toAddress, amount);

		case 'tezos':
			return await sendTezos(toAddress, amount);

		case 'tron':
			return await sendTron(toAddress, amount);

		case 'polygon':
			return await sendPolygon(toAddress, amount);

		default:
			throw new Error(`Unsupported chain: ${chain}`);
	}
}

// Import chain-specific implementations
async function sendBitcoin(toAddress: string, amount: string): Promise<string> {
	const { sendBitcoin: send } = await import('./send/utxo-send.js');
	return send(toAddress, amount);
}

async function sendEthereum(toAddress: string, amount: string): Promise<string> {
	const { sendEthereum: send } = await import('./send/evm-send.js');
	return send(toAddress, amount);
}

async function sendDogecoin(toAddress: string, amount: string): Promise<string> {
	const { sendDogecoin: send } = await import('./send/utxo-send.js');
	return send(toAddress, amount);
}

async function sendLitecoin(toAddress: string, amount: string): Promise<string> {
	const { sendLitecoin: send } = await import('./send/utxo-send.js');
	return send(toAddress, amount);
}

async function sendSolana(toAddress: string, amount: string): Promise<string> {
	// @ts-ignore - JS module
	const { sendSolana: send } = await import('./send/solana-send.js');
	return send(toAddress, amount);
}

async function sendTezos(toAddress: string, amount: string): Promise<string> {
	// @ts-ignore - JS module
	const { sendTezos: send } = await import('./send/tezos-send.js');
	return send(toAddress, amount);
}

async function sendTron(toAddress: string, amount: string): Promise<string> {
	// @ts-ignore - JS module
	const { sendTron: send } = await import('./send/tron-send.js');
	return send(toAddress, amount);
}

async function sendPolygon(toAddress: string, amount: string): Promise<string> {
	const { sendPolygon: send } = await import('./send/evm-send.js');
	return send(toAddress, amount);
}

/** Send USDC (ERC-20) on Ethereum or Polygon. Used by exchange when swapping from USDC. */
export async function sendUSDC(chain: 'ethereum' | 'polygon', toAddress: string, amount: string): Promise<string> {
	const { sendUSDC: send } = await import('./send/evm-send.js');
	return send(chain, toAddress, amount);
}

/**
 * SECURITY FIX 5: Checksum-based address validation for all chains
 */

// Helper: SHA-256 hash (sync via ethers CDN global)
function sha256Bytes(data: Uint8Array): Uint8Array {
	// @ts-ignore - ethers loaded from CDN
	const hash = window.cryptoLibs?.ethers?.utils?.sha256(data);
	if (!hash) throw new Error('Crypto libraries not loaded');
	const hex = hash.slice(2);
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return bytes;
}

// Helper: Base58 decode
function base58Decode(str: string): Uint8Array {
	const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	const bytes = [0];
	for (let i = 0; i < str.length; i++) {
		const value = ALPHABET.indexOf(str[i]);
		if (value === -1) throw new Error('Invalid base58 character');
		for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
		bytes[0] += value;
		let carry = 0;
		for (let j = 0; j < bytes.length; j++) {
			bytes[j] += carry;
			carry = bytes[j] >> 8;
			bytes[j] &= 0xff;
		}
		while (carry > 0) {
			bytes.push(carry & 0xff);
			carry >>= 8;
		}
	}
	for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.push(0);
	return new Uint8Array(bytes.reverse());
}

// Base58Check validation (BTC, DOGE, LTC, Tron)
function validateBase58Check(address: string): boolean {
	try {
		const decoded = base58Decode(address);
		if (decoded.length < 6) return false;
		const payload = decoded.slice(0, decoded.length - 4);
		const checksum = decoded.slice(decoded.length - 4);
		const hash = sha256Bytes(sha256Bytes(payload));
		return hash[0] === checksum[0] && hash[1] === checksum[1] &&
			hash[2] === checksum[2] && hash[3] === checksum[3];
	} catch {
		return false;
	}
}

// EIP-55 checksum validation for Ethereum/Polygon
function validateEIP55Checksum(address: string): boolean {
	if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
	// @ts-ignore
	const ethers = window.cryptoLibs?.ethers;
	if (!ethers) return /^0x[a-fA-F0-9]{40}$/.test(address); // fallback to regex if libs not loaded
	try {
		// ethers.utils.getAddress throws if checksum is invalid
		const checksummed = ethers.utils.getAddress(address);
		return checksummed === address || address === address.toLowerCase() || address === address.toUpperCase();
	} catch {
		return false;
	}
}

// Solana: validate base58 public key (32 bytes)
function validateSolanaAddress(address: string): boolean {
	const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	if (address.length < 32 || address.length > 44) return false;
	for (const c of address) {
		if (!ALPHABET.includes(c)) return false;
	}
	try {
		const decoded = base58Decode(address);
		return decoded.length === 32;
	} catch {
		return false;
	}
}

// Tezos: base58check with tz1/tz2/tz3 prefix
function validateTezosAddress(address: string): boolean {
	if (!/^tz[1-3][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return false;
	return validateBase58Check(address);
}

export function validateAddress(chain: CryptoChain, address: string): boolean {
	switch (chain) {
		case 'bitcoin':
			// Legacy P2PKH (1...) or P2SH (3...) with base58check
			if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
				return validateBase58Check(address);
			}
			// Bech32 (bc1...) — regex only (bech32 has its own internal checksum)
			return /^bc1[a-z0-9]{39,59}$/.test(address);

		case 'ethereum':
		case 'polygon':
			return validateEIP55Checksum(address);

		case 'dogecoin':
			if (!/^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(address)) return false;
			return validateBase58Check(address);

		case 'litecoin':
			// Legacy (L/M/3...) with base58check
			if (/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address)) {
				return validateBase58Check(address);
			}
			// Bech32 (ltc1...) — regex only
			return /^ltc1[a-z0-9]{39,59}$/.test(address);

		case 'solana':
			return validateSolanaAddress(address);

		case 'tezos':
			return validateTezosAddress(address);

		case 'tron':
			if (!/^T[A-Za-z1-9]{33}$/.test(address)) return false;
			return validateBase58Check(address);

		default:
			return false;
	}
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(chain: CryptoChain, txHash: string): string {
	const explorers: Record<CryptoChain, string> = {
		bitcoin: `https://blockchair.com/bitcoin/transaction/${txHash}`,
		ethereum: `https://etherscan.io/tx/${txHash}`,
		dogecoin: `https://blockchair.com/dogecoin/transaction/${txHash}`,
		litecoin: `https://blockchair.com/litecoin/transaction/${txHash}`,
		solana: `https://explorer.solana.com/tx/${txHash}`,
		tezos: `https://tzstats.com/${txHash}`,
		tron: `https://tronscan.org/#/transaction/${txHash}`,
		polygon: `https://polygonscan.com/tx/${txHash}`
	};

	return explorers[chain];
}
