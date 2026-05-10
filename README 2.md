# Rivara Wallet

A non-custodial, privacy-focused multi-chain cryptocurrency wallet built with SvelteKit. Your keys, your crypto.

🌐 **Live:** [rivarawallet.xyz](https://rivarawallet.xyz)

> ⚠️ **License:** Source Available — not Open Source. You can view, fork, and modify for personal use. You **cannot** host as a public service or redistribute commercially. See [LICENSE](LICENSE).

## Supported Chains

- Bitcoin (BTC)
- Ethereum (ETH)
- Polygon (POL)
- Dogecoin (DOGE)
- Litecoin (LTC)
- Solana (SOL)
- Tezos (XTZ)
- Tron (TRX)

## Features

- **Non-custodial** — private keys never leave your device
- **Multi-chain** — 8 cryptocurrencies in one wallet
- **AES-GCM 256-bit encryption** — PBKDF2 with 100k iterations
- **Duress password** — shows a decoy wallet under coercion
- **Private keys tab** — password-gated access to all derived keys
- **Address book** — auto-detects chain from address format
- **Tuffbackup** — encrypted backup with HMAC integrity verification, includes address book
- **Built-in exchange** — swap via ChangeNOW
- **Portfolio tracking** — real-time balances and price charts
- **Proxied RPC** — all API calls route through Cloudflare Worker, no keys exposed client-side
- **No KYC, no tracking, no registration**
- **BIP39 compatible** — import/export with any standard wallet

## Tech Stack

- **Frontend:** SvelteKit + TypeScript + Tailwind CSS
- **Crypto:** Ethers.js, BitcoinJS, TweetNaCl, Web Crypto API
- **Backend:** Cloudflare Worker + KV (price caching, RPC proxy)
- **APIs:** CoinGecko, ChangeNOW, Helius, Ankr, Blockchair, BlockCypher
- **Hosting:** Cloudflare Pages
- **Package Manager:** Bun

## Running Locally

```bash
bun install
bun run dev
```

Open `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── routes/          # SvelteKit pages
│   ├── lib/
│   │   ├── services/    # Blockchain & crypto services
│   │   ├── stores/      # Svelte stores
│   │   └── components/  # UI components
│   └── app.html
├── static/              # Static assets & crypto libs
├── worker.js            # Cloudflare Worker (RPC proxy + price cache)
└── wrangler.toml        # Cloudflare config
```

## Security

- AES-GCM 256-bit encryption, PBKDF2 100k iterations
- Min 12 char passwords with complexity requirements
- Rate limiting on unlock attempts with exponential backoff
- Checksum address validation for all chains
- HMAC integrity verification on backup files
- No server-side storage — everything stays in the browser

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

Source Available — See [LICENSE](LICENSE)

---

Rivara is a product of [DogeGage](https://dogegage.com).
