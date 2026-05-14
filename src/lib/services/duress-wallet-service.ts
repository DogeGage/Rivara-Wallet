/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */

/**
 * Duress Wallet Service
 * Generates convincing decoy wallet data shown when unlocked with a duress password.
 * Addresses are random but structurally valid — no real keys, no real funds.
 */

export class DuressWalletService {
  generateFakeWallet() {
    const eth = this.fakeEthereumAddress();

    return {
      bitcoin:  { address: this.fakeBitcoinAddress(),  balance: "0.00085000", balanceUSD: "85.00",  transactions: [] },
      ethereum: { address: eth,                         balance: "0.0150",     balanceUSD: "45.00",  transactions: [] },
      dogecoin: { address: this.fakePrefixedAddress("D", 33), balance: "250.00000000", balanceUSD: "20.00",  transactions: [] },
      litecoin: { address: this.fakePrefixedAddress("L", 33), balance: "0.15000000",   balanceUSD: "15.00",  transactions: [] },
      solana:   { address: this.randomBase58(44),       balance: "0.200000",   balanceUSD: "30.00",  transactions: [] },
      tron:     { address: this.fakePrefixedAddress("T", 33), balance: "50.000000",    balanceUSD: "7.50",   transactions: [] },
      polygon:  { address: eth,                         balance: "10.00000000", balanceUSD: "5.00",  transactions: [] },
      dgage:    { address: eth,                         balance: "0.0000",      balanceUSD: "0.00",  transactions: [] },
    };
  }

  // ─── Private address generators (crypto.getRandomValues, not Math.random) ──

  private randomBytes(n: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(n));
  }

  private randomHex(byteCount: number): string {
    return Array.from(this.randomBytes(byteCount))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /** Random string from a Base58 alphabet (no 0, O, I, l). */
  private randomBase58(length: number): string {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const bytes    = this.randomBytes(length);
    return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join("");
  }

  private fakeBitcoinAddress(): string {
    // P2PKH: starts with "1", 26–34 chars total
    const length = 26 + (this.randomBytes(1)[0] % 9);
    return "1" + this.randomBase58(length);
  }

  private fakeEthereumAddress(): string {
    return "0x" + this.randomHex(20);
  }

  private fakePrefixedAddress(prefix: string, bodyLength: number): string {
    return prefix + this.randomBase58(bodyLength);
  }
}

export const duressWalletService = new DuressWalletService();
