/**
 * Unified EVM Chain Service
 * Handles Ethereum, Polygon address derivation, balance, and transactions
 * Now uses Worker endpoints instead of direct RPC calls
 */

import { priceService } from './price-service';

const WORKER_URL = 'https://api.rivarawallet.xyz';

const CHAIN_CONFIGS = {
	ethereum: {
		name: 'Ethereum',
		symbol: 'ETH',
		chainId: 1,
		blockchain: 'eth',
		coingeckoId: 'ethereum',
		scanApi: 'https://api.etherscan.io/api',
		explorer: 'https://etherscan.io/tx/',
		defaultPrice: 3000
	},
	polygon: {
		name: 'Polygon',
		symbol: 'POL',
		chainId: 137,
		blockchain: 'polygon',
		coingeckoId: 'matic-network',
		scanApi: 'https://api.polygonscan.com/api',
		explorer: 'https://polygonscan.com/tx/',
		defaultPrice: 0.50
	},
	avalanche: {
		name: 'Avalanche',
		symbol: 'AVAX',
		chainId: 43114,
		blockchain: 'avalanche',
		coingeckoId: 'avalanche-2',
		scanApi: 'https://api.snowtrace.io/api',
		explorer: 'https://snowtrace.io/tx/',
		defaultPrice: 35
	},
	bsc: {
		name: 'BNB Smart Chain',
		symbol: 'BNB',
		chainId: 56,
		blockchain: 'bsc',
		coingeckoId: 'binancecoin',
		scanApi: 'https://api.bscscan.com/api',
		explorer: 'https://bscscan.com/tx/',
		defaultPrice: 600
	}
};

class EvmChainService {
	constructor(chain) {
		this.chain = chain;
		this.config = CHAIN_CONFIGS[chain];
		if (!this.config) {
			throw new Error(`Unsupported EVM chain: ${chain}`);
		}
		this.cachedPrice = this.config.defaultPrice;
	}

	/**
	 * Derive address from mnemonic
	 */
	deriveAddress(mnemonic) {
		const { ethers } = window.cryptoLibs;
		const wallet = ethers.Wallet.fromMnemonic(mnemonic);
		
		// For AVAX, we need to handle C-Chain (EVM) addresses
		// C-Chain uses standard EVM addresses (0x...)
		// X-Chain and P-Chain use bech32 format (X-/P-avax...)
		// For wallet purposes, we'll use C-Chain which is EVM-compatible
		if (this.chain === 'avalanche') {
			// C-Chain uses the same address as Ethereum
			return {
				address: wallet.address, // This is the C-Chain address
				privateKey: wallet.privateKey
			};
		}
		
		// For BSC, it uses standard EVM addresses
		// BSC is a fork of Ethereum and uses the same address format
		if (this.chain === 'bsc') {
			return {
				address: wallet.address,
				privateKey: wallet.privateKey
			};
		}
		
		// Standard EVM chains (Ethereum, Polygon)
		return {
			address: wallet.address,
			privateKey: wallet.privateKey
		};
	}

	/**
	 * Get balance in native units via Worker Ankr endpoint
	 */
	async getBalance(address) {
		try {
			console.log(`Fetching ${this.config.name} balance via Worker Ankr endpoint`);

			const response = await fetch(`${WORKER_URL}/api/ankr/scan`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					walletAddress: address,
					blockchains: [this.config.blockchain]
				})
			});

			if (!response.ok) {
				throw new Error(`Worker returned ${response.status}`);
			}

			const data = await response.json();
			const assets = data?.assets || [];

			// Find native asset (no contract address)
			const nativeAsset = assets.find(asset => 
				asset.blockchain === this.config.blockchain && !asset.contractAddress
			);

			if (nativeAsset && nativeAsset.balance !== undefined) {
				return parseFloat(nativeAsset.balance).toFixed(6);
			}

			return '0.000000';
		} catch (error) {
			console.error(`Failed to fetch ${this.config.name} balance:`, error);
			return '0.000000';
		}
	}

	/**
	 * Get balance with USD value
	 */
	async getBalanceUSD(address) {
		const balance = await this.getBalance(address);

		try {
			const price = await priceService.getPrice(this.config.coingeckoId);

			if (price && price > 0) {
				this.cachedPrice = price;
			}

			return {
				balance: parseFloat(balance).toFixed(4),
				balanceUSD: (parseFloat(balance) * this.cachedPrice).toFixed(2),
				price: this.cachedPrice
			};
		} catch (error) {
			console.error(`Failed to get ${this.config.name} price:`, error);
			return {
				balance: parseFloat(balance).toFixed(4),
				balanceUSD: (parseFloat(balance) * this.cachedPrice).toFixed(2),
				price: this.cachedPrice
			};
		}
	}

	/**
	 * Get recent transactions
	 */
	async getTransactions(address) {
		try {
			const response = await fetch(`${this.config.scanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`);
			const data = await response.json();

			if (data.status === '1' && data.result) {
				const { ethers } = window.cryptoLibs;
				return data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: ethers.utils.formatEther(tx.value),
					timestamp: parseInt(tx.timeStamp) * 1000,
					type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received'
				}));
			}
			return [];
		} catch (error) {
			console.error(`Failed to fetch ${this.config.name} transactions:`, error);
			return [];
		}
	}

	/**
	 * Send transaction - uses Worker's RPC proxy
	 */
	async sendTransaction(mnemonic, toAddress, amount) {
		const { ethers } = window.cryptoLibs;
		
		// Use Worker's RPC proxy for sending transactions
		const rpcUrl = `${WORKER_URL}/api/${this.chain}/rpc`;
		
		const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
		const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);

		const tx = {
			to: toAddress,
			value: ethers.utils.parseEther(amount.toString())
		};

		const transaction = await wallet.sendTransaction(tx);
		await transaction.wait();

		return transaction.hash;
	}

	/**
	 * Estimate transaction fee - uses Worker's RPC proxy
	 */
	async estimateFee(toAddress, amount) {
		try {
			const { ethers } = window.cryptoLibs;
			
			// Use Worker's RPC proxy for fee estimation
			const rpcUrl = `${WORKER_URL}/api/${this.chain}/rpc`;
			
			const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
			const dummyWallet = ethers.Wallet.fromMnemonic('test test test test test test test test test test test junk').connect(provider);

			const tx = {
				to: toAddress,
				value: ethers.utils.parseEther(amount.toString())
			};

			const gasEstimate = await dummyWallet.estimateGas(tx);
			const gasPrice = await provider.getGasPrice();
			const gasCost = gasEstimate.mul(gasPrice);

			return ethers.utils.formatEther(gasCost);
		} catch (error) {
			console.error(`Error estimating ${this.config.name} fee:`, error);
			return '0.001';
		}
	}

	/**
	 * Get current price
	 */
	async getPrice() {
		try {
			const price = await priceService.getPrice(this.config.coingeckoId);

			if (price && price > 0) {
				this.cachedPrice = price;
			}

			return this.cachedPrice;
		} catch (error) {
			console.error(`Error fetching ${this.config.name} price:`, error);
			return this.cachedPrice;
		}
	}
}

// Export individual chain classes for backwards compatibility
class EthereumService extends EvmChainService {
	constructor() {
		super('ethereum');
	}
}

class PolygonService extends EvmChainService {
	constructor() {
		super('polygon');
	}

	// Alias for backwards compatibility
	async getAddress(mnemonic) {
		return this.deriveAddress(mnemonic).address;
	}
}

class AvalancheService extends EvmChainService {
	constructor() {
		super('avalanche');
	}
}

class BscService extends EvmChainService {
	constructor() {
		super('bsc');
	}
}

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

export { EvmChainService as EVMChainService, EthereumService, PolygonService, AvalancheService, BscService };

