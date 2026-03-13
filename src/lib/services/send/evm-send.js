/**
 * Unified EVM-based Send Service
 * Handles Ethereum, Polygon (and any other EVM chains)
 * SECURITY: Derives private key on-demand, clears after use
 */

import { walletService } from '../wallet-service';
import { deriveEvmPrivateKey } from '../key-derivation-service';

// Network configurations
const NETWORKS = {
	ethereum: {
		name: 'ethereum',
		chainId: 1,
		// Frontend always talks to our worker; backend can use Alchemy/NOWNodes
		rpcUrl: 'https://api.rivarawallet.xyz/api/infura',
		nativeCurrency: 'ETH',
		explorer: 'https://etherscan.io/tx/'
	},
	polygon: {
		name: 'polygon',
		chainId: 137,
		rpcUrl: 'https://api.rivarawallet.xyz/api/polygon/rpc',
		nativeCurrency: 'POL',
		explorer: 'https://polygonscan.com/tx/'
	}
};

/**
 * Send EVM-based cryptocurrency
 * @param {string} chain - 'ethereum' or 'polygon'
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount to send (in base units: ETH, POL)
 */
export async function sendEvm(chain, toAddress, amount) {
	let privateKey = null;
	try {
		const config = NETWORKS[chain];
		if (!config) {
			throw new Error(`Unsupported EVM chain: ${chain}`);
		}

		const wallet = walletService.getWallet();
		if (!wallet) throw new Error('Wallet not found');

		const { ethers } = window.cryptoLibs;

		// SECURITY: Derive private key on-demand
		privateKey = await deriveEvmPrivateKey();

		// Create provider (via our worker RPC)
		const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

		// Create wallet from derived private key
		const evmWallet = new ethers.Wallet(privateKey, provider);

		// Convert amount to wei
		const amountWei = ethers.utils.parseEther(amount);

		// Get gas price
		const gasPrice = await provider.getGasPrice();

		// Create transaction
		const tx = {
			to: toAddress,
			value: amountWei,
			gasLimit: 21000,
			gasPrice: gasPrice
		};

		// Send transaction
		const transaction = await evmWallet.sendTransaction(tx);

		// Wait for confirmation
		await transaction.wait();

		return transaction.hash;

	} catch (error) {
		throw error;
	} finally {
		// SECURITY: Clear private key from memory
		privateKey = null;
	}
}

/**
 * Send ERC-20 token (e.g. USDC) on Ethereum or Polygon
 * @param {string} chain - 'ethereum' or 'polygon'
 * @param {string} contractAddress - ERC-20 contract address
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Human-readable amount
 * @param {number} decimals - Token decimals (USDC = 6)
 */
export async function sendEvmToken(chain, contractAddress, toAddress, amount, decimals = 18) {
	let privateKey = null;
	try {
		const config = NETWORKS[chain];
		if (!config) throw new Error(`Unsupported EVM chain: ${chain}`);

		const wallet = walletService.getWallet();
		if (!wallet) throw new Error('Wallet not found');

		const { ethers } = window.cryptoLibs;
		privateKey = await deriveEvmPrivateKey();

		const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

		const evmWallet = new ethers.Wallet(privateKey, provider);
		const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
		const contract = new ethers.Contract(contractAddress, abi, evmWallet);
		const amountWei = ethers.utils.parseUnits(amount, decimals);

		const tx = await contract.transfer(toAddress, amountWei);
		await tx.wait();
		return tx.hash;
	} finally {
		privateKey = null;
	}
}

const USDC_CONTRACTS = {
	ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
	polygon: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
};
const USDC_DECIMALS = 6;

export async function sendUSDC(chain, toAddress, amount) {
	const contract = USDC_CONTRACTS[chain];
	if (!contract) throw new Error(`USDC not supported on chain: ${chain}`);
	return sendEvmToken(chain, contract, toAddress, amount, USDC_DECIMALS);
}

// Export individual chain functions for backwards compatibility
export async function sendEthereum(toAddress, amount) {
	return sendEvm('ethereum', toAddress, amount);
}

export async function sendPolygon(toAddress, amount) {
	return sendEvm('polygon', toAddress, amount);
}
