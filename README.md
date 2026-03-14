# DogeGage Wallet

A non-custodial, multi-chain cryptocurrency wallet built with SvelteKit. Your keys, your crypto.

🌐 **Live:** [dogegage.com](https://rivarawallet.xyz)

> ⚠️ **License:** This is **Source Available**, not Open Source. You can view, fork, and modify for personal use. You **cannot** host as a public service or redistribute commercially. See [LICENSE](LICENSE).

## Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Dogecoin (DOGE)
- Litecoin (LTC)
- Solana (SOL)
- Tezos (XTZ)
- Tron (TRX)
- Polygon (POL)

## Features

- **Non-custodial** - Private keys never leave your device
- **Multi-chain** - 8+ cryptocurrencies in one wallet
- **Encrypted storage** - AES-GCM 256-bit encryption with PBKDF2
- **Built-in exchange** - Swap via ChangeNOW
- **Tuffbackup** - Encrypted wallet backup system
- **Portfolio tracking** - Real-time balance and price tracking
- **No KYC** - No registration required
- **No tracking** - We don't collect data
- **BIP39 compatible** - Works with other wallets
- **Strong security** - Rate limiting, password requirements, checksum validation

## Tech Stack

- **Frontend:** SvelteKit + TypeScript + Tailwind CSS
- **Crypto Libraries:** Ethers.js, BitcoinJS, TronWeb, Solana Web3.js
- **Encryption:** Web Crypto API (AES-GCM + PBKDF2)
- **APIs:** CoinGecko (prices), ChangeNOW (exchange), Blockchair/BlockCypher (blockchain data)
- **Hosting:** Cloudflare Pages
- **Package Manager:** Bun

## Running Locally

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

Then open `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── routes/              # SvelteKit pages
│   │   ├── +page.svelte     # Landing page
│   │   ├── wallet/          # Wallet page
│   │   ├── create/          # Create wallet
│   │   ├── import/          # Import wallet
│   │   ├── portfolio/       # Portfolio view
│   │   ├── exchange/        # Swap interface
│   │   └── settings/        # Settings
│   ├── lib/
│   │   ├── services/        # Blockchain & crypto services
│   │   ├── stores/          # Svelte stores
│   │   └── components/      # Reusable components
│   └── app.html             # HTML template
├── static/                  # Static assets
├── desktop-app/             # Legacy vanilla JS version
└── package.json
```

> **Note:** The API worker is not included in this repo as it contains API keys. The frontend connects to our hosted worker at `wallet-api.therealdominic84plays.workers.dev`.

## License

**Source Available** - See [LICENSE](LICENSE)

You can view, fork, and modify for personal use. You cannot host as a public service or redistribute commercially.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Security

- **Encryption:** AES-GCM 256-bit with PBKDF2 (100k iterations)
- **Password Requirements:** Min 12 chars, uppercase, lowercase, number, symbol
- **Rate Limiting:** 5 failed unlock attempts with exponential backoff
- **Address Validation:** Checksum verification for all chains
- **No Server Storage:** Everything encrypted locally in browser

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Links

- Website: [dogegage.com](https://dogegage.com)
- Docs: [dogegage.com/docs](https://dogegage.com/docs)
