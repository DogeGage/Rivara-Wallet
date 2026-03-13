<script lang="ts">
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Newspaper, BookOpen, HelpCircle, Info, ArrowRight, ShieldCheck, Zap, Lock, RefreshCw, HardDrive, Network, XCircle } from 'lucide-svelte';

	const features = [
		{ icon: Lock, title: 'Non-Custodial Architecture', desc: 'Your keys, your crypto. We never have access to your funds. Everything is stored locally on your device with military-grade AES-256 encryption.' },
		{ icon: Zap, title: 'Engineered for Reliability', desc: 'Every feature is rigorously tested. No "coming soon" promises. Experience flawless transactions and real-time balance synchronization.' },
		{ icon: RefreshCw, title: 'Native Asset Exchange', desc: 'Swap cryptocurrencies seamlessly without leaving the wallet environment. Powered by ChangeNow with completely transparent routing.' },
		{ icon: ShieldCheck, title: 'Absolute Privacy', desc: 'No analytics. No telemetry. No data harvesting. We operate with a strict zero-knowledge policy regarding our users.' },
		{ icon: HardDrive, title: 'Streamlined Backups', desc: 'Secure your assets with our encrypted single-file backup system. A modern, password-protected alternative to manual seed phrases.' },
		{ icon: Network, title: 'BIP39 Standardization', desc: 'Built on open standards. Your recovery phrase is fully compliant and compatible with any industry-standard BIP39 wallet.' }
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
		{ title: 'No Custodial Control', desc: 'We cannot freeze your funds, seize your assets, or restrict your access. You maintain ultimate sovereignty.' },
		{ title: 'No User Tracking', desc: 'Zero analytics, zero telemetry, and zero data collection. Your financial privacy is guaranteed.' },
		{ title: 'No Ecosystem Lock-in', desc: 'We strictly use standard BIP39 formats. Your wallet and funds can be migrated at any time.' },
		{ title: 'No Bloatware', desc: 'We focus exclusively on 8 major networks to ensure 100% operational reliability, favoring quality over quantity.' }
	];
</script>

<div class="min-h-screen bg-[#070b10] font-sans text-white selection:bg-cyan-500/30 selection:text-cyan-100">
	
	<!-- Background -->
	<div class="fixed inset-0 -z-10">
		<div class="absolute inset-0 [background:radial-gradient(ellipse_at_top,rgba(8,145,178,0.18)_0%,#070b10_60%)]"></div>
	</div>

	<div class="bg-[#070b10] border-b border-white/5">
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
	</div>

	<section class="py-24 px-8 border-b border-white/5">
	<br> <br> <!-- Too lazy to add proper padding, Oh well it works -->
		<div class="max-w-4xl mx-auto text-center">
			<h1 class="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
				The standard in <span class="text-cyan-400">non-custodial</span> security.
			</h1>
			<p class="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
				Rivara is enterprise-grade wallet infrastructure built for reliability. We support 8 major networks with uncompromising performance, flawless execution, and zero tracking.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-white/10 pt-10">
				<div>
					<div class="text-3xl font-bold text-white mb-1">8</div>
					<div class="text-sm text-slate-500 font-medium uppercase tracking-wide">Core Networks</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-white mb-1">100%</div>
					<div class="text-sm text-slate-500 font-medium uppercase tracking-wide">Feature Uptime</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-white mb-1">AES-256</div>
					<div class="text-sm text-slate-500 font-medium uppercase tracking-wide">Local Encryption</div>
				</div>
			</div>
		</div>
	</section>

	<section class="py-24 px-8">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-white mb-4">Engineered for Excellence</h2>
				<p class="text-lg text-slate-400 max-w-2xl mx-auto">
					We bypass the industry standard of bloated software and broken features to deliver a refined, fully-functional financial tool.
				</p>
			</div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each features as feature}
					<div class="p-8 bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl rounded-2xl hover:border-cyan-500/30 transition-all duration-300">
						<div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
							<svelte:component this={feature.icon} size={24} strokeWidth={2} />
						</div>
						<h3 class="text-xl font-bold text-white mb-3">{feature.title}</h3>
						<p class="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="py-24 px-8 border-y border-white/5">
		<div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
			<div class="md:w-1/2">
				<h2 class="text-3xl font-bold text-white mb-6">Supported Infrastructure</h2>
				<p class="text-lg text-slate-400 leading-relaxed mb-6">
					We intentionally limit our network integrations to ensure every protocol operates flawlessly. From real-time UTXO broadcasting to EVM smart contract execution, our supported chains are integrated at the highest standard.
				</p>
			</div>
			<div class="md:w-1/2 grid grid-cols-2 gap-4 w-full">
				{#each cryptos as crypto}
					<div class="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
						<div class="font-bold text-white w-12">{crypto.symbol}</div>
						<div class="text-slate-400">{crypto.name}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="py-24 px-8">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-white mb-4">Leadership & Engineering</h2>
				<p class="text-lg text-slate-400 max-w-2xl mx-auto">
					Built by a dedicated team of developers focused on security, stability, and seamless user experience.
				</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-12">
				<div class="flex flex-col items-center text-center">
					<div class="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
						<img src="/assets/image/Dominic84p.png" alt="Dominic84p" class="w-full h-full object-cover" />
					</div>
					<h3 class="text-xl font-bold text-white">Dominic84p</h3>
					<div class="text-cyan-400 font-semibold text-sm">Lead Developer</div>
				</div>

				<div class="flex flex-col items-center text-center">
					<div class="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
						<img src="/assets/image/ponder.png" alt="Ponder" class="w-full h-full object-cover" />
					</div>
					<h3 class="text-xl font-bold text-white">Ponder</h3>
					<div class="text-cyan-400 font-semibold text-sm">Head of security</div>
				</div>

				<div class="flex flex-col items-center text-center">
					<div class="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
						<img src="/assets/image/suki.png" alt="Suki" class="w-full h-full object-cover" />
					</div>
					<h3 class="text-xl font-bold text-white">Suki</h3>
					<div class="text-cyan-400 font-semibold text-sm">Head of Design</div>
				</div>
			</div>
		</div>
	</section>

	<section class="py-24 px-8 border-y border-white/5">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-3xl font-bold text-white mb-10 text-center">Our Strict Commitments</h2>
			
			<div class="grid gap-6">
				{#each notItems as item}
					<div class="flex items-start gap-4 p-6 bg-white/5 rounded-xl border border-white/10 hover:border-red-500/30 transition-colors">
						<div class="flex-shrink-0 text-red-400 mt-1">
							<XCircle size={24} strokeWidth={2.5} />
						</div>
						<div>
							<h4 class="text-lg font-bold text-white mb-1">{item.title}</h4>
							<p class="text-slate-400">{item.desc}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>