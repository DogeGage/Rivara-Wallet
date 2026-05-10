/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
export type CryptoChain =
  | "bitcoin"
  | "ethereum"
  | "dogecoin"
  | "litecoin"
  | "solana"
  | "tron"
  | "polygon"
  | "avalanche"
  | "bsc";

export interface SendTransaction {
  from: string;
  to: string;
  amount: string;
  chain: CryptoChain;
  privateKey: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface ExchangeQuote {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  toAmount: string;
  estimatedAmount: string;
  exchangeId: string;
}
