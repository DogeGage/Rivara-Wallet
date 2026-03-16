<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { RefreshCw, Settings, Lock, Wallet, TrendingUp } from 'lucide-svelte';
	import { isUnlocked, wallet, totalBalance, selectedCurrency, convertCurrency, exchangeRates } from '$lib/stores/wallet';
	import { walletService } from '$lib/services/wallet-service';

	let currentTimeframe = '7D';

	$: currentWallet = $wallet;
	$: currentTotalBalance = $totalBalance;
	$: convertedBalance = convertCurrency(currentTotalBalance, $selectedCurrency, $exchangeRates);

	// Calculate asset allocation from real wallet data
	$: assets = currentWallet ? (() => {
		const assetList = [
			{ name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', usd: parseFloat(currentWallet.bitcoin?.balanceUSD || '0') },
			{ name: 'Ethereum', symbol: 'ETH', color: '#627eea', usd: parseFloat(currentWallet.ethereum?.balanceUSD || '0') },
			{ name: 'Solana', symbol: 'SOL', color: '#14f195', usd: parseFloat(currentWallet.solana?.balanceUSD || '0') },
			{ name: 'Dogecoin', symbol: 'DOGE', color: '#c2a633', usd: parseFloat(currentWallet.dogecoin?.balanceUSD || '0') },
			{ name: 'Polygon', symbol: 'POL', color: '#8247e5', usd: parseFloat(currentWallet.polygon?.balanceUSD || '0') },
			{ name: 'Litecoin', symbol: 'LTC', color: '#bfbbbb', usd: parseFloat(currentWallet.litecoin?.balanceUSD || '0') },
			{ name: 'Tron', symbol: 'TRX', color: '#ef0027', usd: parseFloat(currentWallet.tron?.balanceUSD || '0') },
			{ name: 'Avalanche', symbol: 'AVAX', color: '#e84142', usd: parseFloat(currentWallet.avalanche?.balanceUSD || '0') },
			{ name: 'BNB Chain', symbol: 'BNB', color: '#f3ba2f', usd: parseFloat(currentWallet.bsc?.balanceUSD || '0') }
		].filter(a => a.usd > 0);

		const total = assetList.reduce((sum, a) => sum + a.usd, 0);
		
		return assetList.map(a => ({
			...a,
			balance: convertCurrency(a.usd.toFixed(2), $selectedCurrency, $exchangeRates),
			percentage: total > 0 ? Math.round((a.usd / total) * 100) : 0
		})).sort((a, b) => b.usd - a.usd);
	})() : [];

	$: if (!$isUnlocked) {
		goto('/unlock');
	}

	onMount(() => {
		if (!$isUnlocked) return;
		
		// Fetch balances if wallet exists
		if ($wallet) {
			walletService.fetchBalances();
		}
	});

	function lockWallet() {
		sessionStorage.removeItem('walletUnlocked');
		goto('/unlock');
	}

	function changeTimeframe(tf: string) {
		currentTimeframe = tf;
	}

	function getTimeframeLabel() {
		const labels: Record<string, string> = {
			'24H': '24-hour',
			'7D': '7-day',
			'1M': '1-month',
			'3M': '3-month',
			'1Y': '1-year',
			'Max': 'all-time'
		};
		return labels[currentTimeframe] || '7-day';
	}
</script>

<div class="flex flex-col h-screen bg-[#070b10]">
	<!-- Top Nav -->
	<nav class="flex items-center justify-between px-6 py-4 bg-stone-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
		<div class="flex items-center gap-8">
			<div class="flex items-center gap-2">
				<span class="text-xl">⬢</span>
				<span class="font-bold text-white">Rivara</span>
			</div>
			<div class="hidden md:flex gap-6">
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/wallet')}>Wallets</button>
				<button class="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b-2 border-cyan-500 pb-1">Portfolio</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/exchange')}>Exchange</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/settings')}>Settings</button>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<select class="px-3 py-1.5 bg-stone-800/50 border border-white/10 rounded-lg text-sm text-white">
				<option>USD</option>
				<option>CAD</option>
				<option>EUR</option>
			</select>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={() => goto('/settings')}>
				<Settings size={18} />
			</button>
			<button class="p-2 text-slate-400 hover:text-white transition">
				<RefreshCw size={18} />
			</button>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={lockWallet}>
				<Lock size={18} />
			</button>
		</div>
	</nav>

	<div class="flex-1 overflow-y-auto p-8 pb-24 md:pb-8">
		<div class="max-w-7xl mx-auto">
			<div class="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
				<!-- Left Column -->
				<div class="flex flex-col gap-6">
					<!-- Donut Chart Card -->
					<div class="relative p-8 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
						<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
							<div class="text-sm text-slate-500 mb-1">Total Balance</div>
							<div class="text-2xl font-bold text-white">${convertedBalance}</div>
						</div>
						<div class="w-64 h-64 mx-auto">
							<canvas id="portfolioDonut"></canvas>
						</div>
					</div>

					<!-- Assets List -->
					<div class="flex flex-col gap-3">
						{#each assets as asset}
							<button 
								class="flex items-center gap-4 px-6 py-4 rounded-xl bg-transparent border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all hover:translate-x-1"
								on:click={() => goto('/wallet')}
							>
								<div class="w-3 h-3 rounded-full flex-shrink-0" style="background: {asset.color}"></div>
								<div class="flex-1 text-left text-white font-medium">{asset.name} {asset.percentage}%</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Right Column -->
				<div class="p-8 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
					<div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
						<h2 class="text-xl font-bold text-white">Portfolio Performance</h2>
						<div class="flex gap-2 flex-wrap">
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === '24H' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('24H')}
							>24H</button>
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === '7D' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('7D')}
							>7D</button>
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === '1M' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('1M')}
							>1M</button>
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === '3M' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('3M')}
							>3M</button>
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === '1Y' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('1Y')}
							>1Y</button>
							<button 
								class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {currentTimeframe === 'Max' ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
								on:click={() => changeTimeframe('Max')}
							>Max</button>
						</div>
					</div>
					
					<div class="h-96">
						<canvas id="portfolioLineChart"></canvas>
					</div>
					
					<div class="text-center text-slate-600 text-sm mt-4">
						Showing {getTimeframeLabel()} percentage gain/loss for owned cryptos
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Mobile Bottom Nav -->
<div class="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-xl border-t border-white/10 md:hidden z-50">
	<div class="grid grid-cols-4 p-2">
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/wallet')}>
			<Wallet size={24} /><span class="text-xs">Wallet</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-cyan-400">
			<TrendingUp size={24} /><span class="text-xs font-medium">Portfolio</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/exchange')}>
			<RefreshCw size={24} /><span class="text-xs">Swap</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/settings')}>
			<Settings size={24} /><span class="text-xs">Settings</span>
		</button>
	</div>
</div>
