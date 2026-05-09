/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
// Disable SSR for the entire app (client-side only wallet)
export const ssr = false;
export const prerender = true;

// Default metadata for all pages
export const load = () => {
  return {
    meta: {
      title: "Rivara Wallet - Secure Multi-Chain Crypto Wallet",
      description:
        "Non-custodial multi-chain cryptocurrency wallet supporting Bitcoin, Ethereum, Dogecoin, Litecoin, Solana, Tron, and Polygon.",
      keywords:
        "crypto wallet, bitcoin, ethereum, dogecoin, multi-chain, non-custodial",
    },
  };
};
