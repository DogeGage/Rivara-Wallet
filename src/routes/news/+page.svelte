<script lang="ts">
	import { goto } from '$app/navigation';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Newspaper, BookOpen, HelpCircle, Info, Calendar, ArrowRight } from 'lucide-svelte';

	const articles = [
		{
			date: 'March 15, 2026',
			title: 'XTZ Support Removed 🪦',
			featured: false,
			content: `After extensive development efforts, we have made the decision to remove Tezos (XTZ) support from Rivara Wallet.

**Why we removed it:**
- Tezos requires a mandatory "reveal" operation before any transaction can be sent — a design decision found in no other major blockchain
- The reveal system is inconsistent across RPC providers, with different nodes producing conflicting validation results
- XTZ address derivation is incompatible with standard cryptographic libraries used by every other supported chain
- Multiple established wallets including Guarda derive different addresses from the same seed phrase

**What this means for you:**
If you have XTZ funds, we recommend importing your seed phrase into Temple Wallet to access them safely.

We remain committed to supporting cryptocurrencies that follow standard implementation practices. XTZ did not meet that bar.

RIP XTZ support.`
		},
		{
			date: 'December 21, 2025',
			title: 'Rivara Wallet Launch 🚀',
			featured: true,
			content: `We're excited to announce the official launch of Rivara Wallet! After months of development and testing, we're ready to provide you with a crypto wallet that actually works.

**What's Included:**
- Support for 8 major cryptocurrencies (BTC, ETH, SOL, DOGE, LTC, XTZ, TRX, POL)
- Built-in exchange powered by ChangeNow
- Rivara Token (DGAGE) - our native token on Polygon
- Tuffbackup encrypted backup system`
		},
		{
			date: 'December 21, 2025',
			title: 'DGAGE Token Airdrop 🎁',
			featured: false,
			content: `To celebrate our launch, we are distributing 10 DGAGE to early new users.
Just create a wallet and submit your DGAGE address via our Discord or live chat!

**Contract Address:** \`0x9b359461EDdCEd424e37c1b3d2e54c875a5a319D\` (Polygon)

DGAGE is our native utility token with unlimited minting capability. Join our community to learn more about upcoming DGAGE features and use cases.`
		},
		{
			date: 'March 11, 2026',
			title: 'Tuffbackup Format Update — .dogegage is Now Legacy',
			featured: false,
			content: `With the rebrand to Rivara Wallet, our Tuffbackup file format has been updated.

**New format:** \`.rivara\`
**Legacy format:** \`.dogegage\`

If you have an existing \`.dogegage\` backup file from when we were DogeGage Wallet, don't worry — it still works. You can import it on the Import page just like before.

Going forward, all new backups will be saved as \`.rivara\` files. We recommend re-exporting your backup after importing to get the updated format.`
		},
		{
			date: 'Coming Soon',
			title: 'Roadmap 🗺️',
			featured: false,
			content: `Here's what we're working on next:

- Mobile app (iOS & Android)
- Hardware wallet integration
- Buy / Sell Support
- NFT support
- Multi-language support
- Advanced portfolio analytics

Stay tuned for updates!`
		}
	];

	function formatContent(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/`(.+?)`/g, '<code class="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-mono">$1</code>')
			.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
			.split('\n\n')
			.map(para => {
				if (para.includes('<li>')) {
					return `<ul class="space-y-2 my-4">${para}</ul>`;
				}
				if (para.startsWith('<strong>')) {
					return `<p class="mb-3">${para}</p>`;
				}
				return `<p class="text-slate-300 leading-relaxed mb-3">${para}</p>`;
			})
			.join('');
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
					<Newspaper size={18} class="mr-2 text-cyan-400" />
					<span class="text-cyan-400 font-semibold">News</span>
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
		<div class="max-w-4xl mx-auto text-center">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
				<Newspaper size={20} class="text-cyan-400" />
				<span class="text-cyan-400 font-semibold text-sm">Latest Updates</span>
			</div>
			<h1 class="text-6xl font-bold mb-6">
				<span class="bg-gradient-to-r from-cyan-400 to-cyan-400 bg-clip-text text-transparent">Latest News</span>
			</h1>
			<p class="text-xl text-slate-400">Stay updated with Rivara Wallet developments</p>
		</div>
	</section>

	<!-- Articles -->
	<section class="pb-32 px-8">
		<div class="max-w-4xl mx-auto space-y-8">
			{#each articles as article, index}
				<Card variant="elevated" hoverable>
					<div class="p-8 relative">
						{#if article.featured}
							<div class="absolute top-6 right-6 px-3 py-1 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white text-xs font-bold rounded-full">
								Latest
							</div>
						{/if}
						
						<div class="flex items-center gap-2 text-slate-500 text-sm mb-4">
							<Calendar size={16} />
							<span>{article.date}</span>
						</div>
						
						<h2 class="text-3xl font-bold text-white mb-6">{article.title}</h2>
						
						<div class="prose prose-invert max-w-none">
							{@html formatContent(article.content)}
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="pb-32 px-8">
		<div class="max-w-4xl mx-auto">
			<Card variant="elevated">
				<div class="p-12 text-center bg-gradient-to-br from-cyan-900/20 to-cyan-900/20">
					<h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
					<p class="text-slate-400 mb-8">Create your wallet and join the Rivara community</p>
					<div class="flex gap-4 justify-center">
						<Button color="primary" size="lg" on:click={() => goto('/create')}>
							Create Wallet
							<ArrowRight size={18} class="ml-2" />
						</Button>
						<Button variant="flat" size="lg" on:click={() => goto('/docs')}>
							Read Docs
						</Button>
					</div>
				</div>
			</Card>
		</div>
	</section>
</div>
