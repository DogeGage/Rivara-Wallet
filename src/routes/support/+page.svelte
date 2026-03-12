<script lang="ts">
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Newspaper, BookOpen, HelpCircle, Info, MessageCircle, Shield } from 'lucide-svelte';

	const faqs = [
		{ icon: '🔒', title: 'Is Rivara Wallet safe?', content: 'Yes! Rivara is a non-custodial wallet using industry-standard BIP39 seed phrases. Everything is stored locally on your device. We never see or store your private keys. Your seed phrase is encrypted with AES-256 encryption. You have full control of your crypto.' },
		{ icon: '📥', title: 'Can I import my existing wallet?', content: 'Absolutely! Rivara supports standard BIP39 seed phrases (12 or 24 words). If you have a wallet from another provider that uses BIP39, you can import it seamlessly.' },
		{ icon: '💰', title: 'What cryptocurrencies are supported?', content: 'We support 8 cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Dogecoin (DOGE), Litecoin (LTC), Tezos (XTZ), Tron (TRX), Polygon (POL), and Rivara Token (DGAGE).' },
		{ icon: '🔄', title: 'How does the built-in exchange work?', content: 'Our exchange is powered by ChangeNow, a trusted crypto exchange service. You can swap between any supported cryptocurrencies directly from your wallet. We don\'t charge any additional fees beyond ChangeNow\'s standard rates.' },
		{ icon: '💾', title: 'What is Tuffbackup?', content: 'Tuffbackup is our encrypted backup system. It creates a single encrypted file containing your wallet data that you can save and restore later. The backup is protected with your password and can only be decrypted by you.' },
		{ icon: '🚫', title: 'Do you collect any data?', content: 'No. Zero tracking, zero analytics, zero telemetry. We don\'t know who you are, what you do, or how much crypto you have. Your privacy is absolute.' },
		{ icon: '🎯', title: 'What is DGAGE token?', content: 'DGAGE is our native utility token deployed on Polygon. It\'s an ERC-20 token with unlimited minting capability. Early adopters can receive free DGAGE through our airdrop program.' },
		{ icon: '⚠️', title: 'I lost my seed phrase. Can you help?', content: 'Unfortunately, no. If you lose your seed phrase, your funds are permanently lost. This is the nature of decentralized, non-custodial crypto - no one can recover your wallet, not even us. Always keep multiple secure backups of your seed phrase.' },
		{ icon: '✨', title: 'Why only 8 cryptocurrencies?', content: 'Quality over quantity. We\'d rather support 8 cryptos with 100% working features than 40 cryptos with half-broken functionality. Every feature in Rivara is tested and functional.' },
		{ icon: '🔑', title: 'What does non-custodial mean?', content: 'Non-custodial means YOU control your private keys and crypto. We never have access to your funds. Unlike custodial wallets (like exchanges), your crypto can\'t be frozen, seized, or lost if our service goes down. Your keys, your crypto.' }
	];

	const securityTips = [
		{ do: true, text: 'Never share your seed phrase' },
		{ do: true, text: 'Store backups in multiple secure locations' },
		{ do: true, text: 'Use a strong password' },
		{ do: true, text: 'Enable auto-lock' },
		{ do: true, text: 'Verify addresses before sending' },
		{ do: false, text: 'Don\'t store seed phrases digitally' },
		{ do: false, text: 'Don\'t trust unsolicited messages' },
		{ do: false, text: 'Never enter seed phrase on websites' }
	];
</script>

<svelte:head>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			"mainEntity": [
				{
					"@type": "Question",
					"name": "Is Rivara Wallet safe?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Yes! Rivara is a non-custodial wallet using industry-standard BIP39 seed phrases. Everything is stored locally on your device. We never see or store your private keys. Your seed phrase is encrypted with AES-256 encryption."
					}
				},
				{
					"@type": "Question",
					"name": "What cryptocurrencies are supported?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Rivara Wallet supports 8 cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), Dogecoin (DOGE), Litecoin (LTC), Solana (SOL), Tezos (XTZ), Tron (TRX), and Polygon (POL)."
					}
				}
			]
		}
	</script>
</svelte:head>

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
					<HelpCircle size={18} class="mr-2 text-cyan-400" />
					<span class="text-cyan-400 font-semibold">Support</span>
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
				<HelpCircle size={20} class="text-cyan-400" />
				<span class="text-cyan-400 font-semibold text-sm">Support & FAQ</span>
			</div>
			<h1 class="text-6xl font-bold mb-6">
				<span class="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">Support & FAQ</span>
			</h1>
			<p class="text-xl text-slate-400">Get help with Rivara Wallet</p>
		</div>
	</section>

	<!-- FAQs -->
	<section class="pb-16 px-8">
		<div class="max-w-6xl mx-auto">
			<h2 class="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
			<div class="grid md:grid-cols-2 gap-6">
				{#each faqs as faq}
					<Card variant="elevated" hoverable>
						<div class="p-6">
							<div class="text-4xl mb-4">{faq.icon}</div>
							<h3 class="text-xl font-semibold text-white mb-3">{faq.title}</h3>
							<p class="text-slate-400 leading-relaxed">{faq.content}</p>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Community & Security -->
	<section class="pb-32 px-8">
		<div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
			<!-- Community -->
			<Card variant="elevated">
				<div class="p-8">
					<h3 class="text-2xl font-bold text-white mb-4">Need More Help?</h3>
					<p class="text-slate-400 mb-6">Join our community for real-time support and updates</p>
					
					<div class="space-y-4">
						<a href="https://discord.gg/8fVs2rdgFT" target="_blank" class="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
							<div class="text-4xl">💬</div>
							<div>
								<div class="font-semibold text-white">Discord</div>
								<div class="text-sm text-slate-400">Join our server</div>
							</div>
						</a>
						<a href="https://x.com/Rivaraistaken" target="_blank" class="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
							<div class="text-4xl">X</div>
							<div>
								<div class="font-semibold text-white">"X"</div>
								<div class="text-sm text-slate-400">Follow for updates</div>
							</div>
						</a>
					</div>
				</div>
			</Card>

			<!-- Security Tips -->
			<Card variant="elevated">
				<div class="p-8">
					<div class="flex items-center gap-2 mb-4">
						<Shield size={24} class="text-cyan-400" />
						<h3 class="text-2xl font-bold text-white">Security Tips</h3>
					</div>
					<ul class="space-y-3">
						{#each securityTips as tip}
							<li class="flex items-start gap-2 text-slate-300">
								<span class="flex-shrink-0">{tip.do ? '✅' : '❌'}</span>
								<span>{tip.text}</span>
							</li>
						{/each}
					</ul>
				</div>
			</Card>
		</div>
	</section>
</div>
