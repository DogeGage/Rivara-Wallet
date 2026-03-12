<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { 
		Newspaper, 
		BookOpen, 
		HelpCircle, 
		Info, 
		CheckCircle, 
		Lock, 
		Zap, 
		Target, 
		Database, 
		ShieldOff,
		Github,
		FileText,
		Shield,
		Menu,
		X
	} from 'lucide-svelte';
	import { browser } from '$app/environment';

	let mobileMenuOpen = false;

	let hasWallet = browser ? localStorage.getItem('isWalletAlive') === 'true' : false;
	let isUnlocked = browser ? sessionStorage.getItem('walletUnlocked') === 'true' : false;

	afterNavigate(() => {
		hasWallet = localStorage.getItem('isWalletAlive') === 'true';
		isUnlocked = sessionStorage.getItem('walletUnlocked') === 'true';
	});
	
	const features = [
		{ icon: CheckCircle, title: 'Actually Works', desc: 'Every feature tested. No "coming soon" BS. Send, receive, exchange - all functional.' },
		{ icon: Lock, title: 'Your Keys, Your Crypto', desc: 'Standard BIP39 seed phrases. Works with any wallet. No proprietary lock-in.' },
		{ icon: Zap, title: 'Built-In Exchange', desc: 'Swap crypto without leaving the wallet. Powered by ChangeNow.' },
		{ icon: Target, title: 'Clean & Simple', desc: 'No bloat. No confusing menus. Just your crypto and what you need.' },
		{ icon: Database, title: 'Tuffbackup System', desc: 'Encrypted wallet backups. One file, all your crypto. Actually secure.' },
		{ icon: ShieldOff, title: 'No Telemetry', desc: 'Zero tracking. Zero analytics. Zero data collection. Period.' }
	];
</script>

<div class="landing-page">
	<!-- Background -->
	<div class="fixed inset-0 -z-10" style="clip-path: inset(0)">
		<div class="absolute inset-0" style="background: radial-gradient(ellipse at top, rgba(8,145,178,0.18) 0%, #070b10 60%)"></div>
		<div class="shape shape-1"></div>
		<div class="shape shape-2"></div>
		<div class="shape shape-3"></div>
	</div>

	<!-- Navigation -->
	<nav class="fixed top-0 left-0 right-0 z-50 bg-stone-900/90 backdrop-blur-lg border-b border-white/10">
		<div class="max-w-7xl mx-auto px-4 md:px-8 py-4">
			<div class="flex justify-between items-center">
				<div class="flex items-center gap-2">
					<span class="text-3xl">⬢</span>
					<span class="text-xl font-semibold text-white">Rivara Wallet</span>
					<span class="px-2 py-0.5 bg-cyan-600 text-white text-xs font-bold rounded ml-1">BETA</span>
				</div>
				
				<div class="hidden md:flex gap-6 items-center">
					<button class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition" on:click={() => goto('/news')}>
						<Newspaper size={18} />
						News
					</button>
					<button class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition" on:click={() => goto('/docs')}>
						<BookOpen size={18} />
						Docs
					</button>
					<button class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition" on:click={() => goto('/support')}>
						<HelpCircle size={18} />
						Support
					</button>
					<button class="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition" on:click={() => goto('/about')}>
						<Info size={18} />
						About
					</button>
				</div>
				
				<div class="hidden md:flex gap-3">
					{#if isUnlocked}
						<button class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/wallet')}>
							Open Wallet
						</button>
					{:else if hasWallet}
						<button class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/unlock')}>
							Unlock Wallet
						</button>
					{:else}
						<button class="px-6 py-3 border-2 border-cyan-500 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/10 transition" on:click={() => goto('/import')}>
							Import Wallet
						</button>
						<button class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/create')}>
							Create Wallet
						</button>
					{/if}
				</div>

				<!-- Mobile hamburger -->
				<button class="md:hidden p-2 text-white" on:click={() => mobileMenuOpen = !mobileMenuOpen}>
					{#if mobileMenuOpen}
						<X size={24} />
					{:else}
						<Menu size={24} />
					{/if}
				</button>
			</div>

			<!-- Mobile Menu -->
			{#if mobileMenuOpen}
				<div class="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 flex flex-col gap-2">
					<button class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition" on:click={() => { goto('/news'); mobileMenuOpen = false; }}>
						<Newspaper size={18} />
						News
					</button>
					<button class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition" on:click={() => { goto('/docs'); mobileMenuOpen = false; }}>
						<BookOpen size={18} />
						Docs
					</button>
					<button class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition" on:click={() => { goto('/support'); mobileMenuOpen = false; }}>
						<HelpCircle size={18} />
						Support
					</button>
					<button class="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition" on:click={() => { goto('/about'); mobileMenuOpen = false; }}>
						<Info size={18} />
						About
					</button>
					<div class="border-t border-white/10 mt-2 pt-4 flex flex-col gap-2">
						{#if isUnlocked}
							<button class="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => { goto('/wallet'); mobileMenuOpen = false; }}>
								Open Wallet
							</button>
						{:else if hasWallet}
							<button class="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => { goto('/unlock'); mobileMenuOpen = false; }}>
								Unlock Wallet
							</button>
						{:else}
							<button class="w-full px-6 py-3 border-2 border-cyan-500 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/10 transition" on:click={() => { goto('/import'); mobileMenuOpen = false; }}>
								Import Wallet
							</button>
							<button class="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => { goto('/create'); mobileMenuOpen = false; }}>
								Create Wallet
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="pt-36 pb-20 px-4 md:px-8">
		<div class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
			<div class="text-left">
				<h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6">
					A Wallet That <span class="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">Actually Works</span>
				</h1>
				<p class="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed">
					Tired of bloated wallets with broken features? Rivara does 8 cryptos really well instead of 40 poorly.
				</p>
				
				<div class="flex flex-col sm:flex-row gap-4 mb-12">
					{#if isUnlocked}
						<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/wallet')}>
							Open Wallet →
						</button>
					{:else if hasWallet}
						<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/unlock')}>
							Unlock Wallet →
						</button>
					{:else}
						<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/create')}>
							Create Wallet →
						</button>
						<button class="px-8 py-4 text-lg bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition" on:click={() => goto('/import')}>
							Import Existing
						</button>
					{/if}
				</div>
				
				<div class="flex gap-8 md:gap-12">
					<div class="text-center">
						<div class="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-1">8</div>
						<div class="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Cryptocurrencies</div>
					</div>
					<div class="text-center">
						<div class="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-1">100%</div>
						<div class="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Features Working</div>
					</div>
					<div class="text-center">
						<div class="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent mb-1">0</div>
						<div class="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Tracking/Ads</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-center">
				<div class="relative w-full max-w-2xl">
					<img src="/assets/image/gui.png" alt="Rivara Wallet Interface" class="w-full rounded-3xl shadow-2xl border border-white/10" />
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="py-20 px-4 md:px-8">
		<div class="max-w-6xl mx-auto">
			<h2 class="text-3xl md:text-5xl font-bold text-center mb-16">Why Rivara?</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each features as feature}
					<div class="p-8 rounded-2xl bg-stone-800/40 backdrop-blur-sm border border-white/10 shadow-lg hover:border-cyan-500/30 hover:-translate-y-1 transition-all cursor-pointer">
						<div class="mb-4 text-cyan-400">
							<svelte:component this={feature.icon} size={48} strokeWidth={1.5} />
						</div>
						<h3 class="text-xl font-semibold mb-3">{feature.title}</h3>
						<p class="text-slate-400 leading-relaxed">{feature.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Comparison -->
	<section class="py-20 px-4 md:px-8">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-3xl md:text-5xl font-bold text-center mb-16">Rivara vs "Other Wallets"</h2>
			<div class="rounded-2xl bg-stone-800/40 backdrop-blur-sm border border-white/10 shadow-lg overflow-x-auto">
				<div class="grid grid-cols-3 gap-4 p-4 md:p-6 bg-cyan-900/20 font-semibold text-xs md:text-sm uppercase tracking-wider min-w-[400px]">
					<div>Feature</div>
					<div>Rivara</div>
					<div>Them</div>
				</div>
				<div class="grid grid-cols-3 gap-4 p-6 border-t border-white/10">
					<div class="text-slate-400">Features that work</div>
					<div>✅ All of them</div>
					<div>❌ Maybe half</div>
				</div>
				<div class="grid grid-cols-3 gap-4 p-6 border-t border-white/10">
					<div class="text-slate-400">Standard seed phrases</div>
					<div>✅ BIP39</div>
					<div>⚠️ Proprietary</div>
				</div>
				<div class="grid grid-cols-3 gap-4 p-6 border-t border-white/10">
					<div class="text-slate-400">Built-in exchange</div>
					<div>✅ Actually works</div>
					<div>❌ Broken/slow</div>
				</div>
				<div class="grid grid-cols-3 gap-4 p-6 border-t border-white/10">
					<div class="text-slate-400">Tracking/Analytics</div>
					<div>✅ None</div>
					<div>❌ Everything</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="py-20 md:py-32 px-4 md:px-8 text-center">
		<h2 class="text-3xl md:text-5xl font-bold mb-6">Ready to switch?</h2>
		<p class="text-lg md:text-xl text-slate-400 mb-12">Join the Rivara community and take control of your crypto</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			{#if isUnlocked}
				<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/wallet')}>
					Open Wallet →
				</button>
			{:else if hasWallet}
				<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/unlock')}>
					Unlock Wallet →
				</button>
			{:else}
				<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/create')}>
					Create Your Wallet →
				</button>
				<button class="px-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={() => goto('/import')}>
					Import Your Wallet →
				</button>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer class="max-w-6xl mx-auto px-4 md:px-8 py-12 border-t border-white/10 text-center">
		<div class="flex justify-center gap-8 mb-4">
			<a href="https://github.com/DogeGage/Rivara-Wallet" target="_blank" class="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2">
				<Github size={18} />
				GitHub
			</a>
			<a href="/terms" class="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2">
				<FileText size={18} />
				Terms
			</a>
			<a href="/privacy" class="text-slate-400 hover:text-cyan-400 transition flex items-center gap-2">
				<Shield size={18} />
				Privacy
			</a>
		</div>
		<p class="text-slate-500 text-sm">© 2024-2026 Rivara Wallet. Source available on <a href="https://github.com/DogeGage/Rivara-Wallet" target="_blank" class="text-cyan-400 hover:underline">GitHub</a>.</p>
	</footer>
</div>

<style>
	.shape {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.2;
		background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
		animation: float 20s infinite ease-in-out;
	}

	.shape-1 {
		width: 400px;
		height: 400px;
		top: -200px;
		left: -200px;
	}

	.shape-2 {
		width: 300px;
		height: 300px;
		top: 50%;
		right: -50px;
		animation-delay: -5s;
	}

	.shape-3 {
		width: 250px;
		height: 250px;
		bottom: -125px;
		left: 30%;
		animation-delay: -10s;
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-50px) rotate(180deg);
		}
	}
</style>
