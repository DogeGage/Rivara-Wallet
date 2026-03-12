/**
 * Unified EVM Chain Service
 * Handles Ethereum, Polygon address derivation, balance, and transactions
 */

const WORKER_URL = 'https://api.rivarawallet.xyz';

const CHAIN_CONFIGS = {
	ethereum: {
		name: 'Ethereum',
		symbol: 'ETH',
		chainId: 1,
		rpcUrl: `${WORKER_URL}/api/infura`,
		rpcFallback: `${WORKER_URL}/api/infura`,
		coingeckoId: 'ethereum',
		scanApi: 'https://api.etherscan.io/api',
		explorer: 'https://etherscan.io/tx/',
		defaultPrice: 3000
	},
	polygon: {
		name: 'Polygon',
		symbol: 'POL',
		chainId: 137,
		rpcUrl: `${WORKER_URL}/api/polygon/rpc`,
		rpcFallback: `${WORKER_URL}/api/polygon/rpc`,
		coingeckoId: 'matic-network',
		scanApi: 'https://api.polygonscan.com/api',
		explorer: 'https://polygonscan.com/tx/',
		defaultPrice: 0.50
	}
};

class EvmChainService {
	constructor(chain, infuraApiKey = null) {
		this.chain = chain;
		this.config = CHAIN_CONFIGS[chain];
		if (!this.config) {
			throw new Error(`Unsupported EVM chain: ${chain}`);
		}
		this.infuraApiKey = infuraApiKey;
		this.provider = null;
		this.cachedPrice = this.config.defaultPrice;

		this.initProvider();
	}

	initProvider() {
		if (!window.cryptoLibs?.ethers) {
			console.warn(`Ethers not loaded yet for ${this.config.name}, will retry on use`);
			return;
		}

		const { ethers } = window.cryptoLibs;

		try {
			if (this.chain === 'ethereum' && this.infuraApiKey) {
				this.provider = new ethers.providers.InfuraProvider('mainnet', this.infuraApiKey);
			} else if (this.config.rpcUrl) {
				this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
			}
		} catch (error) {
			console.warn(`Failed to init ${this.config.name} provider with primary RPC, trying fallback...`);
			try {
				if (this.config.rpcFallback) {
					this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcFallback);
				}
			} catch (fallbackError) {
				console.error(`Failed to init ${this.config.name} provider with fallback RPC:`, fallbackError);
			}
		}
	}

	// Ensure provider is ready before use
	async ensureProvider() {
		if (this.provider) return;

		// Retry init if ethers wasn't loaded before
		if (window.cryptoLibs?.ethers) {
			this.initProvider();
		}

		// Wait a bit for ethers to load if still not available
		if (!this.provider) {
			for (let i = 0; i < 10; i++) {
				await new Promise(resolve => setTimeout(resolve, 200));
				if (window.cryptoLibs?.ethers) {
					this.initProvider();
					if (this.provider) break;
				}
			}
		}

		if (!this.provider) {
			throw new Error(`Provider not initialized for ${this.config.name}`);
		}
	}

	setInfuraKey(apiKey) {
		this.infuraApiKey = apiKey;
		this.initProvider();
	}

	/**
	 * Derive address from mnemonic
	 */
	deriveAddress(mnemonic) {
		const { ethers } = window.cryptoLibs;
		const wallet = ethers.Wallet.fromMnemonic(mnemonic);
		return {
			address: wallet.address,
			privateKey: wallet.privateKey
		};
	}

	/**
	 * Get balance in native units
	 */
	async getBalance(address) {
		await this.ensureProvider();

		const { ethers } = window.cryptoLibs;
		const balance = await this.provider.getBalance(address);
		return ethers.utils.formatEther(balance);
	}

	/**
	 * Get balance with USD value
	 */
	async getBalanceUSD(address) {
		const balance = await this.getBalance(address);

		try {
			const response = await fetch(`https://api.rivarawallet.xyz/api/coingecko/prices?ids=${this.config.coingeckoId}`);
			const data = await response.json();
			const price = data[this.config.coingeckoId]?.usd;

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
	 * Send transaction
	 */
	async sendTransaction(mnemonic, toAddress, amount) {
		await this.ensureProvider();

		const { ethers } = window.cryptoLibs;
		const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(this.provider);

		const tx = {
			to: toAddress,
			value: ethers.utils.parseEther(amount.toString())
		};

		const transaction = await wallet.sendTransaction(tx);
		await transaction.wait();

		return transaction.hash;
	}

	/**
	 * Estimate transaction fee
	 */
	async estimateFee(toAddress, amount) {
		try {
			if (!this.provider) {
				return '0.001';
			}

			const { ethers } = window.cryptoLibs;
			const dummyWallet = ethers.Wallet.fromMnemonic('test test test test test test test test test test test junk').connect(this.provider);

			const tx = {
				to: toAddress,
				value: ethers.utils.parseEther(amount.toString())
			};

			const gasEstimate = await dummyWallet.estimateGas(tx);
			const gasPrice = await this.provider.getGasPrice();
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
			const response = await fetch(`https://api.rivarawallet.xyz/api/coingecko/prices?ids=${this.config.coingeckoId}`);
			const data = await response.json();
			const price = data[this.config.coingeckoId]?.usd;

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
	constructor(infuraApiKey) {
		super('ethereum', infuraApiKey);
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

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

export { EvmChainService as EVMChainService, EthereumService, PolygonService };

