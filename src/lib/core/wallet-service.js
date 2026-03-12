/**
 * Rivara Wallet
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

// Wallet Service - Manages wallet state and crypto operations
class WalletService {
    constructor() {
        this.wallet = null;
        this.isUnlocked = false;
        this.balancesLoading = false;
        this.infuraApiKey = null;
        this.ethereumService = null;
        this.bitcoinService = new BitcoinService();
        this.dogecoinService = new DogecoinService();
        this.litecoinService = new LitecoinService();
        this.tezosService = new TezosService();
        this.tronService = new TronService();
        this.solanaService = new SolanaService();
        this.dgageService = new DGAGEService();
        this.polygonService = new PolygonService();
        this.tokenScanner = new TokenScanner();
    }

    setBalancesLoading(loading) {
        this.balancesLoading = loading;
    }

    isBalancesLoading() {
        return this.balancesLoading;
    }

    setInfuraKey(apiKey) {
        this.infuraApiKey = apiKey;
        this.ethereumService = new EthereumService(apiKey);
    }

    async importFromSeed(mnemonic) {
        if (!window.cryptoLibs) {
            throw new Error('Crypto libraries not loaded');
        }

        const { ethers } = window.cryptoLibs;

        // Validate mnemonic
        try {
            ethers.utils.HDNode.fromMnemonic(mnemonic);
        } catch (e) {
            throw new Error('Invalid seed phrase');
        }

        // Derive Ethereum address
        const ethData = this.ethereumService.deriveAddress(mnemonic);

        // Derive Bitcoin address
        const btcData = this.bitcoinService.deriveAddress(mnemonic);

        // Derive Dogecoin address
        const dogeData = this.dogecoinService.deriveAddress(mnemonic);

        // Derive Litecoin address
        const ltcData = this.litecoinService.deriveAddress(mnemonic);

        // Derive Tezos address (async because of Ed25519)
        const xtzData = await this.tezosService.deriveAddress(mnemonic);

        // Derive Tron address
        const trxData = this.tronService.deriveAddress(mnemonic);

        // Derive Solana address
        console.log('Deriving Solana address...');
        const solData = await this.solanaService.deriveAddress(mnemonic);
        console.log('Solana derived:', solData);

        this.wallet = {
            mnemonic,
            bitcoin: {
                address: btcData.address,
                balance: '0.00000000',
                balanceUSD: '0.00',
                transactions: []
            },
            dogecoin: {
                address: dogeData,
                balance: '0.00000000',
                balanceUSD: '0.00',
                transactions: []
            },
            litecoin: {
                address: ltcData,
                balance: '0.00000000',
                balanceUSD: '0.00',
                transactions: []
            },
            ethereum: {
                address: ethData.address,
                privateKey: ethData.privateKey,
                balance: '0.0000',
                balanceUSD: '0.00',
                transactions: []
            },
            dgage: {
                address: ethData.address, // Same as ETH
                balance: '0.0000',
                balanceUSD: '0.00',
                transactions: []
            },
            tezos: {
                address: xtzData.address,
                balance: '0.000000',
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
            polygon: {
                address: ethData.address, // Same as ETH/Polygon
                balance: '0.00000000',
                balanceUSD: '0.00',
                transactions: []
            }
        };

        this.isUnlocked = true;
        sessionStorage.setItem('walletUnlocked', 'true');
        this.saveToStorage();

        return this.wallet;
    }

    async fetchBalances() {
        if (!this.wallet) return;

        // Debounce - don't fetch if already fetching
        if (this.isFetching) {
            console.log('Already fetching balances, skipping...');
            return;
        }
        this.isFetching = true;

        if (!this.infuraApiKey) {
            console.error('Infura API key not set');
            this.isFetching = false;
            return;
        }

        console.log('Fetching balances...');

        // Fetch all prices upfront in one call
        let prices = {};
        try {
            const priceRes = await fetch('https://api.rivarawallet.xyz/api/coingecko/prices?ids=bitcoin,ethereum,dogecoin,litecoin,solana,tezos,tron,matic-network');
            prices = await priceRes.json();
            console.log('Prices fetched:', prices);
        } catch (e) {
            console.warn('Price fetch failed, using fallbacks');
        }

        // Price helpers using cached prices
        const getPrice = (id, fallback) => prices[id]?.usd || fallback;

        // Retry helper - tries up to 3 times with delay
        const withRetry = async (fn, name, retries = 3) => {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    console.warn(`${name} attempt ${i + 1}/${retries} failed:`, error.message);
                    if (i < retries - 1) {
                        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // 1s, 2s, 3s delays
                    } else {
                        throw error;
                    }
                }
            }
        };

        // Try to load cached balances first
        const cached = this.loadCachedBalances();
        if (cached) {
            console.log('Using cached balances as fallback');
            this.wallet.ethereum.balance = cached.ethereum?.balance || '0.00';
            this.wallet.ethereum.balanceUSD = cached.ethereum?.balanceUSD || '0.00';
            this.wallet.bitcoin.balance = cached.bitcoin?.balance || '0.00';
            this.wallet.bitcoin.balanceUSD = cached.bitcoin?.balanceUSD || '0.00';
            this.wallet.dogecoin.balance = cached.dogecoin?.balance || '0.00';
            this.wallet.dogecoin.balanceUSD = cached.dogecoin?.balanceUSD || '0.00';
            this.wallet.litecoin.balance = cached.litecoin?.balance || '0.00';
            this.wallet.litecoin.balanceUSD = cached.litecoin?.balanceUSD || '0.00';
            this.wallet.tezos.balance = cached.tezos?.balance || '0.00';
            this.wallet.tezos.balanceUSD = cached.tezos?.balanceUSD || '0.00';
            this.wallet.tron.balance = cached.tron?.balance || '0.00';
            this.wallet.tron.balanceUSD = cached.tron?.balanceUSD || '0.00';
            this.wallet.solana.balance = cached.solana?.balance || '0.00';
            this.wallet.solana.balanceUSD = cached.solana?.balanceUSD || '0.00';
            if (cached.polygon && this.wallet.polygon) {
                this.wallet.polygon.balance = cached.polygon.balance || '0.00';
                this.wallet.polygon.balanceUSD = cached.polygon.balanceUSD || '0.00';
            }
            if (cached.dgage && this.wallet.dgage) {
                this.wallet.dgage.balance = cached.dgage.balance || '0.00';
                this.wallet.dgage.balanceUSD = cached.dgage.balanceUSD || '0.00';
            }
        }

        // Helper to update UI after each chain loads
        const updateUI = () => {
            const hash = window.location.hash;
            // Only update if on wallet page and NOT viewing asset details (to avoid breaking chart)
            if ((hash === '#/wallet' || hash === '' || hash === '#/' || hash === '#' || !hash)) {
                try {
                    // Check if user is in send form - don't interrupt
                    if (typeof showingSend !== 'undefined' && showingSend) {
                        return;
                    }
                    document.getElementById('app').innerHTML = renderWallet();
                    // Re-init price chart if viewing an asset
                    if (typeof selectedAsset !== 'undefined' && selectedAsset && typeof initPriceChart === 'function') {
                        setTimeout(initPriceChart, 100);
                    }
                } catch (e) {
                    console.warn('UI update skipped:', e.message);
                }
            }
        };

        // Fetch all chains in parallel, update UI as each completes
        const fetchPromises = [];

        // Ethereum
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const ethBalance = await this.ethereumService.getBalance(this.wallet.ethereum.address);
                    const ethPrice = getPrice('ethereum', 3000);
                    this.wallet.ethereum.balance = ethBalance;
                    this.wallet.ethereum.balanceUSD = (parseFloat(ethBalance) * ethPrice).toFixed(2);
                    this.wallet.ethereum.transactions = await this.ethereumService.getTransactions(this.wallet.ethereum.address);
                    console.log('ETH Balance:', ethBalance, 'USD:', this.wallet.ethereum.balanceUSD);
                    updateUI();
                }, 'ETH');
            } catch (error) {
                console.error('ETH balance fetch failed after retries:', error);
            }
        })());

        // Bitcoin
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const btcBalance = await this.bitcoinService.getBalance(this.wallet.bitcoin.address);
                    const btcPrice = getPrice('bitcoin', 90000);
                    this.wallet.bitcoin.balance = btcBalance;
                    this.wallet.bitcoin.balanceUSD = (parseFloat(btcBalance) * btcPrice).toFixed(2);
                    this.wallet.bitcoin.transactions = await this.bitcoinService.getTransactions(this.wallet.bitcoin.address);
                    console.log('BTC Balance:', btcBalance, 'USD:', this.wallet.bitcoin.balanceUSD);
                    updateUI();
                }, 'BTC');
            } catch (error) {
                console.error('BTC balance fetch failed after retries:', error);
            }
        })());

        // Dogecoin
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const dogeBalance = await this.dogecoinService.getBalance(this.wallet.dogecoin.address);
                    const dogePrice = getPrice('dogecoin', 0.35);
                    this.wallet.dogecoin.balance = dogeBalance;
                    this.wallet.dogecoin.balanceUSD = (parseFloat(dogeBalance) * dogePrice).toFixed(2);
                    try {
                        this.wallet.dogecoin.transactions = await this.dogecoinService.getTransactions(this.wallet.dogecoin.address);
                    } catch (txErr) {
                        console.warn('DOGE transactions fetch failed:', txErr.message);
                    }
                    console.log('DOGE Balance:', dogeBalance, 'USD:', this.wallet.dogecoin.balanceUSD);
                    updateUI();
                }, 'DOGE');
            } catch (error) {
                console.error('DOGE balance fetch failed after retries:', error);
            }
        })());

        // Litecoin
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const ltcBalance = await this.litecoinService.getBalance(this.wallet.litecoin.address);
                    const ltcPrice = getPrice('litecoin', 100);
                    this.wallet.litecoin.balance = ltcBalance;
                    this.wallet.litecoin.balanceUSD = (parseFloat(ltcBalance) * ltcPrice).toFixed(2);
                    try {
                        this.wallet.litecoin.transactions = await this.litecoinService.getTransactions(this.wallet.litecoin.address);
                    } catch (txErr) {
                        console.warn('LTC transactions fetch failed:', txErr.message);
                    }
                    console.log('LTC Balance:', ltcBalance, 'USD:', this.wallet.litecoin.balanceUSD);
                    updateUI();
                }, 'LTC');
            } catch (error) {
                console.error('LTC balance fetch failed after retries:', error);
            }
        })());

        // Tezos
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const xtzBalance = await this.tezosService.getBalance(this.wallet.tezos.address);
                    const xtzPrice = getPrice('tezos', 1);
                    this.wallet.tezos.balance = xtzBalance;
                    this.wallet.tezos.balanceUSD = (parseFloat(xtzBalance) * xtzPrice).toFixed(2);
                    try {
                        this.wallet.tezos.transactions = await this.tezosService.getTransactions(this.wallet.tezos.address);
                    } catch (txErr) {
                        console.warn('XTZ transactions fetch failed:', txErr.message);
                    }
                    console.log('XTZ Balance:', xtzBalance, 'USD:', this.wallet.tezos.balanceUSD);
                    updateUI();
                }, 'XTZ');
            } catch (error) {
                console.error('XTZ balance fetch failed after retries:', error);
            }
        })());

        // Tron
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const trxBalance = await this.tronService.getBalance(this.wallet.tron.address);
                    const trxPrice = getPrice('tron', 0.25);
                    this.wallet.tron.balance = trxBalance;
                    this.wallet.tron.balanceUSD = (parseFloat(trxBalance) * trxPrice).toFixed(2);
                    try {
                        this.wallet.tron.transactions = await this.tronService.getTransactions(this.wallet.tron.address);
                    } catch (txErr) {
                        console.warn('TRX transactions fetch failed:', txErr.message);
                    }
                    console.log('TRX Balance:', trxBalance, 'USD:', this.wallet.tron.balanceUSD);
                    updateUI();
                }, 'TRX');
            } catch (error) {
                console.error('TRX balance fetch failed after retries:', error);
            }
        })());

        // Solana
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const solBalance = await this.solanaService.getBalance(this.wallet.solana.address);
                    const solPrice = getPrice('solana', 140);
                    this.wallet.solana.balance = solBalance;
                    this.wallet.solana.balanceUSD = (parseFloat(solBalance) * solPrice).toFixed(2);
                    this.wallet.solana.transactions = await this.solanaService.getTransactions(this.wallet.solana.address);
                    console.log('SOL Balance:', solBalance, 'USD:', this.wallet.solana.balanceUSD);
                    updateUI();
                }, 'SOL');
            } catch (error) {
                console.error('SOL balance fetch failed after retries:', error);
            }
        })());

        // DGAGE
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const dgageBalance = await this.dgageService.getBalance(this.wallet.ethereum.address);
                    const dgageTransactions = await this.dgageService.getTransactions(this.wallet.ethereum.address);
                    this.wallet.dgage = {
                        address: this.wallet.ethereum.address,
                        balance: dgageBalance,
                        balanceUSD: '0.00',
                        transactions: dgageTransactions
                    };
                    console.log('DGAGE Balance:', dgageBalance);
                    updateUI();
                }, 'DGAGE');
            } catch (error) {
                console.error('DGAGE balance fetch failed after retries:', error);
            }
        })());

        // Polygon
        fetchPromises.push((async () => {
            try {
                await withRetry(async () => {
                    const polBalanceRaw = await this.polygonService.getBalance(this.wallet.ethereum.address);
                    const polBalance = parseFloat(polBalanceRaw).toFixed(8);
                    const polPrice = getPrice('matic-network', 0.5);
                    const polBalanceUSD = (parseFloat(polBalance) * polPrice).toFixed(2);
                    let polTransactions = [];
                    try {
                        polTransactions = await this.polygonService.getTransactions(this.wallet.ethereum.address);
                    } catch (txErr) {
                        console.warn('POL transactions fetch failed:', txErr.message);
                    }
                    this.wallet.polygon = {
                        address: this.wallet.ethereum.address,
                        balance: polBalance,
                        balanceUSD: polBalanceUSD,
                        transactions: polTransactions
                    };
                    console.log('POL Balance:', polBalance, 'USD:', polBalanceUSD);
                    updateUI();
                }, 'POL');
            } catch (error) {
                console.error('POL balance fetch failed after retries:', error);
            }
        })());

        // Wait for all to complete
        await Promise.all(fetchPromises);

        // Token scanning (do this after main balances)
        try {
            console.log('Scanning for additional tokens...');
            const [ethTokens, polyTokens] = await Promise.all([
                this.tokenScanner.scanEthereumTokens(this.wallet.ethereum.address),
                this.tokenScanner.scanPolygonTokens(this.wallet.ethereum.address)
            ]);

            this.wallet.detectedTokens = {
                ethereum: ethTokens,
                polygon: polyTokens
            };

            console.log('Token scan complete!', ethTokens.length, 'ETH tokens,', polyTokens.length, 'Polygon tokens');
            updateUI();
        } catch (error) {
            console.error('Token scan failed:', error);
            this.wallet.detectedTokens = { ethereum: [], polygon: [] };
        }

        console.log('Balance fetch complete!');
        this.cacheBalances();
        this.isFetching = false;
    }

    async getDogePrice() {
        try {
            const response = await fetch('https://api.rivarawallet.xyz/api/coingecko/prices?ids=dogecoin');
            const data = await response.json();
            return data.dogecoin?.usd || 0.35; // Fallback price
        } catch (error) {
            console.error('Failed to fetch Dogecoin price:', error);
            return 0.35; // Fallback price
        }
    }

    async getLtcPrice() {
        try {
            const response = await fetch('https://api.rivarawallet.xyz/api/coingecko/prices?ids=litecoin');
            const data = await response.json();
            return data.litecoin?.usd || 100; // Fallback price
        } catch (error) {
            console.error('Failed to fetch Litecoin price:', error);
            return 100; // Fallback price
        }
    }

    cacheBalances() {
        if (!this.wallet) return;

        const cache = {
            ethereum: {
                balance: this.wallet.ethereum.balance,
                balanceUSD: this.wallet.ethereum.balanceUSD
            },
            bitcoin: {
                balance: this.wallet.bitcoin.balance,
                balanceUSD: this.wallet.bitcoin.balanceUSD
            },
            dogecoin: {
                balance: this.wallet.dogecoin.balance,
                balanceUSD: this.wallet.dogecoin.balanceUSD
            },
            litecoin: {
                balance: this.wallet.litecoin.balance,
                balanceUSD: this.wallet.litecoin.balanceUSD
            },
            tezos: {
                balance: this.wallet.tezos.balance,
                balanceUSD: this.wallet.tezos.balanceUSD
            },
            tron: {
                balance: this.wallet.tron.balance,
                balanceUSD: this.wallet.tron.balanceUSD
            },
            solana: {
                balance: this.wallet.solana.balance,
                balanceUSD: this.wallet.solana.balanceUSD
            },
            polygon: this.wallet.polygon ? {
                balance: this.wallet.polygon.balance,
                balanceUSD: this.wallet.polygon.balanceUSD
            } : null,
            dgage: this.wallet.dgage ? {
                balance: this.wallet.dgage.balance,
                balanceUSD: this.wallet.dgage.balanceUSD
            } : null,
            timestamp: Date.now()
        };

        localStorage.setItem('cachedBalances', JSON.stringify(cache));
        console.log('Balances cached');
    }

    loadCachedBalances() {
        try {
            const cached = localStorage.getItem('cachedBalances');
            if (!cached) return null;

            const data = JSON.parse(cached);

            // Check if cache is less than 5 minutes old
            const age = Date.now() - data.timestamp;
            if (age > 5 * 60 * 1000) {
                console.log('Cache expired');
                return null;
            }

            return data;
        } catch (error) {
            console.error('Failed to load cached balances:', error);
            return null;
        }
    }

    getTotalBalance() {
        if (!this.wallet) return 0;

        const btcUSD = parseFloat(this.wallet.bitcoin.balanceUSD) || 0;
        const dogeUSD = parseFloat(this.wallet.dogecoin.balanceUSD) || 0;
        const ltcUSD = parseFloat(this.wallet.litecoin.balanceUSD) || 0;
        const ethUSD = parseFloat(this.wallet.ethereum.balanceUSD) || 0;
        const xtzUSD = parseFloat(this.wallet.tezos.balanceUSD) || 0;
        const trxUSD = parseFloat(this.wallet.tron.balanceUSD) || 0;
        const solUSD = parseFloat(this.wallet.solana.balanceUSD) || 0;
        const polUSD = parseFloat(this.wallet.polygon?.balanceUSD) || 0;
        const dgageUSD = parseFloat(this.wallet.dgage?.balanceUSD) || 0;

        return btcUSD + dogeUSD + ltcUSD + ethUSD + xtzUSD + trxUSD + solUSD + polUSD + dgageUSD;
    }

    saveToStorage() {
        // TODO: Implement encrypted storage
        // For now, just store in memory
    }

    lock() {
        this.isUnlocked = false;
        sessionStorage.removeItem('walletUnlocked');
    }

    isWalletUnlocked() {
        // Check if wallet exists in memory AND unlock flag is set
        return this.wallet !== null && (this.isUnlocked || sessionStorage.getItem('walletUnlocked') === 'true');
    }

    getWallet() {
        // Migration: Add dgage property if it doesn't exist
        if (this.wallet && !this.wallet.dgage && this.wallet.ethereum) {
            this.wallet.dgage = {
                address: this.wallet.ethereum.address,
                balance: '0.0000',
                balanceUSD: '0.00',
                transactions: []
            };
        }
        // Migration: Add polygon property if it doesn't exist
        if (this.wallet && !this.wallet.polygon && this.wallet.ethereum) {
            this.wallet.polygon = {
                address: this.wallet.ethereum.address,
                balance: '0.00000000',
                balanceUSD: '0.00',
                transactions: []
            };
        }
        return this.wallet;
    }
}

const walletService = new WalletService();
