/**
 * Unified UTXO-based Send Service
 * Handles Bitcoin, Litecoin, Dogecoin (and any other UTXO chains)
 * SECURITY: Derives key on-demand, clears after use
 */

import { walletService } from '../wallet-service';
import { deriveUtxoKeyNode } from '../key-derivation-service';

// Network configurations
const NETWORKS = {
	bitcoin: {
		name: 'bitcoin',
		network: null, // Use default bitcoinjs network
		derivationPath: "m/44'/0'/0'/0/0",
		dustThreshold: 546,
		feePerByte: 10,
		estimatedTxSize: 250,
		apiEndpoint: 'bitcoin',
		explorer: 'https://blockchair.com/bitcoin/transaction/'
	},
	litecoin: {
		name: 'litecoin',
		network: {
			messagePrefix: '\x19Litecoin Signed Message:\n',
			bech32: 'ltc',
			bip32: {
				public: 0x019da462,
				private: 0x019d9cfe
			},
			pubKeyHash: 0x30,
			scriptHash: 0x32,
			wif: 0xb0
		},
		derivationPath: "m/44'/2'/0'/0/0",
		dustThreshold: 100000, // 0.001 LTC
		feePerByte: 1,
		estimatedTxSize: 250,
		apiEndpoint: 'litecoin',
		explorer: 'https://blockchair.com/litecoin/transaction/'
	},
	dogecoin: {
		name: 'dogecoin',
		network: {
			messagePrefix: '\x19Dogecoin Signed Message:\n',
			bech32: 'doge',
			bip32: {
				public: 0x02facafd,
				private: 0x02fac398
			},
			pubKeyHash: 0x1e,
			scriptHash: 0x16,
			wif: 0x9e
		},
		derivationPath: "m/44'/3'/0'/0/0",
		dustThreshold: 100000000, // 1 DOGE
		feePerByte: 100,
		estimatedTxSize: 250,
		apiEndpoint: 'dogecoin',
		explorer: 'https://blockchair.com/dogecoin/transaction/'
	}
};

/**
 * Fetch UTXOs for an address
 */
async function fetchUtxos(chain, address) {
	const config = NETWORKS[chain];
	let utxos = [];

	// Try Blockchair first
	try {
		const url = `https://api.rivarawallet.xyz/api/blockchair/${config.apiEndpoint}/${address}`;
		const response = await fetch(url);
		const data = await response.json();

		if (data.data && data.data[address] && data.data[address].utxo) {
			utxos = data.data[address].utxo;
			return utxos;
		}
	} catch (error) {
		// Blockchair failed, try fallbacks
	}

	// Fallback for Bitcoin only - blockchain.info
	if (chain === 'bitcoin' && utxos.length === 0) {
		try {
			const response = await fetch(`https://blockchain.info/unspent?active=${address}`);
			const data = await response.json();

			if (data.unspent_outputs) {
				utxos = data.unspent_outputs.map(utxo => ({
					transaction_hash: utxo.tx_hash_big_endian,
					index: utxo.tx_output_n,
					value: utxo.value
				}));
				return utxos;
			}
		} catch (error) {
			// Blockchain.info fallback failed
		}
	}

	// Fallback for Litecoin - BlockCypher
	if (chain === 'litecoin' && utxos.length === 0) {
		try {
			const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}?unspentOnly=true&includeScript=true`);
			const data = await response.json();

			if (data.txrefs) {
				utxos = data.txrefs.map(tx => ({
					transaction_hash: tx.tx_hash,
					index: tx.tx_output_n,
					value: tx.value,
					script_hex: tx.script
				}));
				return utxos;
			}
		} catch (error) {
			// BlockCypher fallback failed
		}
	}

	return utxos;
}

/**
 * Fetch full transaction hex (needed for legacy inputs)
 */
async function fetchTransactionHex(chain, txHash) {
	// Try blockchain.info for Bitcoin
	if (chain === 'bitcoin') {
		try {
			const response = await fetch(`https://blockchain.info/rawtx/${txHash}?format=hex`);
			return await response.text();
		} catch (error) {
			// Failed to fetch tx hex
		}
	}

	// Try BlockCypher for Litecoin
	if (chain === 'litecoin') {
		try {
			const response = await fetch(`https://api.blockcypher.com/v1/ltc/main/txs/${txHash}?includeHex=true`);
			const data = await response.json();
			if (data && data.hex) {
				return data.hex;
			}
		} catch (error) {
			// Failed to fetch tx hex
		}
	}

	return null;
}

/**
 * Broadcast transaction
 */
async function broadcastTransaction(chain, txHex) {
	const config = NETWORKS[chain];

	// Try Blockchair first
	try {
		const url = `https://api.rivarawallet.xyz/api/blockchair/${config.apiEndpoint}/broadcast`;
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ data: txHex })
		});

		const data = await response.json();

		if (data.data && data.data.transaction_hash) {
			return data.data.transaction_hash;
		}
	} catch (error) {
		// Blockchair broadcast failed
	}

	// Fallback for Bitcoin - blockchain.info
	if (chain === 'bitcoin') {
		try {
			const response = await fetch('https://blockchain.info/pushtx', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `tx=${txHex}`
			});

			const result = await response.text();
			if (result && !result.includes('error')) {
				const { bitcoin } = window.cryptoLibs;
				const tx = bitcoin.Transaction.fromHex(txHex);
				return tx.getId();
			}
		} catch (error) {
			// Blockchain.info broadcast failed
		}
	}

	throw new Error('All broadcast methods failed');
}

/**
 * Send UTXO-based cryptocurrency
 * @param {string} chain - 'bitcoin', 'litecoin', or 'dogecoin'
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount to send (in base units: BTC, LTC, DOGE)
 */
export async function sendUtxo(chain, toAddress, amount) {
	let child = null;
	try {
		const config = NETWORKS[chain];
		if (!config) {
			throw new Error(`Unsupported chain: ${chain}`);
		}

		const wallet = walletService.getWallet();
		if (!wallet) throw new Error('Wallet not found');

		const { bitcoin } = window.cryptoLibs;

		// SECURITY: Derive key on-demand instead of reading wallet.mnemonic
		child = await deriveUtxoKeyNode(chain);

		const fromAddress = wallet[chain].address;
		const amountSatoshis = Math.floor(parseFloat(amount) * 100000000);

		// Fetch UTXOs
		const utxos = await fetchUtxos(chain, fromAddress);

		if (utxos.length === 0) {
			throw new Error('No UTXOs available - wallet may be empty or APIs are down');
		}

		// Calculate fee
		const fee = config.feePerByte * config.estimatedTxSize;

		// Select UTXOs
		let inputSum = 0;
		const selectedUtxos = [];

		for (const utxo of utxos) {
			selectedUtxos.push(utxo);
			inputSum += utxo.value;

			if (inputSum >= amountSatoshis + fee) {
				break;
			}
		}

		// Adjust for "send max" scenario
		let sendAmountSatoshis = amountSatoshis;
		if (inputSum < sendAmountSatoshis + fee) {
			if (inputSum > fee) {
				sendAmountSatoshis = inputSum - fee;
			} else {
				throw new Error(`Insufficient funds. Need ${amountSatoshis + fee} satoshis, have ${inputSum}`);
			}
		}

		// Build transaction
		const psbt = new bitcoin.Psbt({ network: config.network || bitcoin.networks.bitcoin });

		// Add inputs
		for (const utxo of selectedUtxos) {
			const isLegacy = !utxo.script_hex || utxo.script_hex.startsWith('76a914');

			if (isLegacy) {
				// Legacy addresses need full transaction hex
				const txHex = await fetchTransactionHex(chain, utxo.transaction_hash);
				if (!txHex) {
					throw new Error(`Could not fetch transaction hex for ${utxo.transaction_hash}`);
				}

				psbt.addInput({
					hash: utxo.transaction_hash,
					index: utxo.index,
					nonWitnessUtxo: Buffer.from(txHex, 'hex')
				});
			} else {
				// SegWit addresses
				psbt.addInput({
					hash: utxo.transaction_hash,
					index: utxo.index,
					witnessUtxo: {
						script: Buffer.from(utxo.script_hex, 'hex'),
						value: utxo.value
					}
				});
			}
		}

		// Add recipient output
		psbt.addOutput({
			address: toAddress,
			value: sendAmountSatoshis
		});

		// Add change output if needed
		const change = inputSum - sendAmountSatoshis - fee;
		if (change > config.dustThreshold) {
			psbt.addOutput({
				address: fromAddress,
				value: change
			});
		}

		// Sign all inputs
		for (let i = 0; i < selectedUtxos.length; i++) {
			psbt.signInput(i, child);
		}

		// Finalize and extract
		psbt.finalizeAllInputs();
		const txHex = psbt.extractTransaction().toHex();

		// Broadcast
		const txHash = await broadcastTransaction(chain, txHex);

		return txHash;

	} catch (error) {
		throw error;
	} finally {
		// SECURITY: Clear key material from memory
		child = null;
	}
}

// Export individual chain functions for backwards compatibility
export async function sendBitcoin(toAddress, amount) {
	return sendUtxo('bitcoin', toAddress, amount);
}

export async function sendLitecoin(toAddress, amount) {
	return sendUtxo('litecoin', toAddress, amount);
}

export async function sendDogecoin(toAddress, amount) {
	return sendUtxo('dogecoin', toAddress, amount);
}
