<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { RefreshCw, Settings, Lock, ArrowDownUp, Copy, Check, ExternalLink, Wallet, TrendingUp } from 'lucide-svelte';
	import { wallet, isUnlocked } from '$lib/stores/wallet';
	import { walletService } from '$lib/services/wallet-service';
	import { changeNowService } from '$lib/services/changenow-service';
	import { sendTransaction, validateAddress } from '$lib/services/send';
	import type { CryptoChain } from '$lib/types';

	// View state: 'form' or 'status'
	let view = 'form';

	// Exchange form state
	const MIN_AMOUNTS: Record<string, Record<string, number>> = {
		'BTC': { 'ETH': 0, 'SOL': 0, 'XTZ': 0, 'TRX': 0, 'DOGE': 0, 'LTC': 0, 'POL': 0 },
		'DOGE': { 'BTC': 100, 'ETH': 100, 'SOL': 100, 'XTZ': 100, 'TRX': 100, 'LTC': 100, 'POL': 100 },
		'LTC': { 'BTC': 0.01, 'ETH': 0.01, 'SOL': 0.01, 'XTZ': 0.01, 'TRX': 0.01, 'DOGE': 0.01, 'POL': 0.01 },
		'ETH': { 'BTC': 0.01, 'SOL': 0.01, 'XTZ': 0.01, 'TRX': 0.01, 'DOGE': 0.01, 'LTC': 0.01, 'POL': 0.01 },
		'POL': { 'BTC': 1, 'ETH': 1, 'SOL': 1, 'XTZ': 1, 'TRX': 1, 'DOGE': 1, 'LTC': 1 },
		'SOL': { 'BTC': 0.000525, 'ETH': 0.000525, 'XTZ': 0.000525, 'TRX': 0.000525, 'DOGE': 0.000525, 'LTC': 0.000525, 'POL': 0.000525 },
		'XTZ': { 'BTC': 1, 'ETH': 1, 'SOL': 1, 'TRX': 1, 'DOGE': 1, 'LTC': 1, 'POL': 1 },
		'TRX': { 'BTC': 10, 'ETH': 10, 'SOL': 10, 'XTZ': 10, 'DOGE': 10, 'LTC': 10, 'POL': 10 }
	};

	// Symbol to chain name mapping for send service
	const SYMBOL_TO_CHAIN: Record<string, CryptoChain> = {
		'BTC': 'bitcoin',
		'DOGE': 'dogecoin',
		'LTC': 'litecoin',
		'ETH': 'ethereum',
		'POL': 'polygon',
		'SOL': 'solana',
		'XTZ': 'tezos',
		'TRX': 'tron'
	};

	let fromCurrency = 'BTC';
	let toCurrency = 'ETH';
	let fromAmount = '';
	let toAmount = '';
	let customAddress = false;
	let recipientAddress = '';
	let error = '';
	let estimating = false;
	let countdown = 0;
	let countdownInterval: any = null;
	let estimateTimeout: any = null;
	let sending = false;

	// Exchange status state
	let exchangeId = '';
	let status = 'waiting';
	let statusMessage = 'Waiting for deposit confirmation...';
	let txHash = '';
	let payinAddress = '';
	let checkInterval: any = null;
	let copied = false;
	let stressClicks = 0;

	// Cat modal state
	let showCatModal = false;
	let catMessage = '';
	let catImageUrl = '';

	const steps = [
		{ id: 'waiting', label: 'Waiting', icon: '⏳' },
		{ id: 'confirming', label: 'Confirming', icon: '✓' },
		{ id: 'exchanging', label: 'Exchanging', icon: '🔄' },
		{ id: 'sending', label: 'Sending', icon: '📤' },
		{ id: 'finished', label: 'Complete', icon: '✅' }
	];

	$: currentWallet = $wallet;
	$: currencies = [
		{ symbol: 'BTC', name: 'Bitcoin', balance: currentWallet?.bitcoin?.balance || '0', address: currentWallet?.bitcoin?.address || '' },
		{ symbol: 'DOGE', name: 'Dogecoin', balance: currentWallet?.dogecoin?.balance || '0', address: currentWallet?.dogecoin?.address || '' },
		{ symbol: 'LTC', name: 'Litecoin', balance: currentWallet?.litecoin?.balance || '0', address: currentWallet?.litecoin?.address || '' },
		{ symbol: 'ETH', name: 'Ethereum', balance: currentWallet?.ethereum?.balance || '0', address: currentWallet?.ethereum?.address || '' },
		{ symbol: 'POL', name: 'Polygon', balance: currentWallet?.polygon?.balance || '0', address: currentWallet?.polygon?.address || '' },
		{ symbol: 'SOL', name: 'Solana', balance: currentWallet?.solana?.balance || '0', address: currentWallet?.solana?.address || '' },
		{ symbol: 'XTZ', name: 'Tezos', balance: currentWallet?.tezos?.balance || '0', address: currentWallet?.tezos?.address || '' },
		{ symbol: 'TRX', name: 'Tron', balance: currentWallet?.tron?.balance || '0', address: currentWallet?.tron?.address || '' }
	];

	$: fromCrypto = currencies.find(c => c.symbol === fromCurrency);
	$: toCrypto = currencies.find(c => c.symbol === toCurrency);
	$: minAmount = MIN_AMOUNTS[fromCurrency]?.[toCurrency] || 0;
	$: canExchange = fromAmount && !estimating && !error && !sending && parseFloat(fromAmount) >= minAmount && 
		parseFloat(fromAmount) <= parseFloat(fromCrypto?.balance || '0') &&
		(!customAddress || (recipientAddress && isValidAddress(recipientAddress, toCurrency)));
	$: currentStepIndex = steps.findIndex(s => s.id === status);
	$: progress = ((currentStepIndex + 1) / steps.length) * 100;

	// Address validation (matches old version)
	function isValidAddress(address: string, currency: string): boolean {
		const chain = SYMBOL_TO_CHAIN[currency];
		if (!chain) return true;
		return validateAddress(chain, address);
	}

	// Get wallet address for a currency symbol
	function getWalletAddress(symbol: string): string {
		const crypto = currencies.find(c => c.symbol === symbol);
		return crypto?.address || '';
	}

	// Register test command globally (available as soon as component loads)
	if (typeof window !== 'undefined') {
		(window as any).teststatus = (testStatus = 'exchanging') => {
			exchangeId = 'test-' + Math.random().toString(36).substr(2, 9);
			fromAmount = '0.001';
			toAmount = '0.015';
			fromCurrency = 'BTC';
			toCurrency = 'ETH';
			view = 'status';
			status = testStatus;
			const statusMessages: Record<string, string> = {
				'waiting': 'Waiting for deposit confirmation...',
				'confirming': 'Confirming your transaction on the blockchain...',
				'exchanging': 'Exchanging your crypto...',
				'sending': 'Sending ETH to your wallet...',
				'finished': '🎉 Exchange complete!',
				'failed': 'Exchange failed. Please try again.'
			};
			statusMessage = statusMessages[testStatus] || 'Exchanging your crypto...';
			console.log('✅ Test status view activated! Exchange ID:', exchangeId);
			console.log('Available statuses: waiting, confirming, exchanging, sending, finished, failed');
		};
		console.log('💡 Test command available: teststatus("status")');
	}

	// Reactive auth guard
	$: if (!$isUnlocked) {
		goto('/unlock');
	}

	onMount(() => {
		if (!$isUnlocked) return;

		// Cleanup function
		return () => {
			if (checkInterval !== null) {
				clearInterval(checkInterval);
				checkInterval = null;
			}
			if (countdownInterval !== null) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
			if (estimateTimeout !== null) {
				clearTimeout(estimateTimeout);
				estimateTimeout = null;
			}
		};
	});

	async function updateFromAmount(value: string) {
		if (value && !/^\d*\.?\d*$/.test(value)) return;
		
		fromAmount = value;
		error = '';

		if (estimateTimeout) clearTimeout(estimateTimeout);

		if (value && parseFloat(value) > 0) {
			if (parseFloat(value) < minAmount) {
				error = `Minimum amount is ${minAmount} ${fromCurrency}`;
				toAmount = '';
				return;
			}

			estimateTimeout = setTimeout(async () => {
				estimating = true;
				const fromCode = changeNowService.getCurrencyCode(fromCurrency);
				const toCode = changeNowService.getCurrencyCode(toCurrency);
				const estimate = await changeNowService.getEstimate(fromCode, toCode, value);
				
				if (estimate?.toAmount) {
					toAmount = estimate.toAmount;
				} else {
					toAmount = '';
				}
				estimating = false;
			}, 500);
		} else {
			toAmount = '';
		}
	}

	function swapCurrencies() {
		const temp = fromCurrency;
		fromCurrency = toCurrency;
		toCurrency = temp;
		fromAmount = '';
		toAmount = '';
	}

	async function initiateExchange() {
		if (countdown > 0) {
			if (countdownInterval !== null) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
			countdown = 0;
			return;
		}

		countdown = 5;
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				if (countdownInterval !== null) {
					clearInterval(countdownInterval);
					countdownInterval = null;
				}
				executeExchange();
			}
		}, 1000);
	}

	async function executeExchange() {
		try {
			error = '';
			sending = true;

			// Check balance
			const userBalance = parseFloat(fromCrypto?.balance || '0');
			const sendAmount = parseFloat(fromAmount);

			if (sendAmount > userBalance) {
				error = `Insufficient balance. You have ${userBalance} ${fromCurrency} but trying to send ${sendAmount} ${fromCurrency}`;
				sending = false;
				return;
			}

			// Get recipient address
			const recipientAddr = customAddress ? recipientAddress : getWalletAddress(toCurrency);
			
			if (!recipientAddr) {
				error = 'Could not get recipient address';
				sending = false;
				return;
			}

			// Validate custom address
			if (customAddress && !isValidAddress(recipientAddress, toCurrency)) {
				error = `Invalid ${toCurrency} address format`;
				sending = false;
				return;
			}

			const refundAddr = getWalletAddress(fromCurrency);
			if (!refundAddr) {
				error = 'Could not get refund address';
				sending = false;
				return;
			}

			// Create exchange via ChangeNow (correct param order from old version)
			const fromCode = changeNowService.getCurrencyCode(fromCurrency);
			const toCode = changeNowService.getCurrencyCode(toCurrency);

			console.log('Creating exchange:', {
				from: fromCode,
				to: toCode,
				amount: fromAmount,
				toAddress: recipientAddr,
				refundAddress: refundAddr
			});
			
			const result = await changeNowService.createExchange(
				fromCode,
				toCode,
				fromAmount,
				recipientAddr,
				refundAddr
			);

			console.log('Exchange response:', result);
			
			if (!result || !result.id) {
				error = (result as any)?.error || 'Failed to create exchange';
				sending = false;
				return;
			}

			// Auto-send the crypto to ChangeNow (ported from old version)
			await autoSendToExchange(result);
			
		} catch (err: any) {
			error = err.message || 'Failed to create exchange';
			sending = false;
		}
	}

	async function autoSendToExchange(exchange: any) {
		try {
			const amount = fromAmount; // Use user's input amount
			const toAddr = exchange.payinAddress;

			// Validate the exchange response matches user's intent
			if (parseFloat(exchange.fromAmount) !== parseFloat(amount)) {
				throw new Error('Exchange amount mismatch. Please try again.');
			}

			// Validate payin address format
			if (!isValidAddress(toAddr, fromCurrency)) {
				throw new Error('Invalid payin address from exchange service');
			}

			// Send using the unified send service
			const chain = SYMBOL_TO_CHAIN[fromCurrency];
			if (!chain) {
				throw new Error(`Unsupported currency: ${fromCurrency}`);
			}

			console.log('Auto-sending to exchange:', { chain, toAddr, amount });

			const hash = await sendTransaction({
				chain,
				toAddress: toAddr,
				amount
			});

			if (hash) {
				// Switch to status view
				exchangeId = exchange.id;
				txHash = hash;
				payinAddress = toAddr;
				view = 'status';
				status = 'confirming';
				statusMessage = 'Confirming your transaction on the blockchain...';
				sending = false;

				// Start checking status
				checkStatus();
				checkInterval = setInterval(checkStatus, 10000);
			} else {
				throw new Error('Failed to send transaction');
			}
		} catch (err: any) {
			console.error('Auto-send failed:', err);
			sending = false;

			let errorMsg = err.message;
			if (errorMsg.includes('No UTXOs available')) {
				errorMsg = `Your ${fromCurrency} wallet is empty or has no confirmed transactions. Please add funds first.`;
			} else if (errorMsg.includes('Insufficient balance')) {
				errorMsg = `Insufficient ${fromCurrency} balance.`;
			}

			error = `Failed to send: ${errorMsg}`;
			
			// If exchange was created but send failed, show the manual send info
			if (exchange.payinAddress) {
				error += `\n\nExchange created but not funded. You can manually send ${fromAmount} ${fromCurrency} to: ${exchange.payinAddress}`;
			}
		}
	}

	async function checkStatus() {
		try {
			const result = await changeNowService.getExchangeStatus(exchangeId);
			
			if (!result) return;

			if (result.status === 'waiting') {
				status = 'waiting';
				statusMessage = 'Waiting for deposit confirmation...';
			} else if (result.status === 'confirming') {
				status = 'confirming';
				statusMessage = 'Confirming your transaction...';
				txHash = result.payinHash || txHash;
			} else if (result.status === 'exchanging') {
				status = 'exchanging';
				statusMessage = 'Exchanging your crypto...';
			} else if (result.status === 'sending') {
				status = 'sending';
				statusMessage = `Sending ${toCurrency} to your wallet...`;
			} else if (result.status === 'finished') {
				status = 'finished';
				statusMessage = '🎉 Exchange complete!';
				txHash = result.payoutHash || result.payinHash || txHash;
				
				await walletService.fetchBalances();
				
				if (checkInterval !== null) {
					clearInterval(checkInterval);
					checkInterval = null;
				}
			} else if (result.status === 'failed' || result.status === 'refunded') {
				status = 'failed';
				statusMessage = 'Exchange failed or refunded';
				
				if (checkInterval !== null) {
					clearInterval(checkInterval);
					checkInterval = null;
				}
			}
		} catch (error) {
			console.error('Failed to check status:', error);
		}
	}

	async function copyToClipboard(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	// Stress handler with cat modal (ported from old version)
	function handleStress() {
		stressClicks++;

		const messages = [
			"It's okay! Crypto exchanges take time ⏰",
			"Your funds are safe with ChangeNow 🔒",
			"Deep breaths... it'll be done soon 🧘",
			"Go grab a coffee, you deserve it ☕",
			"Blockchain confirmations are slow but secure 🛡️",
			"Trust the process! 💪",
			"Your crypto is on its way! 🚀",
			"Patience is a virtue... and profitable 💰"
		];

		catMessage = messages[Math.floor(Math.random() * messages.length)];
		catImageUrl = `https://cataas.com/cat?${Date.now()}`;
		showCatModal = true;
	}

	function closeCatModal() {
		showCatModal = false;
	}

	function backToForm() {
		view = 'form';
		if (checkInterval !== null) {
			clearInterval(checkInterval);
			checkInterval = null;
		}
		fromAmount = '';
		toAmount = '';
		error = '';
		sending = false;
	}

	function lockWallet() {
		walletService.lock();
		goto('/unlock');
	}
</script>

<div class="min-h-screen bg-[#070b10] flex flex-col">
	<!-- Top Nav -->
	<nav class="flex items-center justify-between px-4 md:px-6 py-4 bg-stone-900/50 backdrop-blur-xl border-b border-white/5">
		<div class="flex items-center gap-8">
			<div class="flex items-center gap-2">
				<span class="text-xl">⬢</span>
				<span class="font-bold text-white">Rivara</span>
			</div>
			<div class="hidden md:flex gap-6">
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/wallet')}>Wallets</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/portfolio')}>Portfolio</button>
				<button class="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b-2 border-cyan-500 pb-1">Exchange</button>
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/settings')}>Settings</button>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={() => goto('/settings')}>
				<Settings size={18} />
			</button>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={lockWallet}>
				<Lock size={18} />
			</button>
		</div>
	</nav>

	<!-- Main Content -->
	<div class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
	<div class="flex items-center justify-center min-h-full">
		{#if view === 'form'}
			<!-- Exchange Form View -->
			<div class="w-full max-w-6xl grid md:grid-cols-[1fr,400px] gap-6">
				<!-- Exchange Form -->
				<div class="space-y-6">
					<!-- From Section -->
					<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
						<div class="flex items-center justify-between mb-4 flex-wrap gap-1">
							<h3 class="text-white font-semibold">You Send</h3>
							<span class="text-xs md:text-sm text-slate-400">{fromCrypto?.balance || '0'} {fromCurrency} available</span>
						</div>
						<div class="flex flex-col sm:flex-row gap-3">
							<input 
								type="text"
								inputmode="decimal"
								class="flex-1 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white text-lg md:text-xl placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none {error ? 'border-red-500' : ''}"
								placeholder="0.00"
								value={fromAmount}
								on:input={(e) => updateFromAmount(e.currentTarget.value)}
							/>
							<select 
								class="px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none w-full sm:w-auto"
								bind:value={fromCurrency}
								on:change={() => updateFromAmount(fromAmount)}
							>
								{#each currencies as currency}
									<option value={currency.symbol}>{currency.symbol} — {currency.name}</option>
								{/each}
							</select>
						</div>
						{#if error}
							<div class="mt-2 text-sm text-red-400 whitespace-pre-line">{error}</div>
						{/if}
						{#if !error && minAmount > 0}
							<div class="mt-2 text-sm text-slate-500">Minimum: {minAmount} {fromCurrency}</div>
						{/if}
					</div>

					<!-- Swap Button -->
					<div class="flex justify-center">
						<button 
							class="p-3 bg-stone-800/50 border border-white/10 rounded-full text-white hover:bg-stone-700/50 transition"
							on:click={swapCurrencies}
						>
							<ArrowDownUp size={20} />
						</button>
					</div>

					<!-- To Section -->
					<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
						<div class="flex items-center justify-between mb-4 flex-wrap gap-1">
							<h3 class="text-white font-semibold">You Receive</h3>
							<span class="text-xs md:text-sm text-slate-400 truncate max-w-[200px]">
								To: {customAddress ? (recipientAddress ? recipientAddress.slice(0, 12) + '...' + recipientAddress.slice(-8) : 'Enter address') : 'My Wallet'}
							</span>
						</div>
						<div class="flex flex-col sm:flex-row gap-3">
							<input 
								type="text"
								class="flex-1 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white text-lg md:text-xl placeholder-slate-600 outline-none"
								placeholder="0.00"
								value={toAmount}
								readonly
							/>
							<select 
								class="px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none w-full sm:w-auto"
								bind:value={toCurrency}
								on:change={() => updateFromAmount(fromAmount)}
							>
								{#each currencies as currency}
									<option value={currency.symbol}>{currency.symbol} — {currency.name}</option>
								{/each}
							</select>
						</div>
						
						<div class="mt-4">
							<label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
								<input type="checkbox" bind:checked={customAddress} class="rounded" />
								<span>Send to a different address</span>
							</label>
						</div>

						{#if customAddress}
							<input 
								type="text"
								class="mt-3 w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
								placeholder="Paste {toCurrency} address"
								bind:value={recipientAddress}
							/>
						{/if}
					</div>
				</div>

				<!-- Exchange Details Sidebar -->
				<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 h-fit">
					<h4 class="text-white font-semibold mb-4">Exchange Details</h4>
					
					{#if toAmount && fromAmount}
						<div class="space-y-3 mb-6">
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">Rate</span>
								<span class="text-white">1 {fromCurrency} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toCurrency}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">You Send</span>
								<span class="text-white">{fromAmount} {fromCurrency}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">You Receive</span>
								<span class="text-white">{toAmount} {toCurrency}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">Network Fee</span>
								<span class="text-white">Included</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">Est. Time</span>
								<span class="text-white">5-30 min</span>
							</div>
						</div>
					{:else}
						<div class="text-center text-slate-500 text-sm py-8 mb-6">
							Enter an amount to see exchange details
						</div>
					{/if}

					<button 
						class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!canExchange}
						on:click={initiateExchange}
					>
						{#if sending}
							Sending transaction...
						{:else if countdown > 0}
							Cancel ({countdown}s)
						{:else if fromAmount}
							Exchange Now
						{:else}
							Enter Amount
						{/if}
					</button>

					<div class="mt-4 text-center text-xs text-slate-500">
						Powered by ChangeNow
					</div>
				</div>
			</div>
		{:else}
			<!-- Exchange Status View -->
			<div class="w-full max-w-3xl">
				<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-8 shadow-2xl">
					<!-- Header -->
					<div class="text-center mb-6 md:mb-8">
						<h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Exchange in Progress</h1>
						<p class="text-slate-400">{statusMessage}</p>
					</div>

					<!-- Progress Bar -->
					<div class="mb-8">
						<div class="relative h-2 bg-stone-800 rounded-full overflow-hidden mb-6">
							<div 
								class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-600 transition-all duration-500 ease-out"
								style="width: {progress}%"
							></div>
						</div>

						<!-- Steps -->
						<div class="flex justify-between">
							{#each steps as step, index}
								<div class="flex flex-col items-center flex-1">
									<div 
										class="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-2xl mb-1 md:mb-2 transition-all duration-300 {
											index <= currentStepIndex 
												? 'bg-gradient-to-r from-cyan-600 to-cyan-600 scale-110' 
												: 'bg-stone-800'
										}"
									>
										{step.icon}
									</div>
									<div class="text-[10px] md:text-xs font-medium {index <= currentStepIndex ? 'text-white' : 'text-slate-500'} text-center">
										{step.label}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Exchange Details -->
					<div class="bg-black/20 border border-white/5 rounded-xl p-4 md:p-6 mb-6 space-y-3 md:space-y-4">
						<div class="flex justify-between items-center gap-2">
							<span class="text-slate-400 text-sm shrink-0">Exchange ID</span>
							<div class="flex items-center gap-2 min-w-0">
								<span class="text-white font-mono text-xs md:text-sm truncate">{exchangeId}</span>
								<button 
									class="p-1 hover:bg-white/5 rounded transition"
									on:click={() => copyToClipboard(exchangeId)}
								>
									{#if copied}
										<Check size={16} class="text-green-400" />
									{:else}
										<Copy size={16} class="text-slate-400" />
									{/if}
								</button>
							</div>
						</div>

						{#if txHash}
							<div class="flex justify-between items-center gap-2">
								<span class="text-slate-400 text-sm shrink-0">Transaction</span>
								<span class="text-white font-mono text-xs md:text-sm truncate">{txHash.slice(0, 8)}...{txHash.slice(-8)}</span>
							</div>
						{/if}

						<div class="flex justify-between items-center">
							<span class="text-slate-400 text-sm">Sending</span>
							<span class="text-white font-semibold text-sm">{fromAmount} {fromCurrency}</span>
						</div>

						<div class="flex justify-between items-center">
							<span class="text-slate-400 text-sm">Receiving</span>
							<span class="text-white font-semibold text-sm">{toAmount} {toCurrency}</span>
						</div>

						<div class="flex justify-between items-center gap-2">
							<span class="text-slate-400 text-sm shrink-0">To Address</span>
							<span class="text-white font-mono text-xs md:text-sm truncate">{(customAddress ? recipientAddress : toCrypto?.address || '').slice(0, 8)}...{(customAddress ? recipientAddress : toCrypto?.address || '').slice(-6)}</span>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="space-y-3">
						{#if status === 'finished'}
							<button 
								class="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/25"
								on:click={() => goto('/wallet')}
							>
								✅ View Wallet
							</button>
						{:else if status === 'failed'}
							<button 
								class="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/25"
								on:click={backToForm}
							>
								❌ Try Again
							</button>
						{:else}
							<button 
								class="w-full py-4 bg-stone-800 border border-white/10 text-white font-medium rounded-xl hover:bg-stone-700 transition-all"
								on:click={handleStress}
							>
								😰 Click if stressed
							</button>
						{/if}

						<a 
							href="https://changenow.io/exchange/txs/{exchangeId}" 
							target="_blank"
							class="flex items-center justify-center gap-2 w-full py-3 bg-black/20 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-black/40 transition-all"
						>
							<ExternalLink size={18} />
							View on ChangeNOW
						</a>
					</div>
				</div>

				<!-- Info Box -->
				<div class="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
					<p class="text-cyan-200 text-sm text-center">
						💡 Exchanges typically take 5-30 minutes depending on network congestion
					</p>
				</div>
			</div>
		{/if}
	</div>
	</div>
</div>

<!-- Cat Modal (ported from old version stress handler) -->
{#if showCatModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" on:click={closeCatModal}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" on:click|stopPropagation>
			<button class="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl" on:click={closeCatModal}>×</button>
			<h2 class="text-2xl font-bold text-white text-center mb-2">Take a deep breath 🐱</h2>
			<p class="text-slate-300 text-center mb-4">{catMessage}</p>
			<img src={catImageUrl} alt="Calming cat" class="w-full rounded-xl mb-4 max-h-64 object-cover" />
			<button 
				class="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all"
				on:click={closeCatModal}
			>
				I feel better now
			</button>
		</div>
	</div>
{/if}

<!-- Mobile Bottom Nav -->
<div class="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-xl border-t border-white/10 md:hidden z-50">
	<div class="grid grid-cols-4 p-2">
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/wallet')}>
			<Wallet size={24} /><span class="text-xs">Wallet</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/portfolio')}>
			<TrendingUp size={24} /><span class="text-xs">Portfolio</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-cyan-400">
			<RefreshCw size={24} /><span class="text-xs font-medium">Swap</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/settings')}>
			<Settings size={24} /><span class="text-xs">Settings</span>
		</button>
	</div>
</div>
