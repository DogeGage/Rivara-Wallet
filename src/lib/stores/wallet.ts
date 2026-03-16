import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface WalletAsset {
	address: string;
	balance: string;
	balanceUSD: string;
	transactions: any[];
	// SECURITY: privateKey removed — derived on-demand for signing only
}

export interface Wallet {
	// SECURITY: mnemonic removed — never stored in the reactive store
	bitcoin: WalletAsset;
	dogecoin: WalletAsset;
	litecoin: WalletAsset;
	ethereum: WalletAsset;
	polygon: WalletAsset;
	dgage: WalletAsset;
	tezos: WalletAsset;
	tron: WalletAsset;
	solana: WalletAsset;
	detectedTokens?: {
		ethereum?: any[];
		polygon?: any[];
	};
}

export const wallet: Writable<Wallet | null> = writable(null);
export const isUnlocked = writable(false);
/** Set true only right before navigating to /wallet from unlock; wallet page sets false on mount. Prevents redirect loop. */
export const isCurrentUnlock: Writable<boolean> = writable(false);
export const balancesLoading = writable(false);
export const selectedCurrency = writable('usd');

// Currency conversion rates
export const exchangeRates = writable({
	usd: 1,
	eur: 0.92,
	gbp: 0.79,
	jpy: 149.50,
	cad: 1.36,
	aud: 1.52,
	chf: 0.88,
	cny: 7.24,
	inr: 83.12,
	krw: 1320.50
});

// Currency symbols
export const currencySymbols: Record<string, string> = {
	usd: '$',
	eur: '€',
	gbp: '£',
	jpy: '¥',
	cad: '$',
	aud: '$',
	chf: 'Fr',
	cny: '¥',
	inr: '₹',
	krw: '₩'
};

// Derived store for total balance (includes native chains + detected ERC-20 e.g. USDC)
export const totalBalance = derived(wallet, ($wallet) => {
	if (!$wallet) return '0.00';

	let total =
		parseFloat($wallet.bitcoin.balanceUSD || '0') +
		parseFloat($wallet.ethereum.balanceUSD || '0') +
		parseFloat($wallet.dogecoin.balanceUSD || '0') +
		parseFloat($wallet.litecoin.balanceUSD || '0') +
		parseFloat($wallet.polygon.balanceUSD || '0') +
		parseFloat($wallet.dgage.balanceUSD || '0') +
		parseFloat($wallet.tron.balanceUSD || '0') +
		parseFloat($wallet.solana.balanceUSD || '0') +
		parseFloat($wallet.avalanche.balanceUSD || '0') +
		parseFloat($wallet.bsc.balanceUSD || '0');

	const ethTokens = $wallet.detectedTokens?.ethereum || [];
	const polyTokens = $wallet.detectedTokens?.polygon || [];
	for (const t of ethTokens) total += parseFloat(t.balanceUSD || '0');
	for (const t of polyTokens) total += parseFloat(t.balanceUSD || '0');

	return total.toFixed(2);
});

// Convert USD to selected currency
export function convertCurrency(usdAmount: string | number, currency: string, rates: Record<string, number>): string {
	const rate = rates[currency] || 1;
	const converted = parseFloat(usdAmount.toString()) * rate;

	// Format based on currency (no decimals for JPY, KRW)
	if (currency === 'jpy' || currency === 'krw') {
		return Math.round(converted).toLocaleString();
	}
	return converted.toFixed(2);
}

// Fetch exchange rates
export async function fetchExchangeRates() {
	try {
		const response = await fetch('https://api.rivarawallet.xyz/api/rates');
		const data = await response.json();

		if (data && data.rates) {
			exchangeRates.set({
				usd: 1,
				eur: data.rates.EUR,
				gbp: data.rates.GBP,
				jpy: data.rates.JPY,
				cad: data.rates.CAD,
				aud: data.rates.AUD,
				chf: data.rates.CHF,
				cny: data.rates.CNY,
				inr: data.rates.INR,
				krw: data.rates.KRW
			});
		}
	} catch (error) {
		console.error('Failed to fetch exchange rates:', error);
	}
}
