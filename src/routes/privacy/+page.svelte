<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Shield } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy — Rivara Wallet</title>
	<meta name="description" content="Rivara Wallet Privacy Policy. Zero tracking, zero analytics, zero data collection." />
</svelte:head>

<div class="min-h-screen bg-[#070b10]">
	<!-- Nav -->
	<nav class="sticky top-0 z-50 bg-stone-900/90 backdrop-blur-lg border-b border-white/10">
		<div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
			<button class="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5" on:click={() => history.back()}>
				<ArrowLeft size={20} />
			</button>
			<div class="flex items-center gap-2">
				<Shield size={20} class="text-cyan-400" />
				<h1 class="text-lg font-bold text-white">Privacy Policy</h1>
			</div>
		</div>
	</nav>

	<div class="max-w-3xl mx-auto px-6 py-12">
		<p class="text-slate-500 text-sm mb-8">Last updated: March 2026</p>

		<div class="prose-custom space-y-8">
			<section>
				<h2>Our Promise</h2>
				<p>Rivara Wallet is built on a simple principle: <strong>your crypto is your business</strong>. We do not collect, store, transmit, or sell any personal data. Period.</p>
			</section>

			<section>
				<h2>What We Don't Collect</h2>
				<ul>
					<li><strong>Seed phrases & private keys</strong> — encrypted locally on your device, never transmitted</li>
					<li><strong>Passwords</strong> — used only in-memory for decryption, never stored in plaintext</li>
					<li><strong>IP addresses</strong> — we don't log connections</li>
					<li><strong>Usage analytics</strong> — no tracking pixels, no Google Analytics, nothing</li>
					<li><strong>Wallet balances</strong> — fetched directly from public blockchains by your browser</li>
					<li><strong>Transaction history</strong> — queried from public block explorers by your browser</li>
				</ul>
			</section>

			<section>
				<h2>Local Storage</h2>
				<p>The only data stored is on your device in the browser's localStorage:</p>
				<ul>
					<li><strong>Encrypted wallet data</strong> — your seed phrase encrypted with AES-256-GCM (requires your password to decrypt)</li>
					<li><strong>Display preferences</strong> — your selected currency and UI settings</li>
					<li><strong>Cached balances</strong> — temporarily stored with HMAC integrity verification for display performance</li>
				</ul>
				<p>You can delete all local data at any time via Settings → Remove Wallet.</p>
			</section>

			<section>
				<h2>Third-Party Services</h2>
				<p>Your browser connects directly to these services for blockchain data:</p>
				<ul>
					<li><strong>Public RPC endpoints</strong> — to fetch balances and submit transactions</li>
					<li><strong>Block explorers</strong> (Etherscan, Blockchair, etc.) — for transaction history</li>
					<li><strong>CoinGecko</strong> — for price data</li>
					<li><strong>ChangeNow</strong> — for exchange functionality (only when you initiate an exchange)</li>
				</ul>
				<p>These services have their own privacy policies. We do not send any identifying information to them — only public blockchain addresses.</p>
			</section>

			<section>
				<h2>Open Source</h2>
				<p>Rivara Wallet is open source. You can verify everything we've stated above by reviewing the <a href="https://github.com/dominic84p/Rivara-Wallet" target="_blank" rel="noopener" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">source code on GitHub</a>.</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>Questions about this policy? Open an issue on our <a href="https://github.com/dominic84p/Rivara-Wallet/issues" target="_blank" rel="noopener" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">GitHub repository</a>.</p>
			</section>
		</div>

		<div class="mt-12 pt-8 border-t border-white/10">
			<button 
				class="flex items-center gap-2 text-slate-400 hover:text-white transition"
				on:click={() => history.back()}
			>
				<ArrowLeft size={16} />
				Go back
			</button>
		</div>
	</div>
</div>

<style>
	.prose-custom h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.75rem;
	}
	.prose-custom p {
		color: rgb(148 163 184);
		font-size: 0.875rem;
		line-height: 1.7;
		margin-bottom: 0.5rem;
	}
	.prose-custom strong {
		color: rgb(226 232 240);
	}
	.prose-custom ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prose-custom li {
		color: rgb(148 163 184);
		font-size: 0.875rem;
		line-height: 1.6;
		padding-left: 1.25rem;
		position: relative;
	}
	.prose-custom li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: rgb(168 85 247);
	}
</style>
