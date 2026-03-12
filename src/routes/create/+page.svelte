<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Copy, Check } from 'lucide-svelte';
	import { walletService } from '$lib/services/wallet-service';
	import { onMount } from 'svelte';

	// Inline encryption functions
	async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);
		const importedKey = await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
		return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' }, importedKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
	}

	async function encryptSeed(seedPhrase: string, password: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(seedPhrase);
		const salt = crypto.getRandomValues(new Uint8Array(16));
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const key = await deriveKey(password, salt);
		const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
		const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
		result.set(salt, 0);
		result.set(iv, salt.length);
		result.set(new Uint8Array(encryptedData), salt.length + iv.length);
		return btoa(String.fromCharCode(...result));
	}

	async function saveWallet(seedPhrase: string, password: string): Promise<void> {
		const encrypted = await encryptSeed(seedPhrase, password);
		localStorage.setItem('encryptedWallet', encrypted);
	}

	// SECURITY FIX 2: Password strength validation
	function validatePasswordStrength(pw: string): string | null {
		if (pw.length < 12) return 'Password must be at least 12 characters';
		if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
		if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
		if (!/[0-9]/.test(pw)) return 'Password must include a number';
		if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include a symbol (!@#$%^&*...)';
		return null;
	}

	function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
		let score = 0;
		if (pw.length >= 12) score++;
		if (pw.length >= 16) score++;
		if (/[A-Z]/.test(pw)) score++;
		if (/[a-z]/.test(pw)) score++;
		if (/[0-9]/.test(pw)) score++;
		if (/[^A-Za-z0-9]/.test(pw)) score++;
		
		if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
		if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' };
		if (score <= 5) return { score, label: 'Strong', color: 'bg-cyan-500' };
		return { score, label: 'Very Strong', color: 'bg-green-500' };
	}

	let dev = false; // Disable dev mode
	let step = 1;
	let password = '';
	let confirmPassword = '';
	let generatedMnemonic = '';
	let error = '';
	let loading = false;
	let copied = false;

	let verifyIndices: number[] = [];
	let verifyInputs: string[] = ['', '', ''];

	$: passwordStrength = getPasswordStrength(password);

	function goBack() {
		if (step === 1) {
			goto('/');
		} else if (step === 2) {
			step = 1;
		} else {
			step = 2;
		}
	}

	async function generateWallet() {
		error = '';

		// SECURITY: Enforce strong password
		const pwError = validatePasswordStrength(password);
		if (pwError) {
			error = pwError;
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		try {
			// Wait for crypto libraries to load
			let attempts = 0;
			while (!window.cryptoLibs && attempts < 50) {
				await new Promise(resolve => setTimeout(resolve, 100));
				attempts++;
			}

			// @ts-ignore
			if (!window.cryptoLibs) {
				throw new Error('Crypto libraries not loaded. Please refresh the page.');
			}

			// @ts-ignore
			const { ethers } = window.cryptoLibs;

			// Generate random mnemonic
			const wallet = ethers.Wallet.createRandom();
			generatedMnemonic = wallet.mnemonic.phrase;

			// Generate 3 random indices for verification
			verifyIndices = [];
			while (verifyIndices.length < 3) {
				const idx = Math.floor(Math.random() * 12);
				if (!verifyIndices.includes(idx)) {
					verifyIndices.push(idx);
				}
			}
			verifyIndices.sort((a, b) => a - b);

			step = 2;
		} catch (err: any) {
			error = err.message || 'Failed to generate wallet';
		} finally {
			loading = false;
		}
	}

	async function copySeed() {
		await navigator.clipboard.writeText(generatedMnemonic);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function continueToVerify() {
		verifyInputs = ['', '', ''];
		step = 3;
	}

	async function createWalletDirectly() {
		loading = true;
		try {
			await walletService.importFromSeed(generatedMnemonic);
			await saveWallet(generatedMnemonic, password);
			sessionStorage.setItem('walletUnlocked', 'true');
			// SECURITY: Store password for on-demand key derivation
			sessionStorage.setItem('_walletSessionPw', password);
			localStorage.setItem('isWalletAlive', 'true');
			goto('/wallet');
		} catch (err: any) {
			error = err.message || 'Failed to create wallet';
		} finally {
			loading = false;
		}
	}

	async function verifyAndCreate() {
		error = '';
		const words = generatedMnemonic.split(' ');
		let correct = true;

		for (let i = 0; i < verifyIndices.length; i++) {
			const expected = words[verifyIndices[i]].toLowerCase();
			const input = verifyInputs[i].trim().toLowerCase();
			if (input !== expected) {
				correct = false;
				break;
			}
		}

		if (!correct) {
			error = 'Words do not match. Please check your seed phrase and try again.';
			return;
		}

		loading = true;
		try {
			await walletService.importFromSeed(generatedMnemonic);
			await saveWallet(generatedMnemonic, password);
			sessionStorage.setItem('walletUnlocked', 'true');
			// SECURITY: Store password for on-demand key derivation
			sessionStorage.setItem('_walletSessionPw', password);
			localStorage.setItem('isWalletAlive', 'true');
			goto('/wallet');
		} catch (err: any) {
			error = err.message || 'Failed to create wallet';
		} finally {
			loading = false;
		}
	}

	$: mnemonicWords = generatedMnemonic ? generatedMnemonic.split(' ') : [];
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
		on:click={goBack}
	>
		<ArrowLeft size={20} />
		Back
	</button>

	<!-- Main Content -->
	<div class="relative w-full max-w-2xl">
		<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
			{#if step === 1}
				<!-- Step 1: Set Password -->
				<div class="text-center mb-8">
					<div class="flex items-center justify-center gap-2 mb-4">
						<span class="text-3xl">⬢</span>
						<span class="text-xl font-bold text-white">Rivara Wallet</span>
					</div>
					<h2 class="text-2xl font-bold text-white mb-2">Create New Wallet</h2>
					<p class="text-slate-400">Generate a new wallet with a secure seed phrase</p>
				</div>

				<div class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
					<div class="flex gap-3">
						<span class="text-2xl">⚠️</span>
						<div class="text-sm text-yellow-200">
							<strong>Important:</strong> Write down your seed phrase and keep it safe. You'll need it to recover your wallet. Never share it with anyone!
						</div>
					</div>
				</div>

				<form on:submit|preventDefault={generateWallet} class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Password
						</label>
						<input 
							type="password"
							bind:value={password}
							placeholder="Create a strong password (min 12 chars)"
							minlength="12"
							autocomplete="new-password"
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
							required
							autofocus
						/>
						<!-- Password Strength Indicator -->
						{#if password.length > 0}
							<div class="mt-2">
								<div class="flex gap-1 mb-1">
									{#each [1,2,3,4,5,6] as i}
										<div class="h-1 flex-1 rounded-full {i <= passwordStrength.score ? passwordStrength.color : 'bg-stone-700'}"></div>
									{/each}
								</div>
								<p class="text-xs {passwordStrength.score <= 2 ? 'text-red-400' : passwordStrength.score <= 4 ? 'text-yellow-400' : 'text-green-400'}">
									{passwordStrength.label}
								</p>
							</div>
						{/if}
						<p class="text-xs text-slate-500 mt-1">Min 12 chars: uppercase, lowercase, number, and symbol required</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Confirm Password
						</label>
						<input 
							type="password"
							bind:value={confirmPassword}
							placeholder="Confirm your password"
							minlength="12"
							autocomplete="new-password"
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
							required
						/>
					</div>

					{#if error}
						<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
							{error}
						</div>
					{/if}

					<button 
						type="submit"
						class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading}
					>
						{loading ? 'Generating...' : 'Generate Wallet'}
					</button>
				</form>

				<div class="mt-6 text-center text-sm text-slate-400">
					Already have a wallet? <button class="text-cyan-400 hover:underline" on:click={() => goto('/import')}>Import Wallet</button>
				</div>

			{:else if step === 2}
				<!-- Step 2: Show Seed Phrase -->
				<div class="text-center mb-8">
					<div class="flex items-center justify-center gap-2 mb-4">
						<span class="text-3xl">⬢</span>
						<span class="text-xl font-bold text-white">Rivara Wallet</span>
					</div>
					<h2 class="text-2xl font-bold text-white mb-2">Your Seed Phrase</h2>
					<p class="text-slate-400">Write this down and keep it safe!</p>
				</div>

				<div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
					<div class="flex gap-3">
						<span class="text-2xl">🔒</span>
						<div class="text-sm text-red-200">
							<strong>Never share your seed phrase!</strong><br/>
							Anyone with this phrase can access your funds.
						</div>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-3 mb-6">
					{#each mnemonicWords as word, i}
						<div class="p-3 bg-black/20 border border-white/10 rounded-lg">
							<div class="text-xs text-slate-500 mb-1">{i + 1}</div>
							<div class="text-white font-medium">{word}</div>
						</div>
					{/each}
				</div>

				<button 
					class="w-full py-3 mb-4 bg-stone-800/50 border border-white/10 text-white font-medium rounded-xl hover:bg-stone-700/50 transition-all flex items-center justify-center gap-2"
					on:click={copySeed}
				>
					{#if copied}
						<Check size={18} class="text-green-400" />
						Copied!
					{:else}
						<Copy size={18} />
						Copy to Clipboard
					{/if}
				</button>

				<button 
					class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25"
					on:click={continueToVerify}
				>
					I've Written It Down →
				</button>

			{:else}
				<!-- Step 3: Verify Seed Phrase -->
				<div class="text-center mb-8">
					<div class="flex items-center justify-center gap-2 mb-4">
						<span class="text-3xl">⬢</span>
						<span class="text-xl font-bold text-white">Rivara Wallet</span>
					</div>
					<h2 class="text-2xl font-bold text-white mb-2">Verify Seed Phrase</h2>
					<p class="text-slate-400">Fill in the missing words to verify you wrote it down</p>
				</div>

				<div class="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-center">
					<p class="text-sm text-cyan-200">
						Enter words #{verifyIndices.map(i => i + 1).join(', ')} from your seed phrase
					</p>
				</div>

				<div class="space-y-4 mb-6">
					{#each verifyIndices as idx, i}
						<div>
							<label class="block text-sm text-slate-400 mb-2">
								Word #{idx + 1}
							</label>
							<input
								type="text"
								bind:value={verifyInputs[i]}
								placeholder="Enter word #{idx + 1}"
								class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
								autocomplete="off"
								autocapitalize="off"
								spellcheck="false"
							/>
						</div>
					{/each}
				</div>

				{#if error}
					<div class="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
						{error}
					</div>
				{/if}

				<button 
					class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={verifyAndCreate}
					disabled={verifyInputs.some(w => !w.trim()) || loading}
				>
					{loading ? 'Creating Wallet...' : 'Create Wallet'}
				</button>
			{/if}
		</div>
	</div>
</div>
