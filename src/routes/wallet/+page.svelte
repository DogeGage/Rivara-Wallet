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
	import { wallet, isUnlocked, isCurrentUnlock, balancesLoading, totalBalance, selectedCurrency, exchangeRates, currencySymbols, convertCurrency, fetchExchangeRates } from '$lib/stores/wallet';
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
	let transactions: any[] = [];
	let loadingTransactions = false;
	let chartData: any = null;
	let loadingChart = false;
	let chartDays = 1;
	let chartInstance: any = null;

	$: currentWallet = $wallet;
	$: currentTotalBalance = $totalBalance;
	$: currentCurrency = $selectedCurrency;
	$: currentRates = $exchangeRates;
	$: isLoading = $balancesLoading;

	$: chainGroups = currentWallet
		? (() => {
				const ethTokens = currentWallet.detectedTokens?.ethereum || [];
				const polygonTokens = currentWallet.detectedTokens?.polygon || [];
				const ethUsdc = ethTokens.find((t: any) => t.symbol === 'USDC');
				const polyUsdc = polygonTokens.find((t: any) => t.symbol === 'USDC');

				const ethereumAssets = [
					{ id: 'ETH', name: 'Ethereum', symbol: 'ETH', balance: currentWallet.ethereum?.balance || '0', usd: convertCurrency(currentWallet.ethereum?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/eth.svg', address: currentWallet.ethereum?.address || '' },
					{ id: 'POL', name: 'Polygon', symbol: 'POL', balance: currentWallet.polygon?.balance || '0', usd: convertCurrency(currentWallet.polygon?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/matic.svg', address: currentWallet.polygon?.address || '' },
					{ id: 'USDC_ETH', name: 'USD Coin (Ethereum)', symbol: 'USDC', balance: ethUsdc?.balance || '0', usd: ethUsdc ? convertCurrency(ethUsdc.balanceUSD || '0', currentCurrency, currentRates) : '0.00', icon: '/assets/crypto/SVG/iusdc.svg', address: currentWallet.ethereum?.address || '' },
					{ id: 'USDC_POL', name: 'USD Coin (Polygon)', symbol: 'USDC', balance: polyUsdc?.balance || '0', usd: polyUsdc ? convertCurrency(polyUsdc.balanceUSD || '0', currentCurrency, currentRates) : '0.00', icon: '/assets/crypto/SVG/plUSDC.svg', address: currentWallet.polygon?.address || '' }
				];

				return [
					{ name: 'Bitcoin', key: 'bitcoin', color: '#f7931a', assets: [
						{ id: 'BTC', name: 'Bitcoin', symbol: 'BTC', balance: currentWallet.bitcoin?.balance || '0', usd: convertCurrency(currentWallet.bitcoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/btc.svg', address: currentWallet.bitcoin?.address || '' },
						{ id: 'DOGE', name: 'Dogecoin', symbol: 'DOGE', balance: currentWallet.dogecoin?.balance || '0', usd: convertCurrency(currentWallet.dogecoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/doge.svg', address: currentWallet.dogecoin?.address || '' },
						{ id: 'LTC', name: 'Litecoin', symbol: 'LTC', balance: currentWallet.litecoin?.balance || '0', usd: convertCurrency(currentWallet.litecoin?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/ltc.svg', address: currentWallet.litecoin?.address || '' }
					]},
					{ name: 'Ethereum', key: 'ethereum', color: '#627eea', assets: ethereumAssets },
					{ name: 'Tezos', key: 'tezos', color: '#2c7df7', assets: [
						{ id: 'XTZ', name: 'Tezos', symbol: 'XTZ', balance: currentWallet.tezos?.balance || '0', usd: convertCurrency(currentWallet.tezos?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/xtz.svg', address: currentWallet.tezos?.address || '' }
					]},
					{ name: 'Tron', key: 'tron', color: '#ef0027', assets: [
						{ id: 'TRX', name: 'Tron', symbol: 'TRX', balance: currentWallet.tron?.balance || '0', usd: convertCurrency(currentWallet.tron?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/trx.svg', address: currentWallet.tron?.address || '' }
					]},
					{ name: 'Solana', key: 'solana', color: '#14f195', assets: [
						{ id: 'SOL', name: 'Solana', symbol: 'SOL', balance: currentWallet.solana?.balance || '0', usd: convertCurrency(currentWallet.solana?.balanceUSD || '0', currentCurrency, currentRates), icon: '/assets/crypto/SVG/sol.svg', address: currentWallet.solana?.address || '' }
					]}
				];
			})()
		: [];

	$: allCryptos = chainGroups?.flatMap((g) => g.assets) || [];
	$: selectedAsset = selectedCrypto ? allCryptos.find((c) => c.id === selectedCrypto) : null;
	$: convertedBalance = convertCurrency(currentTotalBalance, currentCurrency, currentRates);

	onMount(async () => {
		console.log('🔵 Wallet page mounted');
		if (!browser) return;

		isCurrentUnlock.set(false);

		const unlocked = sessionStorage.getItem('walletUnlocked') === 'true';
		if (!unlocked) {
			goto('/unlock');
			return;
		}
		isUnlocked.set(true);

		const walletData = walletService.getWallet();
		console.log('🔵 Wallet data from service:', walletData);
		
		if (!walletData) {
			console.log('❌ No wallet data, redirecting to unlock');
			goto('/unlock');
			return;
		}
		
		// Set base wallet from service, then hydrate with any cached balances
		wallet.set(walletData);
		await walletService.hydrateWalletFromCache();
		pageLoading = false;

		// Only fetch fresh balances when user explicitly refreshes
		console.log('🔵 Fetching exchange rates (balances only on manual refresh)...');
		await fetchExchangeRates();
	});

	function toggleBalance() { balanceVisible = !balanceVisible; }
	
	function toggleChain(key: string) {
		expandedChains[key] = !expandedChains[key];
	}

	async function selectAsset(id: string) {
		selectedCrypto = id;
		showingSend = false;
		transactions = [];
		chartData = null;
		
		// Load transactions and chart
		await Promise.all([
			loadTransactions(id),
			loadChart(id, chartDays)
		]);
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

	async function loadTransactions(assetId: string) {
		if (!selectedAsset) return;
		loadingTransactions = true;
		
		try {
			const service = getServiceForAsset(assetId);
			if (service) {
				transactions = await service.getTransactions(selectedAsset.address);
			}
		} catch (error) {
			console.error('Failed to load transactions:', error);
			transactions = [];
		} finally {
			loadingTransactions = false;
		}
	}

	async function loadChart(assetId: string, days: number) {
		if (!selectedAsset) return;
		loadingChart = true;
		chartData = null;
		
		try {
			const coinId = getCoinGeckoId(assetId);
			if (!coinId) {
				loadingChart = false;
				return;
			}
			
			const response = await fetch(`https://api.rivarawallet.xyz/api/coingecko/chart?id=${coinId}&days=${days}`);
			
			if (response.ok) {
				const data = await response.json();
				// Check if it's cached data (not an error)
				if (data.prices && Array.isArray(data.prices)) {
					chartData = data;
					// Render chart after a small delay to ensure canvas exists
					setTimeout(() => renderChart(), 50);
				} else {
					console.warn('Chart data not in cache:', data);
					chartData = null;
				}
			} else if (response.status === 503) {
				// Chart not cached yet - this is expected
				console.log('Chart not cached for', coinId, days, 'days');
				chartData = null;
			} else {
				console.error('Chart fetch failed:', response.status);
				chartData = null;
			}
		} catch (error) {
			console.error('Failed to load chart:', error);
			chartData = null;
		} finally {
			loadingChart = false;
		}
	}

	function getCoinGeckoId(assetId: string): string | null {
		const mapping: Record<string, string> = {
			'BTC': 'bitcoin',
			'ETH': 'ethereum',
			'DOGE': 'dogecoin',
			'LTC': 'litecoin',
			'SOL': 'solana',
			'XTZ': 'tezos',
			'TRX': 'tron',
			'POL': 'polygon-ecosystem-token'
			// USDC is a stablecoin - no chart needed
		};
		return mapping[assetId] || null;
	}

	function getServiceForAsset(assetId: string) {
		if (['BTC', 'DOGE', 'LTC'].includes(assetId)) {
			return walletService.getChainService(assetId.toLowerCase());
		} else if (['ETH', 'POL', 'USDC_ETH', 'USDC_POL'].includes(assetId)) {
			return walletService.getChainService(assetId === 'POL' || assetId === 'USDC_POL' ? 'polygon' : 'ethereum');
		} else if (assetId === 'SOL') {
			return walletService.getChainService('solana');
		} else if (assetId === 'XTZ') {
			return walletService.getChainService('tezos');
		} else if (assetId === 'TRX') {
			return walletService.getChainService('tron');
		}
		return null;
	}

	function renderChart() {
		if (!chartData?.prices || !browser) return;
		
		const canvas = document.getElementById('priceChart') as HTMLCanvasElement;
		if (!canvas) {
			console.warn('Canvas not found, retrying...');
			setTimeout(() => renderChart(), 100);
			return;
		}
		
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		
		// Destroy existing chart
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
		
		const prices = chartData.prices;
		const labels = prices.map((p: any) => {
			const date = new Date(p[0]);
			if (chartDays === 1) {
				return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			} else {
				return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
			}
		});
		const values = prices.map((p: any) => p[1]);
		
		const priceChange = values[values.length - 1] - values[0];
		const chartColor = priceChange >= 0 ? '#4ade80' : '#ef4444';
		
		// @ts-ignore
		chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [{
					label: 'Price',
					data: values,
					borderColor: chartColor,
					backgroundColor: chartColor + '20',
					fill: true,
					tension: 0.4,
					pointRadius: 0,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: (context: any) => '$' + context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
						}
					}
				},
				scales: {
					x: {
						display: true,
						grid: { display: false },
						ticks: { color: '#888', maxTicksLimit: 6 }
					},
					y: {
						display: true,
						grid: { color: 'rgba(255,255,255,0.1)' },
						ticks: {
							color: '#888',
							callback: (value: any) => '$' + value.toLocaleString()
						}
					}
				}
			}
		});
	}

	async function changeChartTimeframe(days: number) {
		chartDays = days;
		if (selectedCrypto) {
			await loadChart(selectedCrypto, days);
		}
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
										class="w-full flex items-center gap-2.5 px-3 py-2.5 pl-11 border-b border-white/[0.02] last:border-b-0 transition-all hover:bg-white/5 {selectedCrypto === asset.id ? 'bg-cyan-500/15 border-l-3 !border-l-cyan-500' : ''}"
										on:click={() => selectAsset(asset.id)}
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
									<button 
										class="px-2.5 py-1.5 text-xs font-medium rounded-md transition {chartDays === 1 ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
										on:click={() => changeChartTimeframe(1)}
									>24H</button>
									<button 
										class="px-2.5 py-1.5 text-xs font-medium rounded-md transition {chartDays === 7 ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
										on:click={() => changeChartTimeframe(7)}
									>7D</button>
									<button 
										class="px-2.5 py-1.5 text-xs font-medium rounded-md transition {chartDays === 30 ? 'bg-cyan-600 text-white' : 'bg-stone-800/50 text-slate-400 hover:bg-stone-700'}"
										on:click={() => changeChartTimeframe(30)}
									>30D</button>
								</div>
							</div>
							{#if loadingChart}
								<div class="h-40 flex items-center justify-center text-slate-500 text-sm">
									Loading chart...
								</div>
							{:else if chartData?.prices}
								<div class="h-40">
									<canvas id="priceChart"></canvas>
								</div>
							{:else}
								<div class="h-40 flex items-center justify-center text-slate-500 text-sm">
									Chart not cached yet - try refreshing later
								</div>
							{/if}
						</div>

						<!-- Transactions -->
						<div class="p-6 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/60 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
							<h2 class="text-lg font-bold text-white mb-5">Transactions</h2>
							{#if loadingTransactions}
								<div class="py-10 text-center text-slate-500 text-sm">
									Loading transactions...
								</div>
							{:else if transactions.length > 0}
								<div class="space-y-2">
									{#each transactions as tx}
										<div class="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-white/5 transition">
											<div class="w-8 h-8 rounded-full flex items-center justify-center {tx.type === 'sent' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">
												{tx.type === 'sent' ? '↑' : '↓'}
											</div>
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium text-white">{tx.type === 'sent' ? 'Sent' : 'Received'}</div>
												<div class="text-xs text-slate-500 truncate">{tx.hash}</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-semibold {tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}">
													{tx.type === 'sent' ? '-' : '+'}{tx.value} {selectedAsset?.symbol}
												</div>
												<div class="text-xs text-slate-500">
													{new Date(tx.timestamp).toLocaleDateString()}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="py-10 text-center text-slate-500 text-sm">
									No transactions
								</div>
							{/if}
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

