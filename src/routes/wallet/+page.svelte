<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { 
		Wallet, Send, ArrowDownToLine, RefreshCw, Settings, Eye, EyeOff,
		Copy, Check, Lock, TrendingUp, ChevronDown, ChevronRight, ArrowLeft
	} from 'lucide-svelte';
	import { wallet, isUnlocked, balancesLoading, totalBalance, selectedCurrency, exchangeRates, currencySymbols, convertCurrency, fetchExchangeRates } from '$lib/stores/wallet';
	import { walletService } from '$lib/services/wallet-service';



	let balanceVisible = true;
	let copied = false;
	let selectedCrypto: string | null = null;
	let showingSend = false;
	let pageLoading = true;
	let expandedChains: Record<string, boolean> = {
		bitcoin: true,
		ethereum: true,
		tezos: true,
		tron: true,
		solana: true
	};

	$: currentWallet = $wallet;
	$: currentTotalBalance = $totalBalance;
	$: currentCurrency = $selectedCurrency;
	$: currentRates = $exchangeRates;
	$: isLoading = $balancesLoading;

	$: chainGroups = currentWallet ? [
		{
			name: 'Bitcoin',
			key: 'bitcoin',
			color: '#f7931a',
			assets: [
				{ name: 'Bitcoin', symbol: 'BTC', balance: currentWallet.bitcoin?.balance || '0', usd: convertCurrency(currentWallet.bitcoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/btc.svg', address: currentWallet.bitcoin?.address || '' },
				{ name: 'Dogecoin', symbol: 'DOGE', balance: currentWallet.dogecoin?.balance || '0', usd: convertCurrency(currentWallet.dogecoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/doge.svg', address: currentWallet.dogecoin?.address || '' },
				{ name: 'Litecoin', symbol: 'LTC', balance: currentWallet.litecoin?.balance || '0', usd: convertCurrency(currentWallet.litecoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/ltc.svg', address: currentWallet.litecoin?.address || '' }
			]
		},
		{
			name: 'Ethereum',
			key: 'ethereum',
			color: '#627eea',
			assets: [
				{ name: 'Ethereum', symbol: 'ETH', balance: currentWallet.ethereum?.balance || '0', usd: convertCurrency(currentWallet.ethereum?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/eth.svg', address: currentWallet.ethereum?.address || '' },
				{ name: 'Polygon', symbol: 'POL', balance: currentWallet.polygon?.balance || '0', usd: convertCurrency(currentWallet.polygon?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/matic.svg', address: currentWallet.polygon?.address || '' }
			]
		},
		{
			name: 'Tezos',
			key: 'tezos',
			color: '#2c7df7',
			assets: [
				{ name: 'Tezos', symbol: 'XTZ', balance: currentWallet.tezos?.balance || '0', usd: convertCurrency(currentWallet.tezos?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/xtz.svg', address: currentWallet.tezos?.address || '' }
			]
		},
		{
			name: 'Tron',
			key: 'tron',
			color: '#ef0027',
			assets: [
				{ name: 'Tron', symbol: 'TRX', balance: currentWallet.tron?.balance || '0', usd: convertCurrency(currentWallet.tron?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/trx.svg', address: currentWallet.tron?.address || '' }
			]
		},
		{
			name: 'Solana',
			key: 'solana',
			color: '#14f195',
			assets: [
				{ name: 'Solana', symbol: 'SOL', balance: currentWallet.solana?.balance || '0', usd: convertCurrency(currentWallet.solana?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/sol.svg', address: currentWallet.solana?.address || '' }
			]
		}
	] : [];

	$: allCryptos = chainGroups?.flatMap(g => g.assets) || [];
	$: selectedAsset = selectedCrypto ? allCryptos.find(c => c.symbol === selectedCrypto) : null;
	$: convertedBalance = convertCurrency(currentTotalBalance, currentCurrency, currentRates);

	// Reactive auth guard — if store says not unlocked, redirect
	$: if (!$isUnlocked) {
		goto('/unlock');
	}

	onMount(async () => {
		console.log('🔵 Wallet page mounted');
		
		// If not unlocked, the reactive check above handles redirect
		if (!$isUnlocked) return;
		
		const walletData = walletService.getWallet();
		console.log('🔵 Wallet data from service:', walletData);
		
		if (!walletData) {
			console.log('❌ No wallet data, redirecting to unlock');
			goto('/unlock');
			return;
		}
		
		wallet.set(walletData);
		pageLoading = false;

		console.log('🔵 Fetching exchange rates and balances...');
		await fetchExchangeRates();
		await walletService.fetchBalances();
	});

	function toggleBalance() { balanceVisible = !balanceVisible; }
	
	function toggleChain(key: string) {
		expandedChains[key] = !expandedChains[key];
	}

	function selectAsset(symbol: string) {
		selectedCrypto = symbol;
		showingSend = false;
	}

	function clearSelectedAsset() {
		selectedCrypto = null;
		showingSend = false;
	}

	async function copyAddress() {
		if (!selectedAsset) return;
		await navigator.clipboard.writeText(selectedAsset.address);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function lockWallet() {
		walletService.lock();
		goto('/unlock');
	}

	async function refreshBalances() {
		await walletService.fetchBalances();
	}

	function changeCurrency(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCurrency.set(target.value);
		localStorage.setItem('selectedCurrency', target.value);
	}

	function showSend() { showingSend = true; }
	function showReceive() { showingSend = false; }
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
				<button class="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b-2 border-cyan-500 pb-1">Wallets</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/portfolio')}>Portfolio</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/exchange')}>Exchange</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/settings')}>Settings</button>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<select class="px-3 py-1.5 bg-stone-800/50 border border-white/10 rounded-lg text-sm text-white" value={currentCurrency} on:change={changeCurrency}>
				<option value="usd">USD</option>
				<option value="cad">CAD</option>
				<option value="eur">EUR</option>
				<option value="gbp">GBP</option>
				<option value="jpy">JPY</option>
			</select>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={() => goto('/settings')}>
				<Settings size={18} />
			</button>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={refreshBalances} disabled={isLoading}>
				<RefreshCw size={18} class={isLoading ? 'animate-spin' : ''} />
			</button>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={lockWallet}>
				<Lock size={18} />
			</button>
		</div>
	</nav>

	<div class="flex flex-1 overflow-hidden">
		<!-- Left Sidebar -->
		<aside class="w-80 bg-stone-900/30 backdrop-blur-xl border-r border-white/5 flex flex-col max-md:w-full max-md:border-r-0 {selectedAsset ? 'max-md:hidden' : ''}">
			<!-- Balance Header -->
			<div class="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
				<div class="text-3xl font-extrabold text-white mb-1 tracking-tight">
					{currencySymbols[currentCurrency]}{convertedBalance} <span class="text-sm text-slate-500 font-medium">{currentCurrency.toUpperCase()}</span>
				</div>
				<div class="text-xs text-slate-500 font-medium">8 chains{isLoading ? ' • Loading...' : ''}</div>
			</div>

			<!-- Chain Groups -->
			<div class="flex-1 overflow-y-auto py-2">
				{#each chainGroups as group}
					<div class="mx-3 mb-3 rounded-lg bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-white/10 transition-all overflow-hidden">
						<!-- Chain Header -->
						<button 
							class="w-full flex items-center justify-between p-3 cursor-pointer"
							on:click={() => toggleChain(group.key)}
						>
							<div class="flex items-center gap-2.5">
								<div class="w-8 h-8 rounded-full flex items-center justify-center">
									<img src={group.assets[0].icon} alt={group.name} class="w-8 h-8" />
								</div>
								<div class="text-left">
									<div class="text-sm font-bold text-white tracking-wide">{group.name}</div>
									<div class="text-xs text-slate-500">{group.assets.length} asset{group.assets.length > 1 ? 's' : ''}</div>
								</div>
							</div>
							<div class="flex items-center gap-2.5">
								<div class="text-sm font-bold text-white">
									${group.assets.reduce((sum, a) => sum + parseFloat(a.usd), 0).toFixed(2)}
								</div>
								<div class="text-slate-500 text-xs transition-transform duration-300" style="transform: rotate({expandedChains[group.key] ? 90 : 0}deg)">
									<ChevronRight size={12} />
								</div>
							</div>
						</button>

						<!-- Chain Assets -->
						{#if expandedChains[group.key]}
							<div class="bg-black/20 border-t border-white/5">
								{#each group.assets as asset}
									<button 
										class="w-full flex items-center gap-2.5 px-3 py-2.5 pl-11 border-b border-white/[0.02] last:border-b-0 transition-all hover:bg-white/5 {selectedCrypto === asset.symbol ? 'bg-cyan-500/15 border-l-3 !border-l-cyan-500' : ''}"
										on:click={() => selectAsset(asset.symbol)}
									>
										<img src={asset.icon} alt={asset.name} class="w-7 h-7" />
										<div class="flex-1 text-left">
											<div class="text-sm font-semibold text-white">{asset.symbol}</div>
										</div>
										{#if balanceVisible}
											<div class="text-right">
												<div class="text-sm font-semibold text-white">{asset.balance}</div>
												<div class="text-xs text-slate-500">${asset.usd}</div>
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</aside>

		<!-- Main Content -->
		{#if selectedAsset}
			<main class="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 {selectedAsset ? 'max-md:block' : 'max-md:hidden'}">
				<div class="w-full">
					<!-- Mobile Back Button -->
					<button 
						class="md:hidden flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
						on:click={clearSelectedAsset}
					>
						<ArrowLeft size={18} />
						Back to Wallet List
					</button>

					<!-- Asset Header -->
					<div class="flex items-center justify-between mb-6">
						<h1 class="text-3xl font-extrabold text-white tracking-tight">{selectedAsset.name}</h1>
						<div class="flex gap-2.5">
							<button 
								class="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium transition-all hover:bg-white/10 {!showingSend ? 'bg-cyan-600 border-cyan-500' : ''}"
								on:click={showReceive}
							>
								<ArrowDownToLine size={16} class="inline mr-1.5" />
								Receive
							</button>
							<button 
								class="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium transition-all hover:bg-white/10 {showingSend ? 'bg-cyan-600 border-cyan-500' : ''}"
								on:click={showSend}
							>
								<Send size={16} class="inline mr-1.5" />
								Send
							</button>
						</div>
					</div>

					{#if !showingSend}
						<!-- Balance Card -->
						<div class="mb-6 p-8 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
							<div class="mb-5">
								<div class="text-sm text-slate-500 mb-2 font-medium">Balance</div>
								{#if balanceVisible}
									<div class="text-5xl font-extrabold text-white mb-2 tracking-tight">{selectedAsset.balance} {selectedAsset.symbol}</div>
									<div class="text-xl text-slate-400">${selectedAsset.usd}</div>
								{:else}
									<div class="text-5xl font-extrabold text-slate-700">••••••</div>
								{/if}
							</div>

							<div class="pt-5 border-t border-white/5">
								<div class="text-sm text-slate-500 mb-2.5 font-medium">Wallet Address</div>
								<div class="flex items-center gap-2.5 p-3.5 bg-black/20 rounded-lg border border-white/5">
									<span class="flex-1 text-sm text-slate-300 font-mono break-all">{selectedAsset.address}</span>
									<button on:click={copyAddress} class="p-2 hover:bg-white/5 rounded-lg transition">
										{#if copied}
											<Check size={16} class="text-green-400" />
										{:else}
											<Copy size={16} class="text-slate-400" />
										{/if}
									</button>
								</div>
							</div>
						</div>

						<!-- Price Chart -->
						<div class="mb-6 p-6 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
							<div class="flex items-center justify-between mb-5">
								<h2 class="text-lg font-bold text-white">Price Chart</h2>
								<div class="flex gap-1.5">
									<button class="px-2.5 py-1.5 bg-cyan-600 text-white text-xs font-medium rounded-md">24H</button>
									<button class="px-2.5 py-1.5 bg-stone-800/50 text-slate-400 text-xs font-medium rounded-md hover:bg-stone-700 transition">7D</button>
									<button class="px-2.5 py-1.5 bg-stone-800/50 text-slate-400 text-xs font-medium rounded-md hover:bg-stone-700 transition">30D</button>
								</div>
							</div>
							<div class="h-40 flex items-center justify-center text-slate-500 text-sm">
								Chart temporarily unavailable (rate limited)
							</div>
						</div>

						<!-- Transactions -->
						<div class="p-6 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
							<h2 class="text-lg font-bold text-white mb-5">Transactions</h2>
							<div class="py-10 text-center text-slate-500 text-sm">
								No transactions
							</div>
						</div>
					{:else}
						<!-- Send Form -->
						<div class="p-8 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
							<div class="max-w-2xl">
								<div class="mb-6">
									<label class="block text-sm text-slate-400 mb-2.5 font-semibold">Recipient Address</label>
									<input 
										type="text" 
										placeholder="Enter {selectedAsset.symbol} address" 
										class="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
									/>
								</div>

								<div class="mb-6">
									<label class="block text-sm text-slate-400 mb-2.5 font-semibold">Amount</label>
									<div class="relative">
										<input 
											type="number" 
											placeholder="0.00" 
											step="any"
											class="w-full px-4 py-3.5 pr-20 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
										/>
										<span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">{selectedAsset.symbol}</span>
									</div>
									<div class="flex items-center justify-between mt-2 text-sm text-slate-500">
										<span>Available: {selectedAsset.balance} {selectedAsset.symbol}</span>
										<button class="px-2.5 py-1 border border-cyan-500/50 text-cyan-400 rounded-md hover:bg-cyan-500/10 transition font-medium text-xs">MAX</button>
									</div>
								</div>

								<div class="mb-6">
									<label class="block text-sm text-slate-400 mb-2.5 font-semibold">Network Fee</label>
									<div class="p-3.5 bg-black/20 border border-white/10 rounded-lg">
										<span class="text-slate-400 text-sm">Estimated fee: ~$0.50</span>
									</div>
								</div>

								<div class="mb-6 p-5 bg-black/20 border border-white/10 rounded-lg">
									<div class="flex justify-between items-center py-2 border-b border-white/5 mb-2">
										<span class="text-slate-400 text-sm">You're sending</span>
										<span class="text-white font-semibold text-sm">0 {selectedAsset.symbol}</span>
									</div>
									<div class="flex justify-between items-center py-2">
										<span class="text-slate-400 text-sm">Network fee</span>
										<span class="text-white font-semibold text-sm">~$0.50</span>
									</div>
								</div>

								<button class="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25">
									Review Transaction
								</button>
							</div>
						</div>
					{/if}
				</div>
			</main>
		{:else}
			<!-- No asset selected - show empty state -->
			<main class="flex-1 flex items-center justify-center text-slate-500 max-md:hidden">
				<div class="text-center">
					<Wallet size={64} class="mx-auto mb-4 opacity-20" />
					<p class="text-lg">Select an asset to view details</p>
				</div>
			</main>
		{/if}
	</div>
</div>

<!-- Mobile Bottom Nav -->
<div class="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-xl border-t border-white/10 md:hidden z-50">
	<div class="grid grid-cols-4 p-2">
		<button class="flex flex-col items-center gap-1 py-3 text-cyan-400">
			<Wallet size={24} /><span class="text-xs font-medium">Wallet</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/portfolio')}>
			<TrendingUp size={24} /><span class="text-xs">Portfolio</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/exchange')}>
			<RefreshCw size={24} /><span class="text-xs">Swap</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/settings')}>
			<Settings size={24} /><span class="text-xs">Settings</span>
		</button>
	</div>
</div>

