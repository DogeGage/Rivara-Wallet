<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import { walletService } from '$lib/services/wallet-service';
	import { tuffbackupService } from '$lib/services/tuffbackup-service';

	// SECURITY FIX 2: Password strength validation
	function validatePasswordStrength(pw: string): string | null {
		if (pw.length < 12) return 'Password must be at least 12 characters';
		if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
		if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
		if (!/[0-9]/.test(pw)) return 'Password must include a number';
		if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include a symbol (!@#$%^&*...)';
		return null;
	}

	let step = 1; // 1: choose method, 2: seed phrase, 3: tuffbackup
	let seedPhrase = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;
	let backupFile: File | null = null;
	let fileInput: HTMLInputElement;

	function goBack() {
		if (step === 1) {
			goto('/');
		} else {
			step = 1;
		}
	}

	function showSeedImport() {
		step = 2;
	}

	function showTuffbackupImport() {
		step = 3;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			backupFile = target.files[0];
			error = '';
		}
	}

	async function handleTuffbackupImport(e: Event) {
		e.preventDefault();
		error = '';

		if (!backupFile) {
			error = 'Please select a backup file';
			return;
		}

		const pwError1 = validatePasswordStrength(password);
		if (pwError1) {
			error = pwError1;
			return;
		}

		loading = true;

		try {
			// Validate file first
			const validation = await tuffbackupService.validateBackupFile(backupFile);
			if (!validation.valid) {
				error = 'Invalid backup file format';
				loading = false;
				return;
			}

			// Restore backup
			const success = await tuffbackupService.restoreBackup(backupFile, password);
			
			if (!success) {
				error = 'Invalid password or corrupted backup file';
				loading = false;
				return;
			}

			// Redirect to unlock page
			localStorage.setItem('isWalletAlive', 'true');
			goto('/unlock');
		} catch (err: any) {
			error = err.message || 'Failed to restore backup';
		} finally {
			loading = false;
		}
	}

	async function handleImport(e: Event) {
		e.preventDefault();
		error = '';

		// Validate seed phrase
		const words = seedPhrase.trim().split(/\s+/);
		if (words.length !== 12 && words.length !== 24) {
			error = 'Seed phrase must be 12 or 24 words';
			return;
		}

		// SECURITY: Validate password strength
		const pwError2 = validatePasswordStrength(password);
		if (pwError2) {
			error = pwError2;
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		try {
			// First encrypt and save the seed phrase
			const { encryptionService } = await import('$lib/services/encryption-service');
			await encryptionService.saveWallet(seedPhrase.trim(), password);
			
			// Then import and derive addresses
			await walletService.importFromSeed(seedPhrase.trim());
			// SECURITY: Store password for on-demand key derivation
			sessionStorage.setItem('_walletSessionPw', password);
			localStorage.setItem('isWalletAlive', 'true');
			goto('/wallet');
		} catch (err: any) {
			error = err.message || 'Failed to import wallet';
		} finally {
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
		on:click={goBack}
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
				<h2 class="text-2xl font-bold text-white mb-2">
					{step === 1 ? 'Import Wallet' : step === 2 ? 'Enter Seed Phrase' : 'Restore Tuffbackup'}
				</h2>
				<p class="text-slate-400">
					{step === 1 ? 'Choose import method' : step === 2 ? 'Enter your 12 or 24 word seed phrase' : 'Upload your .rivara or .dogegage backup file'}
				</p>
			</div>

			{#if step === 1}
				<!-- Step 1: Choose Method -->
				<div class="space-y-4">
					<button 
						class="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25"
						on:click={showSeedImport}
					>
						🌱 Import with Seed Phrase
					</button>

					<button 
						class="w-full py-4 bg-stone-800/50 border border-white/10 text-white font-medium rounded-xl hover:bg-stone-700/50 transition-all"
						on:click={showTuffbackupImport}
					>
						💾 Import Tuffbackup File
					</button>

					<p class="text-center text-slate-500 text-sm mt-6">
						Tuffbackup is faster and easier than typing your seed phrase
					</p>
				</div>
			{:else if step === 2}
				<!-- Step 2: Enter Seed Phrase -->
				<form on:submit={handleImport} class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Seed Phrase
						</label>
						<textarea 
							bind:value={seedPhrase}
							placeholder="Enter your 12 or 24 word seed phrase"
							rows="4"
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none resize-none"
							required
						></textarea>
						<p class="text-xs text-slate-500 mt-1">Separate words with spaces</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Password
						</label>
						<input 
							type="password"
							bind:value={password}
							placeholder="Create a strong password"
							minlength="12"
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
							required
						/>
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
							minlength="8"
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
						{loading ? 'Importing...' : 'Import Wallet'}
					</button>
				</form>
			{:else}
				<!-- Step 3: Tuffbackup Import -->
				<form on:submit={handleTuffbackupImport} class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Backup File
						</label>
						<input 
							type="file"
							accept=".rivara,.dogegage"
							bind:this={fileInput}
							on:change={handleFileSelect}
							class="hidden"
						/>
						<button
							type="button"
							on:click={() => fileInput.click()}
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-slate-400 hover:border-cyan-500 hover:bg-black/40 transition-all text-left"
						>
							{backupFile ? backupFile.name : 'Choose .rivara or .dogegage file...'}
						</button>
						<p class="text-xs text-slate-500 mt-1">Select your Tuffbackup file</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-300 mb-2">
							Password
						</label>
						<input 
							type="password"
							bind:value={password}
							placeholder="Enter your wallet password"
							minlength="8"
							class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:bg-black/40 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none"
							required
						/>
						<p class="text-xs text-slate-500 mt-1">The password you used when creating the backup</p>
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
						{loading ? 'Restoring...' : 'Restore Wallet'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
