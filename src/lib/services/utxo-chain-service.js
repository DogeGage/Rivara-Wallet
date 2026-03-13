/**
 * Unified UTXO Chain Service
 * Handles Bitcoin, Litecoin, Dogecoin address derivation, balance, and transactions
 */

import { priceService } from './price-service';

const WORKER_URL = 'https://api.rivarawallet.xyz';

const CHAIN_CONFIGS = {
	bitcoin: {
		name: 'Bitcoin',
		symbol: 'BTC',
		coinType: 0,
		derivationPath: "m/44'/0'/0'/0/0",
		network: null,
		coingeckoId: 'bitcoin',
		blockchairEndpoint: 'bitcoin',
		defaultPrice: 95000
	},
	litecoin: {
		name: 'Litecoin',
		symbol: 'LTC',
		coinType: 2,
		derivationPath: "m/44'/2'/0'/0/0",
		network: {
			messagePrefix: '\x19Litecoin Signed Message:\n',
			bech32: 'ltc',
			bip32: { public: 0x019da462, private: 0x019d9cfe },
			pubKeyHash: 0x30,
			scriptHash: 0x32,
			wif: 0xb0
		},
		coingeckoId: 'litecoin',
		blockchairEndpoint: 'litecoin',
		defaultPrice: 100
	},
	dogecoin: {
		name: 'Dogecoin',
		symbol: 'DOGE',
		coinType: 3,
		derivationPath: "m/44'/3'/0'/0/0",
		network: {
			messagePrefix: '\x19Dogecoin Signed Message:\n',
			bech32: 'doge',
			bip32: { public: 0x02facafd, private: 0x02fac398 },
			pubKeyHash: 0x1e,
			scriptHash: 0x16,
			wif: 0x9e
		},
		coingeckoId: 'dogecoin',
		blockchairEndpoint: 'dogecoin',
		defaultPrice: 0.08
	}
};

class UtxoChainService {
	constructor(chain) {
		this.chain = chain;
		this.config = CHAIN_CONFIGS[chain];
		if (!this.config) {
			throw new Error(`Unsupported UTXO chain: ${chain}`);
		}
		this.cachedPrice = this.config.defaultPrice;
	}

	/**
	 * Derive address from mnemonic
	 */
	deriveAddress(mnemonic) {
		const { ethers, bitcoin } = window.cryptoLibs;

		const seed = ethers.utils.mnemonicToSeed(mnemonic);
		const seedBuffer = Buffer.from(seed.slice(2), 'hex');
		const root = bitcoin.bip32.fromSeed(seedBuffer, this.config.network);
		const child = root.derivePath(this.config.derivationPath);

		const { address } = bitcoin.payments.p2pkh({
			pubkey: child.publicKey,
			network: this.config.network || bitcoin.networks.bitcoin
		});

		return {
			address: address,
			publicKey: child.publicKey.toString('hex')
		};
	}

	/**
	 * Get balance in native units
	 */
	async getBalance(address) {
		try {
			const url = `${WORKER_URL}/api/blockchair/${this.config.blockchairEndpoint}/${address}`;
			const response = await fetch(url);
			const data = await response.json();
			if (data?.data?.[address]?.address?.balance !== undefined) {
				return (data.data[address].address.balance / 100000000).toFixed(8);
			}
			return '0.00000000';
		} catch (error) {
			console.error(`Failed to fetch ${this.config.name} balance:`, error);
			return '0.00000000';
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
				balance,
				balanceUSD: (parseFloat(balance) * this.cachedPrice).toFixed(2),
				price: this.cachedPrice
			};
		} catch (error) {
			console.error(`Failed to get ${this.config.name} price:`, error);
			return {
				balance,
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
			const url = `${WORKER_URL}/api/blockchair/${this.config.blockchairEndpoint}/${address}`;
			const response = await fetch(url);
			const data = await response.json();
			const txs = data?.data?.[address]?.transactions;
			if (txs && txs.length > 0) {
				return txs.slice(0, 10).map(hash => ({ hash, timestamp: Date.now(), type: 'unknown', value: '0' }));
			}
			return [];
		} catch (error) {
			console.error(`Failed to fetch ${this.config.name} transactions:`, error);
			return [];
		}
	}
}

// Export individual chain classes for backwards compatibility
class BitcoinService extends UtxoChainService {
	constructor() {
		super('bitcoin');
	}
}

class LitecoinService extends UtxoChainService {
	constructor() {
		super('litecoin');
	}
}

class DogecoinService extends UtxoChainService {
	constructor() {
		super('dogecoin');
	}
}

// Export for ES modules
export { UtxoChainService, BitcoinService, DogecoinService, LitecoinService };

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

