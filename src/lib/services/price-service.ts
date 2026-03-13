/**
 * Centralized Price Service
 * Fetches all crypto prices in one request from Worker's KV cache
 */

const WORKER_URL = 'https://api.rivarawallet.xyz';

interface PriceData {
	[key: string]: {
		usd: number;
	};
}

interface BulkPriceResponse {
	prices: PriceData;
	coins: string[];
	_source: string;
	_cached: boolean;
	_timestamp: number;
}

class PriceService {
	private cachedPrices: PriceData | null = null;
	private lastFetch: number = 0;
	private fetchPromise: Promise<PriceData> | null = null;
	private readonly CACHE_DURATION = 60000; // 1 minute client-side cache

	/**
	 * Get all prices in one request (cached for 1 minute client-side)
	 */
	async getAllPrices(): Promise<PriceData> {
		const now = Date.now();

		// Return cached prices if still fresh
		if (this.cachedPrices && now - this.lastFetch < this.CACHE_DURATION) {
			return this.cachedPrices;
		}

		// If already fetching, return the existing promise
		if (this.fetchPromise) {
			return this.fetchPromise;
		}

		// Fetch new prices
		this.fetchPromise = this.fetchPrices();

		try {
			const prices = await this.fetchPromise;
			this.cachedPrices = prices;
			this.lastFetch = now;
			return prices;
		} finally {
			this.fetchPromise = null;
		}
	}

	/**
	 * Fetch prices from Worker's bulk endpoint
	 */
	private async fetchPrices(): Promise<PriceData> {
		try {
			const response = await fetch(`${WORKER_URL}/api/prices`);

			if (!response.ok) {
				console.warn('Price fetch failed, using fallback prices');
				return this.getFallbackPrices();
			}

			const data: BulkPriceResponse = await response.json();
			console.log('✅ Prices loaded from KV cache:', data._source);
			return data.prices;
		} catch (error) {
			console.error('Failed to fetch prices:', error);
			return this.getFallbackPrices();
		}
	}

	/**
	 * Get price for a specific coin
	 */
	async getPrice(coinId: string): Promise<number> {
		const prices = await this.getAllPrices();
		
		// Handle Polygon ID aliases (CoinGecko changed it)
		if (coinId === 'matic-network' || coinId === 'polygon') {
			return prices['polygon-ecosystem-token']?.usd || prices['matic-network']?.usd || this.getFallbackPrice('matic-network');
		}
		
		return prices[coinId]?.usd || this.getFallbackPrice(coinId);
	}

	/**
	 * Clear cache and force refresh
	 */
	clearCache() {
		this.cachedPrices = null;
		this.lastFetch = 0;
	}

	/**
	 * Fallback prices if Worker is unavailable
	 */
	private getFallbackPrices(): PriceData {
		return {
			bitcoin: { usd: 95000 },
			ethereum: { usd: 3000 },
			solana: { usd: 150 },
			tezos: { usd: 1.2 },
			tron: { usd: 0.15 },
			dogecoin: { usd: 0.08 },
			litecoin: { usd: 100 },
			'polygon-ecosystem-token': { usd: 0.5 },
			'matic-network': { usd: 0.5 } // Legacy alias
		};
	}

	/**
	 * Get fallback price for a specific coin
	 */
	private getFallbackPrice(coinId: string): number {
		const fallbacks: Record<string, number> = {
			bitcoin: 95000,
			ethereum: 3000,
			solana: 150,
			tezos: 1.2,
			tron: 0.15,
			dogecoin: 0.08,
			litecoin: 100,
			'polygon-ecosystem-token': 0.5,
			'matic-network': 0.5 // Legacy alias
		};
		return fallbacks[coinId] || 0;
	}
}

// Export singleton instance
export const priceService = new PriceService();
