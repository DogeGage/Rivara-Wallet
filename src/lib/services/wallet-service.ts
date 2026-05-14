/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
import { wallet, isUnlocked, balancesLoading } from "$lib/stores/wallet";
import type { Wallet, WalletAsset } from "$lib/stores/wallet";
import { get } from "svelte/store";
import {
  BitcoinService,
  DogecoinService,
  LitecoinService,
} from "./utxo-chain-service.js";
import {
  EVMChainService,
  AvalancheService,
  BscService,
} from "./evm-chain-service.js";
import { SolanaService } from "./solana-service.js";
import { TronService } from "./tron-service.js";
import { DGAGEService } from "./dgage-service.js";
// @ts-ignore - JS module
import { TokenScanner } from "./token-scanner.js";

/** All native chain keys in the wallet — used for cache loops. */
const CHAIN_KEYS = [
  "bitcoin", "dogecoin", "litecoin",
  "ethereum", "polygon", "tron",
  "solana", "dgage", "avalanche", "bsc",
] as const;

type ChainKey = typeof CHAIN_KEYS[number];

// SECURITY: HMAC key for cached balance integrity (generated per-session)
let _sessionHmacKey: CryptoKey | null = null;

async function getSessionHmacKey(): Promise<CryptoKey> {
  if (_sessionHmacKey) return _sessionHmacKey;

  // Generate a random key per session for HMAC on cached balances
  _sessionHmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return _sessionHmacKey;
}

async function computeHmac(data: string): Promise<string> {
  const key = await getSessionHmacKey();
  const encoded = new TextEncoder().encode(data);
  const sig = await crypto.subtle.sign("HMAC", key, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyHmac(data: string, hmac: string): Promise<boolean> {
  const key = await getSessionHmacKey();
  const encoded = new TextEncoder().encode(data);
  const sigBytes = Uint8Array.from(atob(hmac), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoded);
}

class WalletService {
  private isFetching = false;

  // Chain services are singletons — no reason to re-instantiate on every refresh.
  private readonly bitcoin   = new BitcoinService();
  private readonly dogecoin  = new DogecoinService();
  private readonly litecoin  = new LitecoinService();
  private readonly ethereum  = new EVMChainService("ethereum");
  private readonly polygon   = new EVMChainService("polygon");
  private readonly solana    = new SolanaService();
  private readonly tron      = new TronService();
  private readonly avalanche = new AvalancheService();
  private readonly bsc       = new BscService();
  private readonly dgage     = new DGAGEService();
  // @ts-ignore
  private readonly tokens    = new TokenScanner();

  /**
   * Fetch EVM chain balances (ETH, Polygon) via backend worker that proxies Ankr Advanced API.
   * This keeps API keys server-side and falls back to per-chain providers in the caller if it fails.
   */
  private async getEvmBalancesFromAnkr(evmAddress: string): Promise<{
    ethereum?: { balance: string; balanceUSD: string };
    polygon?: { balance: string; balanceUSD: string };
  }> {
    const response = await fetch("https://api.rivarawallet.xyz/api/ankr/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: evmAddress,
        blockchains: ["eth", "polygon"],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ankr balance request failed with status ${response.status}`,
      );
    }

    const json = await response.json();
    const assets = json?.assets;
    if (!Array.isArray(assets)) {
      throw new Error("Invalid Ankr balance response");
    }

    const result: {
      ethereum?: { balance: string; balanceUSD: string };
      polygon?: { balance: string; balanceUSD: string };
    } = {};

    for (const asset of assets) {
      if (!asset) continue;
      const blockchain = asset.blockchain as string | undefined;
      const isNative = asset.tokenType === "NATIVE" || !asset.contractAddress;
      if (!isNative || !blockchain) continue;

      const balance = Number(asset.balance ?? 0);
      const balanceUsd = Number(asset.balanceUsd ?? 0);

      if (blockchain === "eth") {
        result.ethereum = {
          balance: balance.toFixed(4),
          balanceUSD: balanceUsd.toFixed(2),
        };
      } else if (blockchain === "polygon") {
        result.polygon = {
          balance: balance.toFixed(4),
          balanceUSD: balanceUsd.toFixed(2),
        };
      }
    }

    return result;
  }

  async importFromSeed(mnemonic: string) {
    // @ts-ignore - cryptoLibs loaded from CDN in app.html
    if (!window.cryptoLibs) {
      throw new Error("Crypto libraries not loaded");
    }

    // @ts-ignore
    const { ethers } = window.cryptoLibs;

    // Validate mnemonic (ethers v5 syntax)
    try {
      ethers.utils.HDNode.fromMnemonic(mnemonic);
    } catch (e) {
      throw new Error("Invalid seed phrase");
    }

    // Derive addresses — use singleton service instances (no re-instantiation needed)
    const ethData  = this.ethereum.deriveAddress(mnemonic);
    const btcData  = this.bitcoin.deriveAddress(mnemonic);
    const dogeData = this.dogecoin.deriveAddress(mnemonic);
    const ltcData  = this.litecoin.deriveAddress(mnemonic);
    const trxData  = this.tron.deriveAddress(mnemonic);
    const solData  = await this.solana.deriveAddress(mnemonic);
    const avaxData = this.avalanche.deriveAddress(mnemonic);
    const bnbData  = this.bsc.deriveAddress(mnemonic);

    // SECURITY: Only store addresses and public data — NO mnemonic, NO privateKey
    const newWallet = {
      bitcoin: {
        address: btcData.address,
        balance: "0.00000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      dogecoin: {
        address: dogeData.address,
        balance: "0.00000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      litecoin: {
        address: ltcData.address,
        balance: "0.00000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      ethereum: {
        address: ethData.address,
        balance: "0.0000",
        balanceUSD: "0.00",
        transactions: [],
      },
      polygon: {
        address: ethData.address,
        balance: "0.00000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      dgage: {
        address: ethData.address,
        balance: "0.0000",
        balanceUSD: "0.00",
        transactions: [],
      },
      tron: {
        address: trxData.address,
        balance: "0.000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      solana: {
        address: solData.address,
        balance: "0.000000",
        balanceUSD: "0.00",
        transactions: [],
      },
      avalanche: {
        address: avaxData.address,
        balance: "0.0000",
        balanceUSD: "0.00",
        transactions: [],
      },
      bsc: {
        address: bnbData.address,
        balance: "0.0000",
        balanceUSD: "0.00",
        transactions: [],
      },
    };

    wallet.set(newWallet);
    isUnlocked.set(true);
    sessionStorage.setItem("walletUnlocked", "true");

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
      let ankrEvmBalances: {
        ethereum?: { balance: string; balanceUSD: string };
        polygon?: { balance: string; balanceUSD: string };
      } | null = null;
      try {
        if (currentWallet.ethereum?.address) {
          ankrEvmBalances = await this.getEvmBalancesFromAnkr(
            currentWallet.ethereum.address,
          );
        }
      } catch {
        ankrEvmBalances = null;
      }

      // Use singleton service instances.

      // Helper: update a single chain as soon as its balance resolves
      const tasks: Promise<void>[] = [];

      const updateChain = (
        key: keyof typeof currentWallet,
        promise: Promise<{ balance: string; balanceUSD: string }>,
      ) => {
        const task = promise.then((result) => {
          wallet.update((w: any) => {
            if (!w) return w;
            return {
              ...w,
              [key]: {
                ...w[key],
                balance: result.balance,
                balanceUSD: result.balanceUSD,
              },
            };
          });
        });
        tasks.push(task);
      };

      // Dispatch all chain fetches — Ankr result used for ETH/Polygon where available.
      const fallback = { balance: "0", balanceUSD: "0" };

      const chainServices: Record<ChainKey, { getBalanceUSD: (addr: string) => Promise<{ balance: string; balanceUSD: string }> }> = {
        bitcoin:   this.bitcoin,
        dogecoin:  this.dogecoin,
        litecoin:  this.litecoin,
        ethereum:  this.ethereum,
        polygon:   this.polygon,
        solana:    this.solana,
        tron:      this.tron,
        avalanche: this.avalanche,
        bsc:       this.bsc,
        dgage:     this.dgage,
      };

      for (const key of CHAIN_KEYS) {
        // Prefer cached Ankr result for ETH/Polygon
        const ankr = ankrEvmBalances?.[key as "ethereum" | "polygon"];
        updateChain(
          key,
          ankr
            ? Promise.resolve(ankr)
            : chainServices[key]
                .getBalanceUSD(currentWallet[key].address)
                .catch(() => fallback),
        );
      }

      // USDC detection (does not block native balances)
      const usdcTask = (async () => {
        const ethUsdcContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        const polygonUsdcContract =
          "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

        let detectedEthereumTokens: any[] = [];
        let detectedPolygonTokens: any[] = [];
        try {
          const [ethUsdc, polyUsdc] = await Promise.all([
            this.tokens
              .getERC20TokenData(
                currentWallet.ethereum.address,
                ethUsdcContract,
                "ethereum",
              )
              .catch(() => null),
            this.tokens
              .getERC20TokenData(
                currentWallet.polygon.address,
                polygonUsdcContract,
                "polygon",
              )
              .catch(() => null),
          ]);

          if (ethUsdc && parseFloat(ethUsdc.balance) >= 0)
            detectedEthereumTokens.push(ethUsdc);
          if (polyUsdc && parseFloat(polyUsdc.balance) >= 0)
            detectedPolygonTokens.push(polyUsdc);
        } catch {
          // keep empty on error
        }

        wallet.update((w: any) => {
          if (!w) return w;
          return {
            ...w,
            detectedTokens: {
              ethereum: detectedEthereumTokens,
              polygon: detectedPolygonTokens,
            },
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

  /** Persist chain balances to localStorage with an HMAC integrity tag. */
  async cacheBalances(walletData: Wallet): Promise<void> {
    const cache: Record<string, { balance: string; balanceUSD: string }> & { timestamp: number } = { timestamp: Date.now() } as any;

    for (const key of CHAIN_KEYS) {
      const asset = walletData[key] as WalletAsset;
      cache[key] = { balance: asset.balance, balanceUSD: asset.balanceUSD };
    }

    const cacheJson = JSON.stringify(cache);
    const hmac = await computeHmac(cacheJson);
    localStorage.setItem("cachedBalances", JSON.stringify({ data: cacheJson, hmac }));
  }

  async loadCachedBalances(): Promise<any | null> {
    try {
      const cached = localStorage.getItem("cachedBalances");
      if (!cached) return null;

      const envelope = JSON.parse(cached);

      // SECURITY: Verify HMAC before trusting cached data
      if (!envelope.data || !envelope.hmac) {
        // Legacy format without HMAC — discard
        localStorage.removeItem("cachedBalances");
        return null;
      }

      const valid = await verifyHmac(envelope.data, envelope.hmac);
      if (!valid) {
        // Tampered data — discard
        localStorage.removeItem("cachedBalances");
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
   * Shown immediately on mount so the UI isn't blank while fetching.
   */
  async hydrateWalletFromCache(): Promise<void> {
    const current = get(wallet);
    if (!current) return;

    const cached = await this.loadCachedBalances();
    if (!cached) return;

    // Build the updated wallet by merging cached balance/balanceUSD per chain.
    const updated = { ...current };
    for (const key of CHAIN_KEYS) {
      const entry = cached[key] as { balance: string; balanceUSD: string } | undefined;
      if (!entry) continue;
      updated[key] = {
        ...(current[key] as WalletAsset),
        balance:    entry.balance    ?? (current[key] as WalletAsset).balance,
        balanceUSD: entry.balanceUSD ?? (current[key] as WalletAsset).balanceUSD,
      };
    }

    wallet.set(updated);
  }

  lock() {
    wallet.set(null);
    isUnlocked.set(false);
    sessionStorage.removeItem("walletUnlocked");
    // Reset session HMAC key on lock
    _sessionHmacKey = null;
  }

  getWallet(): Wallet | null {
    const current = get(wallet);
    if (!current) return null;

    // One-time migration: old code stored address as an object instead of a string.
    const keysToMigrate: ChainKey[] = ["dogecoin", "litecoin"];
    let dirty = false;

    const migrated = { ...current };
    for (const key of keysToMigrate) {
      const asset = migrated[key] as WalletAsset;
      if (typeof asset.address === "object") {
        migrated[key] = { ...asset, address: (asset.address as any).address ?? "" };
        dirty = true;
      }
    }

    if (dirty) wallet.set(migrated);
    return dirty ? migrated : current;
  }

  getChainService(chain: string) {
    switch (chain.toLowerCase()) {
      case "bitcoin":
      case "btc":
        return new BitcoinService();
      case "dogecoin":
      case "doge":
        return new DogecoinService();
      case "litecoin":
      case "ltc":
        return new LitecoinService();
      case "ethereum":
      case "eth":
        return new EVMChainService("ethereum");
      case "polygon":
      case "pol":
        return new EVMChainService("polygon");
      case "solana":
      case "sol":
        return new SolanaService();

      case "tron":
      case "trx":
        return new TronService();
      default:
        return null;
    }
  }
}

export const walletService = new WalletService();
