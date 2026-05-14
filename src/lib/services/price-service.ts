/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
/**
 * Centralized Price Service
 * Fetches all crypto prices in one request from Worker's KV cache
 */

const WORKER_URL = "https://api.rivarawallet.xyz";

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
        console.warn("Price fetch failed, using fallback prices");
        return this.getFallbackPrices();
      }

      const data: BulkPriceResponse = await response.json();
      console.log("✅ Prices loaded from KV cache:", data._source);
      return data.prices;
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      return this.getFallbackPrices();
    }
  }

  /**
   * Get price for a specific coin
   */
  async getPrice(coinId: string): Promise<number> {
    const prices = await this.getAllPrices();

    // Handle Polygon ID aliases (CoinGecko changed it)
    if (coinId === "matic-network" || coinId === "polygon") {
      return (
        prices["polygon-ecosystem-token"]?.usd ||
        prices["matic-network"]?.usd ||
        this.getFallbackPrice("matic-network")
      );
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
      bitcoin: { usd: 79271 },
      ethereum: { usd: 2257.68 },
      solana: { usd: 91.07 },
      tron: { usd: 0.35 },
      dogecoin: { usd: 0.11 },
      litecoin: { usd: 56.96 },
      "polygon-ecosystem-token": { usd: 0.10 },
      "matic-network": { usd: 0.10 }, // Legacy alias
      "avalanche-2": { usd: 9.75 },
      binancecoin: { usd: 671.38 },
      tezos: { usd: 0.38 },
    };
  }

  /**
   * Get fallback price for a specific coin
   */
  private getFallbackPrice(coinId: string): number {
    const fallbacks: Record<string, number> = {
      bitcoin: 79271,
      ethereum: 2257.68,
      solana: 91.07,
      tron: 0.35,
      dogecoin: 0.11,
      litecoin: 56.96,
      "polygon-ecosystem-token": 0.10,
      "matic-network": 0.10, // Legacy alias
      "avalanche-2": 9.75,
      binancecoin: 671.38,
      tezos: 0.38,
    };
    return fallbacks[coinId] || 0;
  }
}

// Export singleton instance
export const priceService = new PriceService();
