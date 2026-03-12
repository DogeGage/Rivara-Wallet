<script lang="ts">
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Newspaper, BookOpen, HelpCircle, Info, ArrowRight } from 'lucide-svelte';

	const features = [
		{ icon: '🔒', title: 'Non-Custodial', desc: 'Your keys, your crypto. We never have access to your funds. Everything is stored locally on your device with AES-256 encryption.' },
		{ icon: '✅', title: 'Actually Works', desc: 'Every feature is tested and functional. No "coming soon" promises. No broken transactions. No missing balances.' },
		{ icon: '🔄', title: 'Built-In Exchange', desc: 'Swap crypto without leaving the wallet. Powered by ChangeNow. No hidden fees.' },
		{ icon: '🚫', title: 'Zero Tracking', desc: 'No analytics. No telemetry. No data collection. We don\'t know who you are or what you do.' },
		{ icon: '💾', title: 'Tuffbackup System', desc: 'Encrypted wallet backups in a single file. Easier than typing seed phrases. Protected with your password.' },
		{ icon: '🎯', title: 'Standard BIP39', desc: 'No proprietary formats. Your seed phrase works with any BIP39 wallet. No lock-in.' }
	];

	const cryptos = [
		{ name: 'Bitcoin', symbol: 'BTC' },
		{ name: 'Ethereum', symbol: 'ETH' },
		{ name: 'Solana', symbol: 'SOL' },
		{ name: 'Dogecoin', symbol: 'DOGE' },
		{ name: 'Litecoin', symbol: 'LTC' },
		{ name: 'Tezos', symbol: 'XTZ' },
		{ name: 'Tron', symbol: 'TRX' },
		{ name: 'Polygon', symbol: 'POL' }
	];

	const notItems = [
		{ title: 'Not a custodial service', desc: 'We can\'t freeze your funds, seize your crypto, or lock you out. You\'re in control.' },
		{ title: 'Not tracking you', desc: 'No analytics, no telemetry, no data collection. Your privacy is absolute.' },
		{ title: 'Not using proprietary formats', desc: 'Standard BIP39 seed phrases. Your wallet works anywhere.' },
		{ title: 'Not promising 40+ coins', desc: 'We support 8 cryptos with 100% working features. Quality over quantity.' }
	];
</script>

<div class="min-h-screen bg-[#070b10]">
	<!-- Background -->
	<div class="fixed inset-0 -z-10">
		<div class="absolute inset-0 [background:radial-gradient(ellipse_at_top,rgba(8,145,178,0.18)_0%,#070b10_60%)]"></div>
	</div>

	<!-- Navigation -->
	<Navbar>
		<div class="flex justify-between items-center">
			<button class="flex items-center gap-2" on:click={() => goto('/')}>
				<span class="text-3xl">⬢</span>
				<span class="text-xl font-semibold text-white">Rivara Wallet</span>
			</button>
			
			<div class="flex gap-8 items-center">
				<Button variant="ghost" on:click={() => goto('/news')}>
					<Newspaper size={18} class="mr-2" />
					News
				</Button>
				<Button variant="ghost" on:click={() => goto('/docs')}>
					<BookOpen size={18} class="mr-2" />
					Docs
				</Button>
				<Button variant="ghost" on:click={() => goto('/support')}>
					<HelpCircle size={18} class="mr-2" />
					Support
				</Button>
				<Button variant="ghost" on:click={() => goto('/about')}>
					<Info size={18} class="mr-2 text-cyan-400" />
					<span class="text-cyan-400 font-semibold">About</span>
				</Button>
			</div>
			
			<div class="flex gap-3">
				<Button variant="bordered" color="primary" on:click={() => goto('/import')}>
					Import Wallet
				</Button>
				<Button color="primary" on:click={() => goto('/create')}>
					Create Wallet
				</Button>
			</div>
		</div>
	</Navbar>

	<!-- Hero -->
	<section class="pt-32 pb-16 px-8">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<h1 class="text-6xl font-bold mb-6">
					<span class="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">About Us</span>
				</h1>
				<p class="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
					Rivara Wallet is a non-custodial cryptocurrency wallet that actually works. We support 8 major cryptocurrencies with 100% functional features including BTC, ETH, SOL, DOGE, LTC, XTZ, TRX, and POL.
				</p>
			</div>

			<div class="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
				<div class="text-center">
					<div class="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-2">8</div>
					<div class="text-sm text-slate-500 uppercase tracking-wider">Cryptocurrencies<br/>Supported</div>
				</div>
				<div class="text-center">
					<div class="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-2">100%</div>
					<div class="text-sm text-slate-500 uppercase tracking-wider">Features<br/>Working</div>
				</div>
				<div class="text-center">
					<div class="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-2">24/7</div>
					<div class="text-sm text-slate-500 uppercase tracking-wider">Community<br/>Support</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Mission -->
	<section class="pb-16 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-8">
					<h2 class="text-3xl font-bold text-white mb-6">Our Mission</h2>
					<div class="space-y-4 text-slate-300 leading-relaxed">
						<p>We built Rivara because we were tired of crypto wallets that promise everything and deliver nothing. You know the type - they claim to support 40+ cryptocurrencies, but half the features don't work. Transactions fail. Balances don't update. The UI is confusing. And good luck getting support.</p>
						<p>Rivara is different. We support 8 cryptocurrencies, and every single feature works. Send, receive, exchange, backup - all tested, all functional. We'd rather do 8 cryptos perfectly than 40 poorly.</p>
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- Why Rivara -->
	<section class="pb-16 px-8">
		<div class="max-w-6xl mx-auto">
			<h2 class="text-3xl font-bold text-white mb-8 text-center">Why Rivara?</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each features as feature}
					<Card variant="elevated" hoverable>
						<div class="p-6">
							<div class="text-4xl mb-4">{feature.icon}</div>
							<h3 class="text-xl font-semibold text-white mb-3">{feature.title}</h3>
							<p class="text-slate-400 leading-relaxed">{feature.desc}</p>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Supported Cryptos -->
	<section class="pb-16 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-8">
					<h2 class="text-3xl font-bold text-white mb-6">Supported Cryptocurrencies</h2>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						{#each cryptos as crypto}
							<div class="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
								<div class="font-semibold text-white">{crypto.name}</div>
								<div class="text-sm text-slate-400">{crypto.symbol}</div>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- Our Team -->
	<section class="pb-16 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-8">
					<h2 class="text-3xl font-bold text-white mb-6">Our Team</h2>
					<div class="space-y-4 text-slate-300 leading-relaxed">
						<p>Rivara is built by a small group of developers who got fed up with crypto wallets that don't work. We're not some big corporate team - just people who wanted a wallet that actually does what it says.</p>
						<p>We've been in crypto for a while, learned from our mistakes, and decided to build something simple that works. No fancy offices, no venture capital, no bullshit. Just a wallet that sends, receives, and swaps crypto without breaking.</p>
						<p>We're learning as we go, fixing bugs as they come up, and trying to make something useful. That's it.</p>
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- What We're Not -->
	<section class="pb-16 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-8">
					<h2 class="text-3xl font-bold text-white mb-6">What We're Not</h2>
					<div class="space-y-4">
						{#each notItems as item}
							<div class="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
								<div class="text-2xl flex-shrink-0">❌</div>
								<div>
									<h4 class="font-semibold text-white mb-1">{item.title}</h4>
									<p class="text-slate-400 text-sm">{item.desc}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		</div>
	</section>

	<!-- CTA -->
	<section class="pb-32 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-12 text-center bg-gradient-to-br from-cyan-900/20 to-cyan-900/20">
					<h2 class="text-3xl font-bold mb-4">Ready to try a wallet that actually works?</h2>
					<p class="text-slate-400 mb-8">Join thousands of users who switched from broken wallets to Rivara</p>
					<div class="flex gap-4 justify-center">
						<Button color="primary" size="lg" on:click={() => goto('/create')}>
							Create Wallet
							<ArrowRight size={18} class="ml-2" />
						</Button>
						<Button variant="flat" size="lg" on:click={() => goto('/import')}>
							Import Wallet
						</Button>
					</div>
				</div>
			</Card>
		</div>
	</section>
</div>
