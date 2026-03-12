<script lang="ts">
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Newspaper, BookOpen, HelpCircle, Info, ChevronRight } from 'lucide-svelte';

	let activeSection = 'create-wallet';

	const sections = [
		{ id: 'getting-started', title: 'Getting Started', items: [
			{ id: 'create-wallet', title: 'Creating a Wallet' },
			{ id: 'import-wallet', title: 'Importing a Wallet' },
			{ id: 'backup', title: 'Backup & Recovery' }
		]},
		{ id: 'using', title: 'Using Rivara', items: [
			{ id: 'send', title: 'Sending Crypto' },
			{ id: 'receive', title: 'Receiving Crypto' },
			{ id: 'exchange', title: 'Exchanging Crypto' },
			{ id: 'portfolio', title: 'Portfolio Tracking' }
		]},
		{ id: 'security', title: 'Security', items: [
			{ id: 'seed-phrase', title: 'Seed Phrase Security' },
			{ id: 'tuffbackup', title: 'Tuffbackup System' },
			{ id: 'auto-lock', title: 'Auto-Lock Feature' }
		]},
		{ id: 'technical', title: 'Technical', items: [
			{ id: 'supported-coins', title: 'Supported Cryptocurrencies' },
			{ id: 'standards', title: 'Standards & Compatibility' },
			{ id: 'privacy', title: 'Privacy & Data' }
		]}
	];

	function scrollToSection(id: string) {
		activeSection = id;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
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
					<BookOpen size={18} class="mr-2 text-cyan-400" />
					<span class="text-cyan-400 font-semibold">Docs</span>
				</Button>
				<Button variant="ghost" on:click={() => goto('/support')}>
					<HelpCircle size={18} class="mr-2" />
					Support
				</Button>
				<Button variant="ghost" on:click={() => goto('/about')}>
					<Info size={18} class="mr-2" />
					About
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
		<div class="max-w-6xl mx-auto text-center">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
				<BookOpen size={20} class="text-cyan-400" />
				<span class="text-cyan-400 font-semibold text-sm">Documentation</span>
			</div>
			<h1 class="text-6xl font-bold mb-6">
				<span class="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">Documentation</span>
			</h1>
			<p class="text-xl text-slate-400">Everything you need to know about using Rivara Wallet</p>
		</div>
	</section>

	<!-- Main Content -->
	<section class="pb-32 px-8">
		<div class="max-w-7xl mx-auto flex gap-8">
			<!-- Sidebar -->
			<aside class="w-64 flex-shrink-0 sticky top-24 h-fit hidden lg:block">
				<Card variant="elevated">
					<div class="p-4">
						{#each sections as section}
							<div class="mb-6 last:mb-0">
								<h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{section.title}</h3>
								<div class="space-y-1">
									{#each section.items as item}
										<button
											class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all {activeSection === item.id ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
											on:click={() => scrollToSection(item.id)}
										>
											{item.title}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</aside>

			<!-- Content -->
			<main class="flex-1 space-y-8">
				<!-- Create Wallet -->
				<div id="create-wallet">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Creating a Wallet</h2>
							<p class="text-slate-300 mb-6">Creating a new wallet generates a unique 12-word seed phrase that controls your crypto.</p>
							
							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">1</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Click "Create Wallet"</h4>
										<p class="text-sm text-slate-400">From the landing page, click the "Create Wallet" button.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">2</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Write Down Your Seed Phrase</h4>
										<p class="text-sm text-slate-400">You'll see 12 words. Write them down on paper in order. Never store them digitally or take a screenshot.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">3</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Set a Password</h4>
										<p class="text-sm text-slate-400">Create a strong password to encrypt your wallet. This password is only for this device.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">4</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Done!</h4>
										<p class="text-sm text-slate-400">Your wallet is created and ready to use. Keep your seed phrase safe!</p>
									</div>
								</div>
							</div>
							
							<div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
								<p class="text-yellow-200 text-sm"><strong>⚠️ Important:</strong> Your seed phrase is the ONLY way to recover your wallet. If you lose it, your crypto is gone forever.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Import Wallet -->
				<div id="import-wallet">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Importing a Wallet</h2>
							<p class="text-slate-300 mb-6">Import an existing wallet using your 12-word seed phrase.</p>
							
							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">1</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Click "Import Wallet"</h4>
										<p class="text-sm text-slate-400">From the landing page, click "Import Wallet".</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">2</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Enter Your Seed Phrase</h4>
										<p class="text-sm text-slate-400">Type or paste your 12-word seed phrase. Make sure the words are in the correct order.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">3</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Set a Password</h4>
										<p class="text-sm text-slate-400">Create a password to encrypt your wallet on this device.</p>
									</div>
								</div>
							</div>
							
							<div class="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
								<p class="text-cyan-200 text-sm"><strong>💡 Tip:</strong> Rivara uses standard BIP39 seed phrases. You can import wallets from other BIP39-compatible wallets.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Backup -->
				<div id="backup">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Backup & Recovery</h2>
							<p class="text-slate-300 mb-4">Rivara offers two backup methods: seed phrase and Tuffbackup.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2 mt-4">Seed Phrase Backup</h3>
							<p class="text-sm text-slate-400 mb-4">Your 12-word seed phrase is the master backup. Write it down and store it securely offline.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2">Tuffbackup System</h3>
							<p class="text-sm text-slate-400 mb-3">Tuffbackup creates an encrypted file containing your wallet. It's protected by your password.</p>
							
							<div class="grid md:grid-cols-2 gap-3">
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-2 text-sm">Create Tuffbackup</h4>
									<ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
										<li>Go to Settings</li>
										<li>Click "Download Tuffbackup"</li>
										<li>Save the <code class="text-cyan-300">tuffbackup.rivara</code> file</li>
									</ol>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-2 text-sm">Restore from Tuffbackup</h4>
									<ol class="text-xs text-slate-400 space-y-1 list-decimal list-inside">
										<li>Click "Import Wallet"</li>
										<li>Select "Import from Tuffbackup"</li>
										<li>Upload your file</li>
										<li>Enter your password</li>
									</ol>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<!-- Send -->
				<div id="send">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Sending Crypto</h2>
							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">1</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Select Cryptocurrency</h4>
										<p class="text-sm text-slate-400">Click on the crypto you want to send from your wallet.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">2</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Click "Send"</h4>
										<p class="text-sm text-slate-400">Enter the recipient's address and amount.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">3</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Review & Confirm</h4>
										<p class="text-sm text-slate-400">Double-check the address and amount. Crypto transactions cannot be reversed!</p>
									</div>
								</div>
							</div>
							<div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
								<p class="text-red-200 text-sm"><strong>⚠️ Warning:</strong> Always verify the recipient address. Sending to the wrong address means your crypto is lost forever.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Receive -->
				<div id="receive">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Receiving Crypto</h2>
							<p class="text-slate-300 mb-4">To receive crypto, share your wallet address with the sender.</p>
							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">1</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Select Cryptocurrency</h4>
										<p class="text-sm text-slate-400">Click on the crypto you want to receive.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">2</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Click "Receive"</h4>
										<p class="text-sm text-slate-400">Your wallet address and QR code will be displayed.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">3</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Share Your Address</h4>
										<p class="text-sm text-slate-400">Copy the address or let the sender scan your QR code.</p>
									</div>
								</div>
							</div>
							<div class="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
								<p class="text-cyan-200 text-sm"><strong>💡 Tip:</strong> Each cryptocurrency has its own address. Make sure you're sharing the correct address for the crypto you want to receive.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Exchange -->
				<div id="exchange">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Exchanging Crypto</h2>
							<p class="text-slate-300 mb-4">Rivara has a built-in exchange powered by ChangeNow. Swap crypto without leaving the wallet.</p>
							<div class="space-y-4">
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">1</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Go to Exchange</h4>
										<p class="text-sm text-slate-400">Click "Exchange" in the navigation.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">2</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Select Currencies</h4>
										<p class="text-sm text-slate-400">Choose what you're sending and what you want to receive.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">3</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Enter Amount</h4>
										<p class="text-sm text-slate-400">Type the amount you want to exchange. You'll see the estimated amount you'll receive.</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm">4</div>
									<div>
										<h4 class="text-base font-semibold text-white mb-1">Confirm Exchange</h4>
										<p class="text-sm text-slate-400">Review the details and confirm. The exchange will process automatically.</p>
									</div>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<!-- Portfolio -->
				<div id="portfolio">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Portfolio Tracking</h2>
							<p class="text-slate-300 mb-4">The Portfolio page shows your total balance across all cryptocurrencies with charts and history.</p>
							<ul class="space-y-2">
								<li class="flex items-start gap-2">
									<ChevronRight size={18} class="text-cyan-400 flex-shrink-0 mt-0.5" />
									<div class="text-sm"><strong class="text-white">Total Balance:</strong> <span class="text-slate-400">See your combined USD value</span></div>
								</li>
								<li class="flex items-start gap-2">
									<ChevronRight size={18} class="text-cyan-400 flex-shrink-0 mt-0.5" />
									<div class="text-sm"><strong class="text-white">Asset Breakdown:</strong> <span class="text-slate-400">View percentage allocation</span></div>
								</li>
								<li class="flex items-start gap-2">
									<ChevronRight size={18} class="text-cyan-400 flex-shrink-0 mt-0.5" />
									<div class="text-sm"><strong class="text-white">Price Charts:</strong> <span class="text-slate-400">Track price movements</span></div>
								</li>
								<li class="flex items-start gap-2">
									<ChevronRight size={18} class="text-cyan-400 flex-shrink-0 mt-0.5" />
									<div class="text-sm"><strong class="text-white">Transaction History:</strong> <span class="text-slate-400">See all your transactions</span></div>
								</li>
							</ul>
						</div>
					</Card>
				</div>

				<!-- Seed Phrase Security -->
				<div id="seed-phrase">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Seed Phrase Security</h2>
							<p class="text-slate-300 mb-4">Your seed phrase is the most important thing to protect. Here's how to keep it safe:</p>
							
							<div class="grid md:grid-cols-2 gap-4">
								<div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
									<h4 class="text-base font-semibold text-green-400 mb-3">✅ DO</h4>
									<ul class="space-y-1.5 text-sm text-slate-300">
										<li>• Write it down on paper</li>
										<li>• Store it in a safe place</li>
										<li>• Keep multiple copies in different locations</li>
										<li>• Use a fireproof/waterproof safe</li>
									</ul>
								</div>
								<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
									<h4 class="text-base font-semibold text-red-400 mb-3">❌ DON'T</h4>
									<ul class="space-y-1.5 text-sm text-slate-300">
										<li>• Take a screenshot</li>
										<li>• Store it in cloud storage</li>
										<li>• Email it to yourself</li>
										<li>• Share it with anyone</li>
										<li>• Type it on any website</li>
									</ul>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<!-- Tuffbackup -->
				<div id="tuffbackup">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Tuffbackup System</h2>
							<p class="text-slate-300 mb-4">Tuffbackup is Rivara's encrypted backup system. It's a single file that contains your entire wallet.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2">How It Works</h3>
							<ul class="space-y-1.5 text-sm text-slate-400 mb-4">
								<li>• Your wallet is encrypted with your password</li>
								<li>• The encrypted data is saved to a <code class="text-cyan-300">tuffbackup.rivara</code> file</li>
								<li>• You can restore your wallet by uploading this file and entering your password</li>
							</ul>
							
							<div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
								<p class="text-cyan-200 text-sm"><strong>💡 Tip:</strong> Store your Tuffbackup file on a USB drive or external hard drive. Don't rely on it as your only backup - always keep your seed phrase written down too.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Auto-Lock -->
				<div id="auto-lock">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Auto-Lock Feature</h2>
							<p class="text-slate-300 mb-4">Rivara automatically locks your wallet after a period of inactivity to protect your crypto.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2">Settings</h3>
							<ul class="space-y-1.5 text-sm text-slate-400 mb-3">
								<li>• Default: 5 minutes of inactivity</li>
								<li>• Customizable in Settings</li>
								<li>• Can be disabled (not recommended)</li>
							</ul>
							
							<p class="text-sm text-slate-400">When locked, you'll need to enter your password to unlock the wallet again.</p>
						</div>
					</Card>
				</div>

				<!-- Supported Coins -->
				<div id="supported-coins">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Supported Cryptocurrencies</h2>
							<p class="text-slate-300 mb-4">Rivara supports 8 major cryptocurrencies:</p>
							
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Bitcoin (BTC)</h4>
									<p class="text-xs text-slate-400">The original cryptocurrency</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Ethereum (ETH)</h4>
									<p class="text-xs text-slate-400">Smart contract platform</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Dogecoin (DOGE)</h4>
									<p class="text-xs text-slate-400">The people's crypto</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Litecoin (LTC)</h4>
									<p class="text-xs text-slate-400">Silver to Bitcoin's gold</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Solana (SOL)</h4>
									<p class="text-xs text-slate-400">High-speed blockchain</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Tron (TRX)</h4>
									<p class="text-xs text-slate-400">Decentralized entertainment</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">Tezos (XTZ)</h4>
									<p class="text-xs text-slate-400">Self-amending blockchain</p>
								</div>
								<div class="p-3 bg-white/5 rounded-lg border border-white/10">
									<h4 class="font-semibold text-white mb-0.5 text-sm">DGAGE</h4>
									<p class="text-xs text-slate-400">Rivara native token</p>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<!-- Standards -->
				<div id="standards">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Standards & Compatibility</h2>
							<p class="text-slate-300 mb-4">Rivara uses industry-standard protocols for maximum compatibility.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2">BIP39 Seed Phrases</h3>
							<p class="text-sm text-slate-400 mb-2">Rivara uses BIP39 standard for seed phrase generation. This means:</p>
							<ul class="space-y-1.5 text-sm text-slate-400 mb-4">
								<li>• Your seed phrase works with other BIP39 wallets</li>
								<li>• You can import wallets from other BIP39-compatible wallets</li>
								<li>• Standard 12-word phrases (not proprietary formats)</li>
							</ul>
							
							<h3 class="text-lg font-semibold text-white mb-2">Derivation Paths</h3>
							<p class="text-sm text-slate-400 mb-2">Rivara uses standard derivation paths for each cryptocurrency:</p>
							<ul class="space-y-1.5 text-xs text-slate-400 font-mono">
								<li>• Bitcoin: m/44'/0'/0'/0/0</li>
								<li>• Ethereum: m/44'/60'/0'/0/0</li>
								<li>• Dogecoin: m/44'/3'/0'/0/0</li>
								<li>• And more...</li>
							</ul>
						</div>
					</Card>
				</div>

				<!-- Privacy -->
				<div id="privacy">
					<Card variant="elevated">
						<div class="p-6 md:p-8">
							<h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Privacy & Data</h2>
							<p class="text-slate-300 mb-4">Rivara is built with privacy in mind.</p>
							
							<h3 class="text-lg font-semibold text-white mb-2">What We DON'T Collect</h3>
							<ul class="space-y-1.5 text-sm text-slate-400 mb-4">
								<li>❌ No analytics or tracking</li>
								<li>❌ No user accounts or emails</li>
								<li>❌ No IP address logging</li>
								<li>❌ No transaction monitoring</li>
								<li>❌ No personal information</li>
							</ul>
							
							<h3 class="text-lg font-semibold text-white mb-2">What's Stored Locally</h3>
							<ul class="space-y-1.5 text-sm text-slate-400 mb-4">
								<li>✅ Encrypted wallet (in browser storage)</li>
								<li>✅ User preferences (auto-lock settings, etc.)</li>
							</ul>
							
							<div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
								<p class="text-cyan-200 text-sm"><strong>💡 Note:</strong> All wallet data is stored locally in your browser. Rivara servers never see your seed phrase, private keys, or passwords.</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Help CTA -->
				<Card variant="elevated">
					<div class="p-8 md:p-12 text-center bg-gradient-to-br from-cyan-900/20 to-cyan-900/20">
						<h2 class="text-2xl md:text-3xl font-bold mb-3">Need More Help?</h2>
						<p class="text-slate-400 mb-6">Can't find what you're looking for? We're here to help!</p>
						<div class="flex gap-3 justify-center flex-wrap">
							<Button color="primary" size="lg" on:click={() => goto('/support')}>
								Visit Support
							</Button>
							<Button variant="flat" size="lg" on:click={() => goto('/create')}>
								Create Wallet
							</Button>
						</div>
					</div>
				</Card>
			</main>
		</div>
	</section>
</div>
