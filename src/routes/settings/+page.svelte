<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Shield, Clock, Trash2, Eye, Key, Lock, Download, Wallet, TrendingUp, RefreshCw, FileText, ExternalLink, Settings } from 'lucide-svelte';
	import { tuffbackupService } from '$lib/services/tuffbackup-service';
	import { walletService } from '$lib/services/wallet-service';
	import { encryptionService } from '$lib/services/encryption-service';
	import { isUnlocked } from '$lib/stores/wallet';

	let activeTab = 'general';
	let showPasswordModal = false;
	let showRemoveModal = false;
	let showSeedModal = false;
	let password = '';
	let error = '';
	let success = '';
	let downloading = false;
	let seedPhrase = '';

	// Currency
	let selectedCurrency = 'USD';
	const currencies = [
		{ code: 'USD', symbol: '$' },
		{ code: 'EUR', symbol: '€' },
		{ code: 'GBP', symbol: '£' },
		{ code: 'CAD', symbol: '$' },
		{ code: 'AUD', symbol: '$' },
		{ code: 'JPY', symbol: '¥' },
		{ code: 'CHF', symbol: 'Fr' },
		{ code: 'CNY', symbol: '¥' },
		{ code: 'INR', symbol: '₹' },
		{ code: 'KRW', symbol: '₩' }
	];

	// Auto-lock settings
	let autoLockEnabled = true;
	let autoLockMinutes = 15;
	const lockTimeOptions = [5, 10, 15, 30, 60];

	const tabs = [
		{ id: 'general', label: 'General', icon: '⚙️' },
		{ id: 'security', label: 'Security', icon: '🔐' },
		{ id: 'backup', label: 'Backup & Recovery', icon: '💾' },
		{ id: 'privacy', label: 'Privacy', icon: '🛡️' },
		{ id: 'danger', label: 'Danger Zone', icon: '⚠️' }
	];

	$: if (!$isUnlocked) {
		goto('/unlock');
	}

	onMount(() => {
		if (!$isUnlocked) return;
		
		// Load currency preference
		const saved = localStorage.getItem('preferredCurrency');
		if (saved) selectedCurrency = saved;

		// Load auto-lock settings
		const savedEnabled = localStorage.getItem('autoLockEnabled');
		if (savedEnabled !== null) autoLockEnabled = savedEnabled === 'true';
		
		const savedDelay = localStorage.getItem('autoLockDelay');
		if (savedDelay) autoLockMinutes = parseInt(savedDelay) / 60 / 1000;
	});

	function setCurrency(val: string) {
		selectedCurrency = val;
		localStorage.setItem('preferredCurrency', val);
		success = `Currency changed to ${val}`;
		setTimeout(() => success = '', 2000);
	}

	async function initiateBackup() {
		showPasswordModal = true;
		error = '';
		password = '';
	}

	async function showSeed() {
		showSeedModal = true;
		error = '';
		password = '';
		seedPhrase = '';
	}

	async function revealSeed() {
		if (!password) { error = 'Please enter your password'; return; }
		try {
			const encrypted = localStorage.getItem('encryptedWallet');
			if (!encrypted) { error = 'No wallet found'; return; }
			seedPhrase = await encryptionService.decrypt(encrypted, password);
			password = '';
		} catch (err) { error = 'Invalid password'; }
	}

	async function downloadBackup() {
		if (!password) { error = 'Please enter your password'; return; }
		downloading = true;
		error = '';
		try {
			const encryptedWallet = localStorage.getItem('encryptedWallet');
			if (!encryptedWallet) { error = 'No wallet found'; downloading = false; return; }
			await encryptionService.decrypt(encryptedWallet, password);
			const result = await tuffbackupService.downloadBackup();
			if (result) {
				success = 'Backup downloaded successfully!';
				showPasswordModal = false;
				password = '';
				setTimeout(() => success = '', 3000);
			} else { error = 'Failed to create backup.'; }
		} catch (err) { error = 'Invalid password or backup failed'; }
		finally { downloading = false; }
	}

	function lockWallet() {
		walletService.lock();
		goto('/unlock');
	}

	function initiateRemove() {
		showRemoveModal = true;
		error = '';
	}

	function removeWallet() {
		encryptionService.clearWallet();
		localStorage.removeItem('isWalletAlive');
		localStorage.removeItem('preferredCurrency');
		sessionStorage.clear();
		goto('/');
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
				<button class="text-sm font-semibold text-slate-500 hover:text-white uppercase tracking-wider transition" on:click={() => goto('/exchange')}>Exchange</button>
				<button class="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b-2 border-cyan-500 pb-1">Settings</button>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={lockWallet} title="Lock wallet">
				<Lock size={18} />
			</button>
		</div>
	</nav>

	<!-- Settings Layout: Sidebar + Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar (desktop) / Tab bar (mobile) -->
		<aside class="settings-sidebar">
			{#each tabs as tab}
				<button
					class="sidebar-item"
					class:active={activeTab === tab.id}
					on:click={() => activeTab = tab.id}
				>
					<span class="sidebar-icon">{tab.icon}</span>
					<span class="sidebar-label">{tab.label}</span>
				</button>
			{/each}
		</aside>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6 pb-24 md:p-8 md:pb-8">
			<div class="max-w-[820px]">
				{#if success}
					<div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
						<p class="text-green-200">{success}</p>
					</div>
				{/if}

				<!-- ─── General ─── -->
				{#if activeTab === 'general'}
					<h2 class="section-title">General</h2>
					<p class="section-desc">Customize your wallet experience</p>

					<div class="settings-card">
						<div class="settings-item">
							<div class="item-info">
								<strong>Display Currency</strong>
								<span>Set your preferred fiat currency for portfolio values</span>
							</div>
							<div class="item-actions">
								<select
									class="settings-select"
									bind:value={selectedCurrency}
									on:change={() => setCurrency(selectedCurrency)}
								>
									{#each currencies as c}
										<option value={c.code}>{c.code} ({c.symbol})</option>
									{/each}
								</select>
							</div>
						</div>

						<div class="settings-item">
							<div class="item-info">
								<strong>Auto-Lock Timer</strong>
								<span>Wallet locks automatically after inactivity</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge">15 min</span>
							</div>
						</div>

						<div class="settings-item">
							<div class="item-info">
								<strong>Lock Wallet Now</strong>
								<span>Immediately lock and require your password</span>
							</div>
							<div class="item-actions">
								<button class="btn-secondary" on:click={lockWallet}>
									Lock Now
								</button>
							</div>
						</div>
					</div>

				<!-- ─── Security ─── -->
				{:else if activeTab === 'security'}
					<h2 class="section-title">Security</h2>
					<p class="section-desc">Protect your wallet with advanced security features</p>

					<div class="settings-card">
						<h3 class="card-subtitle">🔒 Auto-Lock</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Enable Auto-Lock</strong>
								<span>Automatically lock your wallet after a period of inactivity</span>
							</div>
							<div class="item-actions">
								<label class="toggle-switch">
									<input type="checkbox" checked disabled />
									<span class="toggle-slider"></span>
								</label>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Lock Timer</strong>
								<span>How long before the wallet locks itself</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge">15 min</span>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<h3 class="card-subtitle">🔑 Password Management</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Password Requirements</strong>
								<span>12+ characters, uppercase, lowercase, numbers, and symbols</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Enforced</span>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Rate Limiting</strong>
								<span>Exponential lockout after 5 failed unlock attempts</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Active</span>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<h3 class="card-subtitle">🛡️ Encryption</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Wallet Encryption</strong>
								<span>AES-256-GCM with PBKDF2 key derivation (100,000 iterations)</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Active</span>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Backup Integrity</strong>
								<span>HMAC-SHA256 verification on all backup files</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Active</span>
							</div>
						</div>
					</div>

				<!-- ─── Backup & Recovery ─── -->
				{:else if activeTab === 'backup'}
					<h2 class="section-title">Backup & Recovery</h2>
					<p class="section-desc">Keep your wallet safe with encrypted backups and seed phrase access</p>

					<div class="settings-card">
						<div class="settings-item">
							<div class="item-info">
								<strong>Export Tuffbackup</strong>
								<span>Download an encrypted .rivara backup file — protected by your password</span>
							</div>
							<div class="item-actions">
								<button class="btn-primary" on:click={initiateBackup}>Export</button>
							</div>
						</div>

						<div class="settings-item">
							<div class="item-info">
								<strong>View Seed Phrase</strong>
								<span>Reveal your 12-word recovery phrase — never share this with anyone</span>
							</div>
							<div class="item-actions">
								<button class="btn-secondary" on:click={showSeed}>Reveal</button>
							</div>
						</div>
					</div>

					<div class="mt-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
						<p class="text-amber-300/80 text-xs leading-relaxed">
							<strong>⚠️ Important:</strong> Tuffbackup should not be your only backup. Always keep your 12-word seed phrase written down and stored securely offline.
						</p>
					</div>

				<!-- ─── Privacy ─── -->
				{:else if activeTab === 'privacy'}
					<h2 class="section-title">Privacy</h2>
					<p class="section-desc">How Rivara handles your data</p>

					<div class="settings-card">
						<div class="settings-item">
							<div class="item-info">
								<strong>Data Collection</strong>
								<span>Rivara collects zero personal data. No analytics, no tracking, no telemetry.</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">None</span>
							</div>
						</div>

						<div class="settings-item">
							<div class="item-info">
								<strong>Key Storage</strong>
								<span>All keys are encrypted locally on your device using AES-256-GCM. Nothing is ever transmitted.</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Local</span>
							</div>
						</div>

						<div class="settings-item">
							<div class="item-info">
								<strong>Third-Party Services</strong>
								<span>Only public blockchain RPCs, CoinGecko (prices), and ChangeNow (exchange). No identifying data sent.</span>
							</div>
							<div class="item-actions">
								<span class="settings-badge">Minimal</span>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<div class="settings-item">
							<div class="item-info">
								<strong>Privacy Policy</strong>
								<span>Read our full privacy policy</span>
							</div>
							<div class="item-actions">
								<a href="/privacy" class="btn-secondary">View</a>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Terms of Service</strong>
								<span>Read our terms of service</span>
							</div>
							<div class="item-actions">
								<a href="/terms" class="btn-secondary">View</a>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Source Code</strong>
								<span>Verify everything — Rivara is fully open source</span>
							</div>
							<div class="item-actions">
								<a href="https://github.com/dominic84p/Rivara-Wallet" target="_blank" rel="noopener" class="btn-secondary">GitHub ↗</a>
							</div>
						</div>
					</div>

				<!-- ─── Danger Zone ─── -->
				{:else if activeTab === 'danger'}
					<h2 class="section-title" style="color: #f87171;">Danger Zone</h2>
					<p class="section-desc">These actions are permanent and cannot be undone</p>

					<div class="settings-card danger-card">
						<div class="settings-item">
							<div class="item-info">
								<strong>Forget Wallet</strong>
								<span>Permanently delete all wallet data from this device. Make sure you have a backup first.</span>
							</div>
							<div class="item-actions">
								<button class="btn-danger" on:click={initiateRemove}>Forget Wallet</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Version -->
				<p class="text-center text-slate-600 text-xs mt-10">Rivara Wallet v1.0.0-beta</p>
			</div>
		</div>
	</div>
</div>

<!-- Seed Phrase Modal -->
{#if showSeedModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">Reveal Seed Phrase</h3>
			{#if !seedPhrase}
				<p class="text-sm text-slate-400 mb-4">Enter your password to reveal your seed phrase.</p>
				{#if error}
					<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p class="text-red-200 text-sm">{error}</p>
					</div>
				{/if}
				<input type="password" bind:value={password} placeholder="Enter password"
					class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
					on:keydown={(e) => e.key === 'Enter' && revealSeed()} />
				<div class="flex gap-3">
					<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition" on:click={() => { showSeedModal = false; password = ''; error = ''; }}>Cancel</button>
					<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={revealSeed}>Reveal</button>
				</div>
			{:else}
				<div class="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
					<p class="text-yellow-200 text-sm"><strong>⚠️ Warning:</strong> Never share your seed phrase with anyone!</p>
				</div>
				<div class="p-4 bg-black/20 border border-white/10 rounded-lg mb-4">
					<p class="text-white font-mono text-sm break-all">{seedPhrase}</p>
				</div>
				<button class="w-full px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition" on:click={() => { showSeedModal = false; seedPhrase = ''; password = ''; error = ''; }}>Close</button>
			{/if}
		</div>
	</div>
{/if}

<!-- Remove Wallet Modal -->
{#if showRemoveModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">Forget Wallet</h3>
			<p class="text-sm text-slate-400 mb-4">Are you sure? This will delete all wallet data from this device. Make sure you have your seed phrase backed up.</p>
			<div class="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
				<p class="text-red-200 text-sm"><strong>⚠️ Warning:</strong> You will lose access to your funds if you don't have your seed phrase!</p>
			</div>
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition" on:click={() => { showRemoveModal = false; }}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition" on:click={removeWallet}>Forget Wallet</button>
			</div>
		</div>
	</div>
{/if}

<!-- Password Modal -->
{#if showPasswordModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">Enter Password</h3>
			<p class="text-sm text-slate-400 mb-4">Enter your wallet password to create an encrypted backup.</p>
			{#if error}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p class="text-red-200 text-sm">{error}</p>
				</div>
			{/if}
			<input type="password" bind:value={password} placeholder="Enter password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
				on:keydown={(e) => e.key === 'Enter' && downloadBackup()} />
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition" on:click={() => { showPasswordModal = false; password = ''; error = ''; }} disabled={downloading}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50" on:click={downloadBackup} disabled={downloading}>
					{downloading ? 'Downloading...' : 'Download'}
				</button>
			</div>
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
		<button class="flex flex-col items-center gap-1 py-3 text-slate-500" on:click={() => goto('/exchange')}>
			<RefreshCw size={24} /><span class="text-xs">Swap</span>
		</button>
		<button class="flex flex-col items-center gap-1 py-3 text-cyan-400">
			<Shield size={24} /><span class="text-xs font-medium">Settings</span>
		</button>
	</div>
</div>

<style>
	/* ─── Sidebar ─── */
	.settings-sidebar {
		width: 240px;
		background: rgba(15, 17, 26, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-right: 1px solid rgba(255, 255, 255, 0.04);
		padding: 1.5rem 0;
		flex-shrink: 0;
	}

	.sidebar-item {
		width: 100%;
		padding: 0.875rem 1.5rem;
		color: rgb(148, 163, 184);
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		border: none;
		border-left: 3px solid transparent;
		background: transparent;
		display: flex;
		align-items: center;
		gap: 0.875rem;
		position: relative;
		overflow: hidden;
		text-align: left;
	}

	.sidebar-item::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.25s;
	}

	.sidebar-item:hover { color: white; }
	.sidebar-item:hover::before { opacity: 1; }

	.sidebar-item.active {
		color: white;
		border-left-color: #a78bfa;
		font-weight: 600;
	}

	.sidebar-item.active::before {
		opacity: 1;
		background: linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, transparent 100%);
	}

	.sidebar-icon {
		font-size: 1.125rem;
		width: 24px;
		text-align: center;
		flex-shrink: 0;
	}

	/* ─── Section ─── */
	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
	}

	.section-desc {
		color: rgb(100, 116, 139);
		font-size: 0.875rem;
		margin-bottom: 2rem;
		font-weight: 500;
		line-height: 1.5;
	}

	/* ─── Cards ─── */
	.settings-card {
		background: linear-gradient(135deg, rgba(30, 34, 48, 0.45) 0%, rgba(20, 22, 30, 0.6) 100%);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 0.75rem 1.75rem;
		box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.3);
		position: relative;
		overflow: hidden;
	}

	.settings-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0;
		width: 100%; height: 100%;
		background: radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.04), transparent 60%);
		pointer-events: none;
	}

	.danger-card {
		border-color: rgba(239, 68, 68, 0.08);
	}
	.danger-card::before {
		background: radial-gradient(ellipse at top right, rgba(239, 68, 68, 0.03), transparent 60%);
	}

	.card-subtitle {
		font-size: 1rem;
		color: white;
		font-weight: 600;
		padding-top: 0.75rem;
		padding-bottom: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* ─── Items ─── */
	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 0;
		position: relative;
		z-index: 1;
	}

	.settings-item:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
	}

	.item-info strong {
		color: white;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: -0.005em;
	}

	.item-info span {
		color: rgb(100, 116, 139);
		font-size: 0.8125rem;
		font-weight: 450;
		line-height: 1.4;
	}

	.item-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-shrink: 0;
		margin-left: 2rem;
	}

	/* ─── Buttons ─── */
	.btn-primary {
		padding: 0.625rem 1.5rem;
		background: linear-gradient(135deg, #06b6d4 0%, #06b6d4 100%);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 15px rgba(139, 92, 246, 0.25);
		white-space: nowrap;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
		filter: brightness(1.1);
	}

	.btn-secondary {
		padding: 0.625rem 1.5rem;
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(10px);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		text-decoration: none;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.btn-danger {
		padding: 0.625rem 1.5rem;
		background: rgba(239, 68, 68, 0.08);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
	}

	.btn-danger:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.4);
		box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
		transform: translateY(-1px);
	}

	/* ─── Select ─── */
	.settings-select {
		padding: 0.625rem 1rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: white;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.25s;
		outline: none;
		font-family: inherit;
		backdrop-filter: blur(5px);
		min-width: 150px;
	}

	.settings-select:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.settings-select:focus {
		border-color: #a78bfa;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
	}

	.settings-select option {
		background: #1e2230;
		color: white;
	}

	/* ─── Badge ─── */
	.settings-badge {
		padding: 0.375rem 0.875rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: rgb(148, 163, 184);
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* ─── Toggle ─── */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 26px;
	}

	.toggle-switch input { opacity: 0; width: 0; height: 0; }

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: rgba(255, 255, 255, 0.1);
		transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 26px;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 2px;
		background-color: white;
		transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.toggle-switch input:checked + .toggle-slider {
		background: linear-gradient(135deg, #06b6d4 0%, #06b6d4 100%);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
	}

	.toggle-switch input:checked + .toggle-slider:before {
		transform: translateX(21px);
	}

	/* ─── Mobile ─── */
	@media (max-width: 768px) {
		.settings-sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.04);
			padding: 0.75rem 0;
			display: flex;
			overflow-x: auto;
			white-space: nowrap;
			-webkit-overflow-scrolling: touch;
		}

		.settings-sidebar::-webkit-scrollbar { display: none; }

		.sidebar-item {
			padding: 0.75rem 1.25rem;
			border-left: none;
			border-bottom: 2px solid transparent;
			flex-shrink: 0;
			font-size: 0.8125rem;
		}

		.sidebar-item.active {
			border-left: none;
			border-bottom-color: #a78bfa;
		}

		.sidebar-item::before { display: none; }

		.sidebar-label { display: block; }

		.settings-card { padding: 0.5rem 1.25rem; }

		.settings-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
			padding: 1.25rem 0;
		}

		.item-actions {
			width: 100%;
			margin-left: 0;
		}

		.btn-primary, .btn-secondary, .btn-danger {
			flex: 1;
			text-align: center;
			justify-content: center;
		}

		.settings-select { width: 100%; }
	}
</style>
