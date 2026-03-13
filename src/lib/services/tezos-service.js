/**
 * Rivara Wallet
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

import { priceService } from './price-service';

// Tezos Service - Handle XTZ balance and address derivation
class TezosService {

    async getBalance(address) {
        try {
            // Use TzKT API (Tezos blockchain explorer)
            const response = await fetch(`https://api.tzkt.io/v1/accounts/${address}`);

            // Handle rate limiting
            if (response.status === 429) {
                console.warn('TzKT rate limited, using cached balance');
                return this.cachedBalance || '0.000000';
            }

            const data = await response.json();

            if (data && data.balance !== undefined) {
                // Convert from mutez to XTZ (1 XTZ = 1,000,000 mutez)
                const xtzBalance = (data.balance / 1000000).toFixed(6);
                this.cachedBalance = xtzBalance;
                return xtzBalance;
            }
            return '0.000000';
        } catch (error) {
            console.error('Failed to fetch Tezos balance:', error);
            return this.cachedBalance || '0.000000';
        }
    }

    async getBalanceUSD(address) {
        const xtzBalance = await this.getBalance(address);

        // Get XTZ price from centralized price service
        try {
            const xtzPrice = await priceService.getPrice('tezos');

            return {
                balance: xtzBalance,
                balanceUSD: (parseFloat(xtzBalance) * xtzPrice).toFixed(2),
                price: xtzPrice
            };
        } catch (error) {
            console.error('Failed to get Tezos price:', error);
            return {
                balance: xtzBalance,
                balanceUSD: '0.00',
                price: 0
            };
        }
    }

    async deriveAddress(mnemonic) {
        // Try multiple common Tezos paths
        const paths = [
            "m/44'/1729'/0'/0'",      // Standard 4-element
            "m/44'/1729'/0'/0'/0'",   // Standard 5-element
            "m/44'/1729'/0'",         // 3-element (some wallets)
            "m/44'/1729'",            // 2-element (rare)
        ];

        for (const path of paths) {
            try {
                const keys = await getTezosEd25519Keys(mnemonic, path);
                const publicKeyHex = bytesToHex(keys.publicKey);
                const tezosAddress = tezosAddressFromEd25519PublicKey(publicKeyHex);

                // Return the first one for now
                if (path === "m/44'/1729'/0'/0'") {
                    return {
                        address: tezosAddress,
                        publicKey: publicKeyHex,
                        path: path
                    };
                }
            } catch (error) {
                console.error('Error with path', path, ':', error);
            }
        }

        return {
            address: 'Could not derive address',
            publicKey: '',
            path: ''
        };
    }

    async getTransactions(address) {
        try {
            const response = await fetch(`https://api.tzkt.io/v1/accounts/${address}/operations?type=transaction&limit=10`);
            const data = await response.json();

            if (Array.isArray(data)) {
                return data.map(tx => ({
                    hash: tx.hash,
                    timestamp: new Date(tx.timestamp).getTime(),
                    type: tx.sender.address === address ? 'sent' : 'received',
                    value: (tx.amount / 1000000).toFixed(6)
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch Tezos transactions:', error);
            return [];
        }
    }
}

// Export for ES modules
export { TezosService };

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

