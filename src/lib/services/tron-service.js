/**
 * Rivara Wallet
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

import { priceService } from './price-service';

// Tron Service - Handle TRX balance and address derivation
class TronService {
    constructor() {
        this.cachedPrice = 0.15; // Default TRX price
    }

    async getBalance(address) {
        try {
            // Use TronGrid API
            const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);

            // Handle rate limiting
            if (response.status === 429) {
                console.warn('TronGrid rate limited, using cached balance');
                return this.cachedBalance || '0.000000';
            }

            const data = await response.json();

            if (data && data.data && data.data[0]) {
                const balance = data.data[0].balance || 0;
                // Convert from sun to TRX (1 TRX = 1,000,000 sun)
                const trxBalance = (balance / 1000000).toFixed(6);
                this.cachedBalance = trxBalance;
                return trxBalance;
            }
            return '0.000000';
        } catch (error) {
            console.error('Failed to fetch Tron balance:', error);
            return this.cachedBalance || '0.000000';
        }
    }

    async getBalanceUSD(address) {
        const trxBalance = await this.getBalance(address);

        // Get TRX price from centralized price service
        try {
            const trxPrice = await priceService.getPrice('tron');

            // Only update cached price if we got a valid price
            if (trxPrice > 0) {
                this.cachedPrice = trxPrice;
            }
        } catch (error) {
            console.error('Failed to fetch TRX price, using cached:', error);
        }

        return {
            balance: trxBalance,
            balanceUSD: (parseFloat(trxBalance) * this.cachedPrice).toFixed(2),
            price: this.cachedPrice
        };
    }

    deriveAddress(mnemonic) {
        const { ethers } = window.cryptoLibs;

        try {
            // Derive using BIP44 path for Tron: m/44'/195'/0'/0/0
            const path = "m/44'/195'/0'/0/0";
            const node = ethers.utils.HDNode.fromMnemonic(mnemonic).derivePath(path);

            // Get the private key (without 0x prefix)
            const privateKeyHex = node.privateKey.slice(2);

            // Manual Tron address derivation (since TronWeb has issues)
            // Tron uses secp256k1 (same as Ethereum) but with different address encoding
            const address = this.privateKeyToTronAddress(privateKeyHex);

            return {
                address: address,
                publicKey: node.publicKey,
                path: path
            };
        } catch (error) {
            console.error('Tron derivation error:', error);
            return { address: 'Error deriving Tron address', publicKey: '', path: '' };
        }
    }

    privateKeyToTronAddress(privateKeyHex) {
        const { ethers } = window.cryptoLibs;

        // Get public key from private key
        const wallet = new ethers.Wallet(privateKeyHex);
        const publicKey = wallet.publicKey;

        // Remove '0x04' prefix from uncompressed public key
        const pubKeyBytes = this.hexToBytes(publicKey.slice(4));

        // Keccak256 hash of public key
        const hash = ethers.utils.keccak256(pubKeyBytes);

        // Take last 20 bytes
        const addressBytes = this.hexToBytes(hash.slice(-40));

        // Add Tron prefix (0x41)
        const addressWithPrefix = new Uint8Array(21);
        addressWithPrefix[0] = 0x41;
        addressWithPrefix.set(addressBytes, 1);

        // Base58check encode
        return this.base58CheckEncode(addressWithPrefix);
    }

    hexToBytes(hex) {
        if (hex.startsWith('0x')) hex = hex.slice(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    base58CheckEncode(payload) {
        const { ethers } = window.cryptoLibs;

        // Double SHA256 for checksum
        const hash1 = ethers.utils.sha256(payload);
        const hash2 = ethers.utils.sha256(hash1);
        const checksum = this.hexToBytes(hash2.slice(2, 10));

        // Append checksum
        const addressBytes = new Uint8Array(payload.length + 4);
        addressBytes.set(payload);
        addressBytes.set(checksum, payload.length);

        // Base58 encode
        return this.base58Encode(addressBytes);
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
            const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=10`);
            const data = await response.json();

            if (data.data && Array.isArray(data.data)) {
                return data.data.map(tx => {
                    const value = tx.raw_data?.contract?.[0]?.parameter?.value?.amount || 0;
                    const fromHex = tx.raw_data?.contract?.[0]?.parameter?.value?.owner_address;
                    // Convert hex address to base58 for comparison (TronGrid returns hex)
                    let fromAddress = fromHex;
                    if (fromHex && !fromHex.startsWith('T')) {
                        try {
                            fromAddress = this.base58CheckEncode(this.hexToBytes(fromHex));
                        } catch (e) {
                            // If conversion fails, use as-is
                        }
                    }
                    return {
                        hash: tx.txID,
                        timestamp: tx.block_timestamp,
                        type: fromAddress === address ? 'sent' : 'received',
                        value: (value / 1000000).toFixed(6)
                    };
                });
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch Tron transactions:', error);
            return [];
        }
    }
}

// Export for ES modules
export { TronService };

// SECURITY FIX 3: window.* globals removed — use ES module imports instead

