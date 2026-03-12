/**
 * Rivara Wallet
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

// Solana Service - Handle SOL balance and address derivation
class SolanaService {
    constructor() {
        this.rpcEndpoint = 'https://api.rivarawallet.xyz/api/solana/rpc';
        this.cachedPrice = 150; // Default fallback
    }

    async getBalance(address) {
        try {
            console.log('Checking Solana balance...');

            const response = await fetch(this.rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [address]
                })
            });

            const data = await response.json();

            if (data.result && data.result.value !== undefined) {
                // Convert from lamports to SOL (1 SOL = 1,000,000,000 lamports)
                const balance = (data.result.value / 1000000000).toFixed(6);
                return balance;
            }

            if (data.error) {
                console.error('Helius RPC error:', data.error);
            }

            return '0.000000';
        } catch (error) {
            console.error('Failed to fetch Solana balance:', error);
            return '0.000000';
        }
    }

    async getBalanceUSD(address) {
        try {
            const solBalance = await this.getBalance(address);

            // Get SOL price from CoinGecko via worker
            try {
                const response = await fetch('https://api.rivarawallet.xyz/api/coingecko/prices?ids=solana');
                const data = await response.json();

                if (data.solana && data.solana.usd && data.solana.usd > 0) {
                    this.cachedPrice = data.solana.usd;
                } else {
                    console.warn('CoinGecko returned no price data, using cached price');
                }
            } catch (priceError) {
                console.error('Failed to get Solana price from CoinGecko:', priceError);
            }

            return {
                balance: solBalance,
                balanceUSD: (parseFloat(solBalance) * this.cachedPrice).toFixed(2),
                price: this.cachedPrice
            };
        } catch (error) {
            console.error('Failed to get Solana balance USD:', error);
            return {
                balance: '0.000000',
                balanceUSD: '0.00',
                price: this.cachedPrice
            };
        }
    }

    async deriveAddress(mnemonic) {
        // Solana uses Ed25519 keys with BIP44 path: m/44'/501'/0'/0'
        const path = "m/44'/501'/0'/0'";

        try {
            // Get Ed25519 keys (reuse Tezos derivation function)
            const keys = await getTezosEd25519Keys(mnemonic, path);
            const publicKeyBytes = keys.publicKey;

            // Solana address is base58 encoded public key (32 bytes)
            const address = this.base58Encode(publicKeyBytes);

            return {
                address: address,
                publicKey: bytesToHex(publicKeyBytes),
                path: path
            };
        } catch (error) {
            console.error('Solana derivation error:', error);
            return {
                address: 'Error deriving Solana address: ' + error.message,
                publicKey: '',
                path: path
            };
        }
    }

    base58Encode(bytes) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const digits = [0];

        for (let i = 0; i < bytes.length; i++) {
            let carry = bytes[i];
            for (let j = 0; j < digits.length; j++) {
                carry += digits[j] << 8;
                digits[j] = carry % 58;
                carry = (carry / 58) | 0;
            }
            while (carry > 0) {
                digits.push(carry % 58);
                carry = (carry / 58) | 0;
            }
        }

        let result = '';
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
            result += ALPHABET[0];
        }
        for (let i = digits.length - 1; i >= 0; i--) {
            result += ALPHABET[digits[i]];
        }
        return result;
    }

    async getTransactions(address) {
        try {
            console.log('Checking Solana transactions...');

            const response = await fetch(this.rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getSignaturesForAddress',
                    params: [address, { limit: 10 }]
                })
            });

            const data = await response.json();

            if (data.result && Array.isArray(data.result)) {

                // Fetch details for each transaction
                const txDetails = await Promise.all(
                    data.result.slice(0, 10).map(async (tx) => {
                        try {
                            const detailResponse = await fetch(this.rpcEndpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    jsonrpc: '2.0',
                                    id: 1,
                                    method: 'getTransaction',
                                    params: [tx.signature, { encoding: 'jsonParsed' }]
                                })
                            });
                            const detail = await detailResponse.json();

                            if (detail.result) {
                                const preBalance = detail.result.meta?.preBalances?.[0] || 0;
                                const postBalance = detail.result.meta?.postBalances?.[0] || 0;
                                const diff = (postBalance - preBalance) / 1000000000;

                                return {
                                    hash: tx.signature,
                                    timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
                                    type: diff < 0 ? 'sent' : 'received',
                                    value: Math.abs(diff).toFixed(6)
                                };
                            }
                        } catch (err) {
                            console.error('Failed to fetch tx detail:', err);
                        }

                        return {
                            hash: tx.signature,
                            timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
                            type: 'unknown',
                            value: '?'
                        };
                    })
                );

                return txDetails;
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch Solana transactions:', error);
            return [];
        }
    }
}

// Export for ES modules
export { SolanaService };

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

