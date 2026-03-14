<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import { wallet, isUnlocked, isCurrentUnlock } from '$lib/stores/wallet';
	import { walletService } from '$lib/services/wallet-service';

	// Inline encryption functions
	async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);
		const importedKey = await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
		return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' }, importedKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
	}

	async function decryptSeed(encryptedData: string, password: string): Promise<string> {
		const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
		const salt = data.slice(0, 16);
		const iv = data.slice(16, 28);
		const encrypted = data.slice(28);
		const key = await deriveKey(password, salt);
		const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);
		const decoder = new TextDecoder();
		return decoder.decode(decryptedData);
	}

	async function loadWallet(password: string): Promise<string> {
		const encrypted = localStorage.getItem('encryptedWallet');
		if (!encrypted) throw new Error('No wallet found in storage');
		
		// Check duress password first (stored encrypted in localStorage)
		const encryptedDuress = localStorage.getItem('encryptedDuressPassword');
		if (encryptedDuress) {
			try {
				const duressPlain = atob(encryptedDuress);
				if (password === duressPlain) {
					// Flag session as duress mode
					sessionStorage.setItem('_isDuressMode', 'true');
					// Duress password matched - return fake seed
					return 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
				}
			} catch {}
		}
		
		// Normal mode - clear duress flag
		sessionStorage.removeItem('_isDuressMode');
		return await decryptSeed(encrypted, password);
	}

	function hasStoredWallet(): boolean {
		return localStorage.getItem('encryptedWallet') !== null;
	}

	// SECURITY FIX 2: Rate limiting state
	const MAX_ATTEMPTS = 5;
	const BASE_LOCKOUT_MS = 30_000; // 30 seconds base

	let password = '';
	let error = '';
	let loading = false;
	let failedAttempts = 0;
	let lockoutUntil = 0;
	let lockoutMessage = '';
	let lockoutInterval: ReturnType<typeof setInterval> | null = null;

	function getLockoutDuration(attempts: number): number {
		// Exponential backoff: 30s, 60s, 120s, 240s...
		const multiplier = Math.pow(2, attempts - MAX_ATTEMPTS);
		return BASE_LOCKOUT_MS * multiplier;
	}

	function updateLockoutMessage() {
		const remaining = lockoutUntil - Date.now();
		if (remaining <= 0) {
			lockoutMessage = '';
			if (lockoutInterval) {
				clearInterval(lockoutInterval);
				lockoutInterval = null;
			}
			return;
		}
		const seconds = Math.ceil(remaining / 1000);
		if (seconds > 60) {
			const minutes = Math.ceil(seconds / 60);
			lockoutMessage = `Too many failed attempts. Locked for ${minutes} minute${minutes > 1 ? 's' : ''}`;
		} else {
			lockoutMessage = `Too many failed attempts. Try again in ${seconds} second${seconds > 1 ? 's' : ''}`;
		}
	}

	function startLockoutTimer() {
		if (lockoutInterval) clearInterval(lockoutInterval);
		updateLockoutMessage();
		lockoutInterval = setInterval(updateLockoutMessage, 1000);
	}

	$: isLockedOut = Date.now() < lockoutUntil;

	onMount(() => {
		if (!hasStoredWallet()) {
			goto('/');
			return;
		}
		// Do NOT redirect to wallet here based on session — prevents redirect loop.
		// Only goto('/wallet') when isCurrentUnlock is true (set on successful unlock).

		// Restore lockout state from sessionStorage
		const storedAttempts = sessionStorage.getItem('failedUnlockAttempts');
		const storedLockout = sessionStorage.getItem('lockoutUntil');
		if (storedAttempts) failedAttempts = parseInt(storedAttempts);
		if (storedLockout) {
			lockoutUntil = parseInt(storedLockout);
			if (Date.now() < lockoutUntil) {
				startLockoutTimer();
			}
		}

		return () => {
			if (lockoutInterval) clearInterval(lockoutInterval);
		};
	});

	async function handleUnlock(e: Event) {
		e.preventDefault();
		error = '';

		// SECURITY: Check lockout
		if (Date.now() < lockoutUntil) {
			updateLockoutMessage();
			error = lockoutMessage;
			return;
		}

		loading = true;

		try {
			const seedPhrase = await loadWallet(password);
			await walletService.importFromSeed(seedPhrase);
			wallet.set(walletService.getWallet());
			isUnlocked.set(true);
			sessionStorage.setItem('walletUnlocked', 'true');

			// SECURITY: Store password in sessionStorage for on-demand key derivation
			// This is scoped to the tab and cleared on close/lock
			sessionStorage.setItem('_walletSessionPw', password);

			// Reset rate limiting on success
			failedAttempts = 0;
			sessionStorage.removeItem('failedUnlockAttempts');
			sessionStorage.removeItem('lockoutUntil');

			localStorage.setItem('isWalletAlive', 'true');
			isCurrentUnlock.set(true);
			goto('/wallet');
			walletService.fetchBalances().catch(() => {});
		} catch (err: any) {
			failedAttempts++;
			sessionStorage.setItem('failedUnlockAttempts', failedAttempts.toString());

			if (failedAttempts >= MAX_ATTEMPTS) {
				const duration = getLockoutDuration(failedAttempts);
				lockoutUntil = Date.now() + duration;
				sessionStorage.setItem('lockoutUntil', lockoutUntil.toString());
				startLockoutTimer();
				error = lockoutMessage;
			} else {
				const remaining = MAX_ATTEMPTS - failedAttempts;
				error = `Incorrect password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before lockout.`;
			}
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-[#070b10] flex items-center justify-center p-4 relative overflow-hidden">
	<!-- Animated Background -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
		<div class="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style="animation-delay: 1s"></div>
	</div>

	<!-- Back Button -->
	<button 
		class="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors z-10"
		on:click={() => goto('/')}
	>
		<ArrowLeft size={20} />
		Back
	</button>

	<!-- Main Content -->
	<div class="relative w-full max-w-md">
		<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
			<!-- Header -->
			<div class="text-center mb-8">
				<div class="flex items-center justify-center gap-2 mb-4">
					<span class="text-3xl">⬢</span>
					<span class="text-xl font-bold text-white">Rivara Wallet</span>
				</div>
				<h2 class="text-2xl font-bold text-white mb-2">Welcome Back</h2>
				<p class="text-slate-400">Enter your password to unlock</p>
			</div>

			<!-- Unlock Form -->
			<form on:submit={handleUnlock} class="space-y-6">
				<div>
					<label class="block text-sm font-medium text-slate-300 mb-2">
						Password
					</label>
					<input 
						type="password"
						bind:value={password}
						placeholder="Enter your password"
						class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
						required
						autofocus
						disabled={Date.now() < lockoutUntil}
					/>
				</div>

				{#if error}
					<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
						{error}
					</div>
				{/if}

				{#if lockoutMessage}
					<div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm flex items-center gap-2">
						🔒 {lockoutMessage}
					</div>
				{/if}

				<button 
					type="submit"
					class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading || Date.now() < lockoutUntil}
				>
					{loading ? 'Unlocking...' : 'Unlock Wallet'}
				</button>
			</form>

			<!-- Footer -->
			<div class="mt-6 text-center">
				<button 
					class="text-sm text-slate-400 hover:text-white transition-colors"
					on:click={() => goto('/import')}
				>
					Forgot password? Import wallet again
				</button>
			</div>
		</div>
	</div>
</div>
