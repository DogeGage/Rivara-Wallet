<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, FileText } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Terms of Service — Rivara Wallet</title>
	<meta name="description" content="Rivara Wallet Terms of Service." />
</svelte:head>

<div class="min-h-screen bg-[#070b10]">
	<!-- Nav -->
	<nav class="sticky top-0 z-50 bg-stone-900/90 backdrop-blur-lg border-b border-white/10">
		<div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
			<button class="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5" on:click={() => history.back()}>
				<ArrowLeft size={20} />
			</button>
			<div class="flex items-center gap-2">
				<FileText size={20} class="text-cyan-400" />
				<h1 class="text-lg font-bold text-white">Terms of Service</h1>
			</div>
		</div>
	</nav>

	<div class="max-w-3xl mx-auto px-6 py-12">
		<p class="text-slate-500 text-sm mb-8">Last updated: March 2026</p>

		<div class="prose-custom space-y-8">
			<section>
				<h2>1. Acceptance of Terms</h2>
				<p>By using Rivara Wallet ("the Wallet"), you agree to these Terms of Service. If you do not agree, do not use the Wallet.</p>
			</section>

			<section>
				<h2>2. Description of Service</h2>
				<p>Rivara Wallet is a free, open-source, self-custody cryptocurrency wallet. It allows you to generate, store, and manage cryptocurrency wallets for supported blockchains. The Wallet runs entirely in your web browser — your private keys never leave your device.</p>
			</section>

			<section>
				<h2>3. Self-Custody & Responsibility</h2>
				<p>You are solely responsible for:</p>
				<ul>
					<li>Safeguarding your seed phrase (12-word recovery phrase)</li>
					<li>Keeping your wallet password secure</li>
					<li>Maintaining backups of your wallet</li>
					<li>Verifying transaction details before signing</li>
				</ul>
				<p>If you lose your seed phrase and password, <strong>your funds are permanently unrecoverable</strong>. We cannot help you recover lost wallets — this is by design for your security.</p>
			</section>

			<section>
				<h2>4. No Warranty</h2>
				<p>The Wallet is provided "as is" without warranty of any kind. We do not guarantee:</p>
				<ul>
					<li>Uninterrupted or error-free operation</li>
					<li>Accuracy of displayed balances or prices</li>
					<li>Compatibility with all browsers or devices</li>
					<li>Security of the underlying blockchain networks</li>
				</ul>
			</section>

			<section>
				<h2>5. Limitation of Liability</h2>
				<p>To the maximum extent permitted by law, Rivara Wallet and its contributors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:</p>
				<ul>
					<li>Your use or inability to use the Wallet</li>
					<li>Loss of funds due to lost seed phrases or passwords</li>
					<li>Unauthorized access to your wallet</li>
					<li>Errors in transaction amounts or recipient addresses</li>
					<li>Failures of third-party services (exchanges, RPC providers, etc.)</li>
				</ul>
			</section>

			<section>
				<h2>6. Third-Party Services</h2>
				<p>The Wallet integrates with third-party services including ChangeNow (for exchanges), CoinGecko (for prices), and various blockchain RPC providers. These services have their own terms and we are not responsible for their operation or availability.</p>
			</section>

			<section>
				<h2>7. Open Source</h2>
				<p>Rivara Wallet is open-source software available on <a href="https://github.com/dominic84p/Rivara-Wallet" target="_blank" rel="noopener" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">GitHub</a>. You are free to review, fork, and modify the code subject to its license.</p>
			</section>

			<section>
				<h2>8. Changes to Terms</h2>
				<p>We may update these terms from time to time. Continued use of the Wallet after changes constitutes acceptance of the new terms.</p>
			</section>

			<section>
				<h2>9. Contact</h2>
				<p>Questions about these terms? Open an issue on our <a href="https://github.com/dominic84p/Rivara-Wallet/issues" target="_blank" rel="noopener" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">GitHub repository</a>.</p>
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
