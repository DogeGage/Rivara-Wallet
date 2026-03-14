/**
 * Duress Wallet Service - Generates convincing fake wallet for duress situations
 */

export class DuressWalletService {
	/**
	 * Generate a fake wallet that looks real but has small balances
	 */
	generateFakeWallet() {
		// Generate fake addresses (deterministic based on a fake seed)
		const fakeAddresses = {
			bitcoin: this.generateFakeBitcoinAddress(),
			ethereum: this.generateFakeEthereumAddress(),
			dogecoin: this.generateFakeDogecoinAddress(),
			litecoin: this.generateFakeLitecoinAddress(),
			solana: this.generateFakeSolanaAddress(),
			tezos: this.generateFakeTezosAddress(),
			tron: this.generateFakeTronAddress()
		};

		// Small fake balances ($50-200 total)
		return {
			bitcoin: {
				address: fakeAddresses.bitcoin,
				balance: '0.00085000',
				balanceUSD: '85.00',
				transactions: []
			},
			ethereum: {
				address: fakeAddresses.ethereum,
				balance: '0.0150',
				balanceUSD: '45.00',
				transactions: []
			},
			dogecoin: {
				address: fakeAddresses.dogecoin,
				balance: '250.00000000',
				balanceUSD: '20.00',
				transactions: []
			},
			litecoin: {
				address: fakeAddresses.litecoin,
				balance: '0.15000000',
				balanceUSD: '15.00',
				transactions: []
			},
			solana: {
				address: fakeAddresses.solana,
				balance: '0.200000',
				balanceUSD: '30.00',
				transactions: []
			},
			tezos: {
				address: fakeAddresses.tezos,
				balance: '5.000000',
				balanceUSD: '6.00',
				transactions: []
			},
			tron: {
				address: fakeAddresses.tron,
				balance: '50.000000',
				balanceUSD: '7.50',
				transactions: []
			},
			polygon: {
				address: fakeAddresses.ethereum,
				balance: '10.00000000',
				balanceUSD: '5.00',
				transactions: []
			},
			dgage: {
				address: fakeAddresses.ethereum,
				balance: '0.0000',
				balanceUSD: '0.00',
				transactions: []
			}
		};
	}

	generateFakeBitcoinAddress() {
		const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
		let addr = '1';
		const length = 26 + Math.floor(Math.random() * 8);
		for (let i = 0; i < length; i++) {
			addr += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return addr;
	}

	generateFakeEthereumAddress() {
		return '0x' + this.randomHex(40);
	}

	generateFakeDogecoinAddress() {
		return 'D' + this.randomString(33);
	}

	generateFakeLitecoinAddress() {
		return 'L' + this.randomString(33);
	}

	generateFakeSolanaAddress() {
		return this.randomString(44);
	}

	generateFakeTezosAddress() {
		return 'tz1' + this.randomString(33);
	}

	generateFakeTronAddress() {
		return 'T' + this.randomString(33);
	}

	randomString(length: number) {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	randomHex(length: number) {
		const chars = '0123456789abcdef';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}
}

export const duressWalletService = new DuressWalletService();
