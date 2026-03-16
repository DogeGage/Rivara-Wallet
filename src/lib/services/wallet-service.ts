import { wallet, isUnlocked, balancesLoading } from '$lib/stores/wallet';
import { get } from 'svelte/store';
import { BitcoinService, DogecoinService, LitecoinService } from './utxo-chain-service.js';
import { EthereumService, PolygonService, EVMChainService, AvalancheService, BscService } from './evm-chain-service.js';
import { SolanaService } from './solana-service.js';
import { TronService } from './tron-service.js';
import { DGAGEService } from './dgage-service.js';
// @ts-ignore - JS module
import { TokenScanner } from './token-scanner.js';

// SECURITY: HMAC key for cached balance integrity (generated per-session)
let _sessionHmacKey: CryptoKey | null = null;

async function getSessionHmacKey(): Promise<CryptoKey> {
	if (_sessionHmacKey) return _sessionHmacKey;

	// Generate a random key per session for HMAC on cached balances
	_sessionHmacKey = await crypto.subtle.generateKey(
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
	return _sessionHmacKey;
}

async function computeHmac(data: string): Promise<string> {
	const key = await getSessionHmacKey();
	const encoded = new TextEncoder().encode(data);
	const sig = await crypto.subtle.sign('HMAC', key, encoded);
	return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyHmac(data: string, hmac: string): Promise<boolean> {
	const key = await getSessionHmacKey();
	const encoded = new TextEncoder().encode(data);
	const sigBytes = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));
	return crypto.subtle.verify('HMAC', key, sigBytes, encoded);
}

class WalletService {
	private isFetching = false;
	private tokenScanner: any;

	constructor() {
		this.tokenScanner = new TokenScanner();
	}

	/**
	 * Fetch EVM chain balances (ETH, Polygon) via backend worker that proxies Ankr Advanced API.
	 * This keeps API keys server-side and falls back to per-chain providers in the caller if it fails.
	 */
	private async getEvmBalancesFromAnkr(evmAddress: string): Promise<{
		ethereum?: { balance: string; balanceUSD: string };
		polygon?: { balance: string; balanceUSD: string };
	}> {
		const response = await fetch('https://api.rivarawallet.xyz/api/ankr/scan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				walletAddress: evmAddress,
				blockchains: ['eth', 'polygon']
			})
		});

		if (!response.ok) {
			throw new Error(`Ankr balance request failed with status ${response.status}`);
		}

		const json = await response.json();
		const assets = json?.assets;
		if (!Array.isArray(assets)) {
			throw new Error('Invalid Ankr balance response');
		}

		const result: {
			ethereum?: { balance: string; balanceUSD: string };
			polygon?: { balance: string; balanceUSD: string };
		} = {};

		for (const asset of assets) {
			if (!asset) continue;
			const blockchain = asset.blockchain as string | undefined;
			const isNative = !asset.contractAddress;
			if (!isNative || !blockchain) continue;

			const balance = Number(asset.balance ?? 0);
			const balanceUsd = Number(asset.balanceUsd ?? 0);

			if (blockchain === 'eth') {
				result.ethereum = {
					balance: balance.toFixed(4),
					balanceUSD: balanceUsd.toFixed(2)
				};
			} else if (blockchain === 'polygon') {
				result.polygon = {
					balance: balance.toFixed(4),
					balanceUSD: balanceUsd.toFixed(2)
				};
			}
		}

		return result;
	}

	async importFromSeed(mnemonic: string) {
		// @ts-ignore - cryptoLibs loaded from CDN in app.html
		if (!window.cryptoLibs) {
			throw new Error('Crypto libraries not loaded');
		}

		// @ts-ignore
		const { ethers } = window.cryptoLibs;

		// Validate mnemonic (ethers v5 syntax)
		try {
			ethers.utils.HDNode.fromMnemonic(mnemonic);
		} catch (e) {
			throw new Error('Invalid seed phrase');
		}

		// Instantiate chain services via ES module imports (no window polling)
		const bitcoinService = new BitcoinService();
		const dogecoinService = new DogecoinService();
		const litecoinService = new LitecoinService();
		const ethereumService = new EthereumService();
		const polygonService = new PolygonService();
		const solanaService = new SolanaService();
		const tronService = new TronService();
		const avalancheService = new AvalancheService();
		const bscService = new BscService();

		// Derive addresses only — no private keys stored
		const ethData = ethereumService.deriveAddress(mnemonic);
		const btcData = bitcoinService.deriveAddress(mnemonic);
		const dogeData = dogecoinService.deriveAddress(mnemonic);
		const ltcData = litecoinService.deriveAddress(mnemonic);
		const trxData = tronService.deriveAddress(mnemonic);
		const solData = await solanaService.deriveAddress(mnemonic);
		const avaxData = avalancheService.deriveAddress(mnemonic);
		const bnbData = bscService.deriveAddress(mnemonic);

		// SECURITY: Only store addresses and public data — NO mnemonic, NO privateKey
		const newWallet = {
			bitcoin: {
				address: btcData.address,
				balance: '0.00000000',
				balanceUSD: '0.00',
				transactions: []
			},
			dogecoin: {
				address: dogeData.address,
				balance: '0.00000000',
				balanceUSD: '0.00',
				transactions: []
			},
			litecoin: {
				address: ltcData.address,
				balance: '0.00000000',
				balanceUSD: '0.00',
				transactions: []
			},
			ethereum: {
				address: ethData.address,
				balance: '0.0000',
				balanceUSD: '0.00',
				transactions: []
			},
			polygon: {
				address: ethData.address,
				balance: '0.00000000',
				balanceUSD: '0.00',
				transactions: []
			},
			dgage: {
				address: ethData.address,
				balance: '0.0000',
				balanceUSD: '0.00',
				transactions: []
			},
			tron: {
				address: trxData.address,
				balance: '0.000000',
				balanceUSD: '0.00',
				transactions: []
			},
			solana: {
				address: solData.address,
				balance: '0.000000',
				balanceUSD: '0.00',
				transactions: []
			},
			avalanche: {
				address: avaxData.address,
				balance: '0.0000',
				balanceUSD: '0.00',
				transactions: []
			},
			bsc: {
				address: bnbData.address,
				balance: '0.0000',
				balanceUSD: '0.00',
				transactions: []
			}
		};

		wallet.set(newWallet);
		isUnlocked.set(true);
		sessionStorage.setItem('walletUnlocked', 'true');

		return newWallet;
	}

	async fetchBalances() {
		const currentWallet = get(wallet);
		if (!currentWallet) {
			return;
		}

		if (this.isFetching) {
			return;
		}

		this.isFetching = true;
		balancesLoading.set(true);

		try {
			// Prefer a single Ankr Advanced API call for EVM balances where possible
			let ankrEvmBalances:
				| {
						ethereum?: { balance: string; balanceUSD: string };
						polygon?: { balance: string; balanceUSD: string };
				  }
				| null = null;
			try {
				if (currentWallet.ethereum?.address) {
					ankrEvmBalances = await this.getEvmBalancesFromAnkr(currentWallet.ethereum.address);
				}
			} catch {
				ankrEvmBalances = null;
			}

			// Instantiate via ES module imports
			const bitcoinService = new BitcoinService();
			const dogecoinService = new DogecoinService();
			const litecoinService = new LitecoinService();
			const ethereumService = new EVMChainService('ethereum');
			const polygonService = new EVMChainService('polygon');
			const solanaService = new SolanaService();
			const tronService = new TronService();
			const avalancheService = new AvalancheService();
			const bscService = new BscService();
			const dgageService = new DGAGEService();

			// Helper: update a single chain as soon as its balance resolves
			const tasks: Promise<void>[] = [];

			const updateChain = (key: keyof typeof currentWallet, promise: Promise<{ balance: string; balanceUSD: string }>) => {
				const task = promise.then((result) => {
					wallet.update((w: any) => {
						if (!w) return w;
						return {
							...w,
							[key]: {
								...w[key],
								balance: result.balance,
								balanceUSD: result.balanceUSD
							}
						};
					});
				});
				tasks.push(task);
			};

			updateChain('bitcoin', bitcoinService.getBalanceUSD(currentWallet.bitcoin.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('dogecoin', dogecoinService.getBalanceUSD(currentWallet.dogecoin.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('litecoin', litecoinService.getBalanceUSD(currentWallet.litecoin.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			// Ethereum / Polygon via Ankr (with per-chain fallback)
			if (ankrEvmBalances?.ethereum) {
				updateChain('ethereum', Promise.resolve(ankrEvmBalances.ethereum));
			} else {
				updateChain('ethereum', ethereumService.getBalanceUSD(currentWallet.ethereum.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			}
			if (ankrEvmBalances?.polygon) {
				updateChain('polygon', Promise.resolve(ankrEvmBalances.polygon));
			} else {
				updateChain('polygon', polygonService.getBalanceUSD(currentWallet.polygon.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			}
			updateChain('solana', solanaService.getBalanceUSD(currentWallet.solana.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('tron', tronService.getBalanceUSD(currentWallet.tron.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('avalanche', avalancheService.getBalanceUSD(currentWallet.avalanche.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('bsc', bscService.getBalanceUSD(currentWallet.bsc.address).catch(() => ({ balance: '0', balanceUSD: '0' })));
			updateChain('dgage', dgageService.getBalanceUSD(currentWallet.dgage.address).catch(() => ({ balance: '0', balanceUSD: '0' })));

			// USDC detection (does not block native balances)
			const usdcTask = (async () => {
				const ethUsdcContract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
				const polygonUsdcContract = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

				let detectedEthereumTokens: any[] = [];
				let detectedPolygonTokens: any[] = [];
				try {
					const [ethUsdc, polyUsdc] = await Promise.all([
						this.tokenScanner.getERC20TokenData(currentWallet.ethereum.address, ethUsdcContract, 'ethereum').catch(() => null),
						this.tokenScanner.getERC20TokenData(currentWallet.polygon.address, polygonUsdcContract, 'polygon').catch(() => null)
					]);

					if (ethUsdc && parseFloat(ethUsdc.balance) >= 0) detectedEthereumTokens.push(ethUsdc);
					if (polyUsdc && parseFloat(polyUsdc.balance) >= 0) detectedPolygonTokens.push(polyUsdc);
				} catch {
					// keep empty on error
				}

				wallet.update((w: any) => {
					if (!w) return w;
					return {
						...w,
						detectedTokens: {
							ethereum: detectedEthereumTokens,
							polygon: detectedPolygonTokens
						}
					};
				});
			})();

			tasks.push(usdcTask);

			// Wait for all per-chain updates to finish, then cache final balances
			await Promise.all(tasks);
			const finalWallet: any = get(wallet);
			if (finalWallet) {
				this.cacheBalances(finalWallet);
			}
		} catch (error) {
			// Error handled silently — balances will stay at cached values
		} finally {
			this.isFetching = false;
			balancesLoading.set(false);
		}
	}

	saveToStorage(walletData: any) {
		// Don't save wallet data to storage anymore
		// Only the encrypted seed phrase is stored (handled by encryption service)
		// Cache balances separately for faster loading
		this.cacheBalances(walletData);
	}

	loadFromStorage(): any | null {
		// Wallet is not stored - must unlock with password
		// This method now only loads cached balances
		return null;
	}

	// SECURITY FIX 7: HMAC integrity on cached balances
	async cacheBalances(walletData: any) {
		if (!walletData) return;

		const cache: Record<string, any> = {
			ethereum: {
				balance: walletData.ethereum.balance,
				balanceUSD: walletData.ethereum.balanceUSD
			},
			bitcoin: {
				balance: walletData.bitcoin.balance,
				balanceUSD: walletData.bitcoin.balanceUSD
			},
			dogecoin: {
				balance: walletData.dogecoin.balance,
				balanceUSD: walletData.dogecoin.balanceUSD
			},
			litecoin: {
				balance: walletData.litecoin.balance,
				balanceUSD: walletData.litecoin.balanceUSD
			},
			tron: {
				balance: walletData.tron.balance,
				balanceUSD: walletData.tron.balanceUSD
			},
			solana: {
				balance: walletData.solana.balance,
				balanceUSD: walletData.solana.balanceUSD
			},
			polygon: {
				balance: walletData.polygon.balance,
				balanceUSD: walletData.polygon.balanceUSD
			},
			dgage: {
				balance: walletData.dgage.balance,
				balanceUSD: walletData.dgage.balanceUSD
			},
			avalanche: {
				balance: walletData.avalanche.balance,
				balanceUSD: walletData.avalanche.balanceUSD
			},
			bsc: {
				balance: walletData.bsc.balance,
				balanceUSD: walletData.bsc.balanceUSD
			},
			timestamp: Date.now()
		};

		const cacheJson = JSON.stringify(cache);
		const hmac = await computeHmac(cacheJson);

		localStorage.setItem('cachedBalances', JSON.stringify({ data: cacheJson, hmac }));
	}

	async loadCachedBalances(): Promise<any | null> {
		try {
			const cached = localStorage.getItem('cachedBalances');
			if (!cached) return null;

			const envelope = JSON.parse(cached);

			// SECURITY: Verify HMAC before trusting cached data
			if (!envelope.data || !envelope.hmac) {
				// Legacy format without HMAC — discard
				localStorage.removeItem('cachedBalances');
				return null;
			}

			const valid = await verifyHmac(envelope.data, envelope.hmac);
			if (!valid) {
				// Tampered data — discard
				localStorage.removeItem('cachedBalances');
				return null;
			}

			const data = JSON.parse(envelope.data);

			// Check if cache is less than 5 minutes old
			const age = Date.now() - data.timestamp;
			if (age > 5 * 60 * 1000) {
				return null;
			}

			return data;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Hydrate the in-memory wallet store with cached balances (if available).
	 * Used on UI mount to show something instantly and avoid flaky network calls.
	 */
	async hydrateWalletFromCache() {
		const currentWallet = get(wallet);
		if (!currentWallet) return;

		const cached = await this.loadCachedBalances();
		if (!cached) return;

		const updatedWallet = {
			...currentWallet,
			ethereum: {
				...currentWallet.ethereum,
				balance: cached.ethereum?.balance ?? currentWallet.ethereum.balance,
				balanceUSD: cached.ethereum?.balanceUSD ?? currentWallet.ethereum.balanceUSD
			},
			bitcoin: {
				...currentWallet.bitcoin,
				balance: cached.bitcoin?.balance ?? currentWallet.bitcoin.balance,
				balanceUSD: cached.bitcoin?.balanceUSD ?? currentWallet.bitcoin.balanceUSD
			},
			dogecoin: {
				...currentWallet.dogecoin,
				balance: cached.dogecoin?.balance ?? currentWallet.dogecoin.balance,
				balanceUSD: cached.dogecoin?.balanceUSD ?? currentWallet.dogecoin.balanceUSD
			},
			litecoin: {
				...currentWallet.litecoin,
				balance: cached.litecoin?.balance ?? currentWallet.litecoin.balance,
				balanceUSD: cached.litecoin?.balanceUSD ?? currentWallet.litecoin.balanceUSD
			},
			tron: {
				...currentWallet.tron,
				balance: cached.tron?.balance ?? currentWallet.tron.balance,
				balanceUSD: cached.tron?.balanceUSD ?? currentWallet.tron.balanceUSD
			},
			solana: {
				...currentWallet.solana,
				balance: cached.solana?.balance ?? currentWallet.solana.balance,
				balanceUSD: cached.solana?.balanceUSD ?? currentWallet.solana.balanceUSD
			},
			polygon: {
				...currentWallet.polygon,
				balance: cached.polygon?.balance ?? currentWallet.polygon.balance,
				balanceUSD: cached.polygon?.balanceUSD ?? currentWallet.polygon.balanceUSD
			},
			dgage: {
				...currentWallet.dgage,
				balance: cached.dgage?.balance ?? currentWallet.dgage.balance,
				balanceUSD: cached.dgage?.balanceUSD ?? currentWallet.dgage.balanceUSD
			},
			avalanche: {
				...currentWallet.avalanche,
				balance: cached.avalanche?.balance ?? currentWallet.avalanche.balance,
				balanceUSD: cached.avalanche?.balanceUSD ?? currentWallet.avalanche.balanceUSD
			},
			bsc: {
				...currentWallet.bsc,
				balance: cached.bsc?.balance ?? currentWallet.bsc.balance,
				balanceUSD: cached.bsc?.balanceUSD ?? currentWallet.bsc.balanceUSD
			}
		};

		wallet.set(updatedWallet);
	}

	lock() {
		wallet.set(null);
		isUnlocked.set(false);
		sessionStorage.removeItem('walletUnlocked');
		// Reset session HMAC key on lock
		_sessionHmacKey = null;
	}

	getWallet() {
		const walletData = get(wallet);

		// Migration: Fix object addresses for dogecoin and litecoin
		if (walletData) {
			let needsUpdate = false;

			if (walletData.dogecoin && typeof walletData.dogecoin.address === 'object') {
				walletData.dogecoin.address = (walletData.dogecoin.address as any).address || '';
				needsUpdate = true;
			}
			if (walletData.litecoin && typeof walletData.litecoin.address === 'object') {
				walletData.litecoin.address = (walletData.litecoin.address as any).address || '';
				needsUpdate = true;
			}

			// Update store if migration happened
			if (needsUpdate) {
				wallet.set(walletData);
			}
		}

		return walletData;
	}

	getChainService(chain: string) {
		switch (chain.toLowerCase()) {
			case 'bitcoin':
			case 'btc':
				return new BitcoinService();
			case 'dogecoin':
			case 'doge':
				return new DogecoinService();
			case 'litecoin':
			case 'ltc':
				return new LitecoinService();
			case 'ethereum':
			case 'eth':
				return new EVMChainService('ethereum');
			case 'polygon':
			case 'pol':
				return new EVMChainService('polygon');
			case 'solana':
			case 'sol':
				return new SolanaService();
			case 'tezos':
			case 'xtz':
				return new TezosService();
			case 'tron':
			case 'trx':
				return new TronService();
			default:
				return null;
		}
	}
}


export const walletService = new WalletService();
