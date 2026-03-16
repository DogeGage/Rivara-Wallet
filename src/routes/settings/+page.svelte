<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Shield, Clock, Trash2, Eye, Key, Lock, Download, Wallet, TrendingUp, RefreshCw, FileText, ExternalLink, Settings, BookOpen, Info, AlertTriangle, Save } from 'lucide-svelte';
	import { tuffbackupService } from '$lib/services/tuffbackup-service';
	import { walletService } from '$lib/services/wallet-service';
	import { encryptionService } from '$lib/services/encryption-service';
	import { addressBookService } from '$lib/services/address-book-service';
	import type { Contact } from '$lib/services/address-book-service';
	import { detectChain } from '$lib/services/send';
	import { isUnlocked } from '$lib/stores/wallet';

	let activeTab = 'general';
	let showPasswordModal = false;
	let showRemoveModal = false;
	let showSeedModal = false;
	let showDuressModal = false;
	let password = '';
	let error = '';
	let success = '';
	let downloading = false;
	let seedPhrase = '';
	let duressPassword = '';
	let duressPasswordConfirm = '';
	let hasDuressPassword = false;

	// Change password
	let showChangePasswordModal = false;
	let currentPassword = '';
	let newPassword = '';
	let newPasswordConfirm = '';
	let changingPassword = false;

	// Import backup
	let importFileInput: HTMLInputElement;
	let showImportPasswordModal = false;
	let importFile: File | null = null;
	let importPassword = '';
	let importingBackup = false;
	let importFileInfo = '';

	// Address book
	const chains = ['bitcoin', 'ethereum', 'polygon', 'dogecoin', 'litecoin', 'solana', 'tezos', 'tron'];
	let contacts: Contact[] = [];
	let showContactModal = false;
	let editingContact: Contact | null = null;
	let contactName = '';
	let contactAddress = '';
	let contactChain = 'bitcoin';
	let contactError = '';
	let contactChainAutoDetected = false;

	$: {
		const detected = detectChain(contactAddress);
		if (detected) {
			contactChain = detected;
			contactChainAutoDetected = true;
		} else {
			contactChainAutoDetected = false;
		}
	}

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
		{ id: 'general', label: 'General', icon: Settings },
		{ id: 'security', label: 'Security', icon: Shield },
		{ id: 'backup', label: 'Backup & Recovery', icon: Save },
		{ id: 'privatekeys', label: 'Private Keys', icon: Key },
		{ id: 'addressbook', label: 'Address Book', icon: BookOpen },
		{ id: 'privacy', label: 'Privacy', icon: Lock },
		{ id: 'about', label: 'About', icon: Info },
		{ id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
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
		
		// Check if duress password is set
		hasDuressPassword = encryptionService.hasDuressPassword();
		contacts = addressBookService.getAll();
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
			const result = await tuffbackupService.downloadBackup(password);
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
	
	function showDuressSetup() {
		showDuressModal = true;
		duressPassword = '';
		duressPasswordConfirm = '';
		error = '';
	}
	
	function setDuressPassword() {
		if (!duressPassword) {
			error = 'Please enter a duress password';
			return;
		}
		if (duressPassword.length < 8) {
			error = 'Duress password must be at least 8 characters';
			return;
		}
		if (duressPassword !== duressPasswordConfirm) {
			error = 'Passwords do not match';
			return;
		}
		
		encryptionService.setDuressPassword(duressPassword);
		hasDuressPassword = true;
		success = 'Duress password set successfully';
		showDuressModal = false;
		duressPassword = '';
		duressPasswordConfirm = '';
		setTimeout(() => success = '', 3000);
	}
	
	function removeDuressPassword() {
		encryptionService.clearDuressPassword();
		hasDuressPassword = false;
		success = 'Duress password removed';
		setTimeout(() => success = '', 3000);
	}

	function saveAutoLock() {
		localStorage.setItem('autoLockEnabled', autoLockEnabled.toString());
		localStorage.setItem('autoLockDelay', (autoLockMinutes * 60 * 1000).toString());
		success = 'Auto-lock settings saved';
		setTimeout(() => success = '', 2000);
	}

	function showChangePassword() {
		showChangePasswordModal = true;
		currentPassword = '';
		newPassword = '';
		newPasswordConfirm = '';
		error = '';
	}

	async function changePassword() {
		if (!currentPassword) { error = 'Enter your current password'; return; }
		if (!newPassword) { error = 'Enter a new password'; return; }
		if (newPassword.length < 12) { error = 'New password must be at least 12 characters'; return; }
		if (newPassword !== newPasswordConfirm) { error = 'New passwords do not match'; return; }
		if (newPassword === currentPassword) { error = 'New password must be different from current'; return; }

		changingPassword = true;
		error = '';
		try {
			const encrypted = localStorage.getItem('encryptedWallet');
			if (!encrypted) { error = 'No wallet found'; return; }
			const seed = await encryptionService.decrypt(encrypted, currentPassword);
			await encryptionService.saveWallet(seed, newPassword);
			sessionStorage.setItem('_walletSessionPw', newPassword);
			success = 'Password changed successfully';
			showChangePasswordModal = false;
			currentPassword = ''; newPassword = ''; newPasswordConfirm = '';
			setTimeout(() => success = '', 3000);
		} catch {
			error = 'Current password is incorrect';
		} finally {
			changingPassword = false;
		}
	}

	async function handleImportFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files?.[0]) return;
		importFile = target.files[0];
		importFileInfo = '';
		const v = await tuffbackupService.validateBackupFile(importFile);
		if (!v.valid) { error = 'Invalid backup file'; importFile = null; return; }
		const parts = [`v${v.version}`];
		if (v.hasPrivateKeys) parts.push('includes private keys');
		if (v.hasAddressBook) parts.push('includes address book');
		importFileInfo = parts.join(' · ');
		showImportPasswordModal = true;
		importPassword = '';
		error = '';
	}

	async function confirmImportBackup() {
		if (!importFile || !importPassword) { error = 'Enter your backup password'; return; }
		importingBackup = true;
		error = '';
		try {
			const result = await tuffbackupService.restoreBackup(importFile, importPassword);
			const notes: string[] = [];
			if (result.addressBookRestored) notes.push('address book restored');
			if (result.privateKeysRestored.length > 0) notes.push(`keys restored: ${result.privateKeysRestored.join(', ')}`);
			success = notes.length > 0 ? notes.join(' · ') : 'Backup imported successfully';
			showImportPasswordModal = false;
			importFile = null;
			importPassword = '';
			contacts = addressBookService.getAll();
			setTimeout(() => success = '', 4000);
		} catch (err: any) {
			error = err.message || 'Invalid password or corrupted file';
		} finally {
			importingBackup = false;
		}
	}

	function openAddContact() {
		editingContact = null;
		contactName = '';
		contactAddress = '';
		contactChain = 'bitcoin';
		contactChainAutoDetected = false;
		contactError = '';
		showContactModal = true;
	}

	function openEditContact(c: Contact) {
		editingContact = c;
		contactName = c.name;
		contactAddress = c.address;
		contactChain = c.chain;
		contactChainAutoDetected = false;
		contactError = '';
		showContactModal = true;
	}

	function saveContact() {
		if (!contactName.trim()) { contactError = 'Name is required'; return; }
		if (!contactAddress.trim()) { contactError = 'Address is required'; return; }
		if (editingContact) {
			addressBookService.update(editingContact.id, contactName, contactAddress, contactChain);
		} else {
			addressBookService.add(contactName, contactAddress, contactChain);
		}
		contacts = addressBookService.getAll();
		showContactModal = false;
	}

	function deleteContact(id: string) {
		addressBookService.remove(id);
		contacts = addressBookService.getAll();
	}

	// Private keys
	let pkPassword = '';
	let pkError = '';
	let pkAuthed = false;
	let privateKeys: { chain: string; key: string; visible: boolean }[] = [];
	let derivingKeys = false;
	let copiedKey: string | null = null;

	// About / Version info
	let versionInfo: any = null;
	let loadingVersion = false;

	async function loadVersionInfo() {
		loadingVersion = true;
		try {
			const res = await fetch('https://api.rivarawallet.xyz/');
			if (res.ok) {
				versionInfo = await res.json();
			}
		} catch (err) {
			console.error('Failed to fetch version info:', err);
		} finally {
			loadingVersion = false;
		}
	}

	$: if (activeTab === 'about' && !versionInfo && !loadingVersion) {
		loadVersionInfo();
	}

	async function revealPrivateKeys() {
		if (!pkPassword) { pkError = 'Enter your password'; return; }
		derivingKeys = true;
		pkError = '';
		try {
			const encrypted = localStorage.getItem('encryptedWallet');
			if (!encrypted) { pkError = 'No wallet found'; derivingKeys = false; return; }
			const mnemonic = await encryptionService.decrypt(encrypted, pkPassword);
			// @ts-ignore
			const { ethers, bitcoin } = window.cryptoLibs;
			const keys: { chain: string; key: string; visible: boolean }[] = [];

			if (ethers && mnemonic) {
				// EVM — ETH & Polygon share the same key
				const evmWallet = ethers.Wallet.fromMnemonic(mnemonic);
				keys.push({ chain: 'Ethereum', key: evmWallet.privateKey, visible: false });
				keys.push({ chain: 'Polygon', key: evmWallet.privateKey, visible: false });

				// Tron
				const tronNode = ethers.utils.HDNode.fromMnemonic(mnemonic).derivePath("m/44'/195'/0'/0/0");
				keys.push({ chain: 'Tron', key: tronNode.privateKey.slice(2), visible: false });

				// UTXO chains
				if (bitcoin) {
					try {
						const seed = ethers.utils.mnemonicToSeed(mnemonic);
						const seedBuffer = Buffer.from(seed.slice(2), 'hex');
						const root = bitcoin.bip32.fromSeed(seedBuffer);
						keys.push({ chain: 'Bitcoin', key: root.derivePath("m/44'/0'/0'/0/0").privateKey!.toString('hex'), visible: false });
						keys.push({ chain: 'Dogecoin', key: root.derivePath("m/44'/3'/0'/0/0").privateKey!.toString('hex'), visible: false });
						keys.push({ chain: 'Litecoin', key: root.derivePath("m/44'/2'/0'/0/0").privateKey!.toString('hex'), visible: false });
					} catch {}
				}

				// Solana — Ed25519, first 32 bytes of derived seed as hex
				try {
					// @ts-ignore
					const solKeys = await getTezosEd25519Keys(mnemonic, "m/44'/501'/0'/0'");
					const solPrivHex = Array.from(solKeys.privateKey.slice(0, 32) as number[])
						.map((b: number) => b.toString(16).padStart(2, '0')).join('');
					keys.push({ chain: 'Solana', key: solPrivHex, visible: false });
				} catch {}
			}

			privateKeys = keys;
			pkAuthed = true;
			pkPassword = '';
		} catch {
			pkError = 'Invalid password';
		} finally {
			derivingKeys = false;
		}
	}

	function toggleKeyVisible(i: number) {
		privateKeys[i].visible = !privateKeys[i].visible;
		privateKeys = [...privateKeys];
	}

	async function copyKey(key: string, chain: string) {
		await navigator.clipboard.writeText(key);
		copiedKey = chain;
		setTimeout(() => copiedKey = null, 2000);
	}

	function lockPrivateKeys() {
		pkAuthed = false;
		privateKeys = [];
		pkPassword = '';
		pkError = '';
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
					on:click={() => { if (activeTab === 'privatekeys' && tab.id !== 'privatekeys') lockPrivateKeys(); activeTab = tab.id; }}
				>
					<span class="sidebar-icon">
						<svelte:component this={tab.icon} size={18} />
					</span>
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
								<select class="settings-select" bind:value={autoLockMinutes} on:change={saveAutoLock}>
									{#each lockTimeOptions as m}
										<option value={m}>{m} min</option>
									{/each}
								</select>
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
									<input type="checkbox" bind:checked={autoLockEnabled} on:change={saveAutoLock} />
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
								<select class="settings-select" bind:value={autoLockMinutes} on:change={saveAutoLock} disabled={!autoLockEnabled}>
									{#each lockTimeOptions as m}
										<option value={m}>{m} min</option>
									{/each}
								</select>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<h3 class="card-subtitle">🔑 Password Management</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Change Password</strong>
								<span>Update your wallet encryption password</span>
							</div>
							<div class="item-actions">
								<button class="btn-secondary" on:click={showChangePassword}>Change</button>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<h3 class="card-subtitle">🚨 Duress Protection</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Duress Password</strong>
								<span>Set an alternate password that shows a fake wallet with small balances for emergency situations</span>
							</div>
							<div class="item-actions">
								{#if hasDuressPassword}
									<span class="settings-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.2); background: rgba(74, 222, 128, 0.08);">Active</span>
									<button class="btn-danger" on:click={removeDuressPassword}>Remove</button>
								{:else}
									<button class="btn-primary" on:click={showDuressSetup}>Set Up</button>
								{/if}
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
								<strong>Import Tuffbackup</strong>
								<span>Restore address book and private keys from a .rivara backup file</span>
							</div>
							<div class="item-actions">
								<input type="file" accept=".rivara" bind:this={importFileInput} on:change={handleImportFileSelect} class="hidden" />
								<button class="btn-secondary" on:click={() => importFileInput.click()}>Import</button>
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

				<!-- ─── Private Keys ─── -->
				{:else if activeTab === 'privatekeys'}
					<h2 class="section-title">Private Keys</h2>
					<p class="section-desc">View your derived private keys — never share these with anyone</p>

					<div class="mt-4 mb-6 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
						<p class="text-red-300/90 text-xs leading-relaxed">
							<strong>⚠️ Danger:</strong> Anyone with your private keys has full control of those funds. Only view these in a secure, private environment.
						</p>
					</div>

					{#if !pkAuthed}
						<div class="settings-card">
							<p class="text-sm text-slate-400 mb-4">Enter your wallet password to derive and view your private keys.</p>
							{#if pkError}
								<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
									<p class="text-red-200 text-sm">{pkError}</p>
								</div>
							{/if}
							<input type="password" bind:value={pkPassword} placeholder="Enter password"
								class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
								on:keydown={(e) => e.key === 'Enter' && revealPrivateKeys()} />
							<button class="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
								disabled={derivingKeys} on:click={revealPrivateKeys}>
								{derivingKeys ? 'Deriving keys...' : 'Reveal Private Keys'}
							</button>
						</div>
					{:else}
						<div class="flex justify-end mb-4">
							<button class="btn-secondary" on:click={lockPrivateKeys}>🔒 Lock Keys</button>
						</div>
						<div class="settings-card">
							{#each privateKeys as pk, i}
								<div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
									<div class="flex items-center justify-between w-full">
										<strong class="text-sm">{pk.chain}</strong>
										<div class="flex gap-2">
											<button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" on:click={() => toggleKeyVisible(i)}>
												{pk.visible ? 'Hide' : 'Show'}
											</button>
											<button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" on:click={() => copyKey(pk.key, pk.chain)}>
												{copiedKey === pk.chain ? '✓ Copied' : 'Copy'}
											</button>
										</div>
									</div>
									{#if pk.visible}
										<div class="w-full p-3 bg-black/30 border border-white/10 rounded-lg">
											<p class="font-mono text-xs text-amber-300 break-all">{pk.key}</p>
										</div>
									{:else}
										<div class="w-full p-3 bg-black/20 border border-white/5 rounded-lg">
											<p class="font-mono text-xs text-slate-600 tracking-widest">{'•'.repeat(64)}</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

				<!-- ─── Address Book ─── -->				{:else if activeTab === 'addressbook'}
					<h2 class="section-title">Address Book</h2>
					<p class="section-desc">Save frequently used addresses</p>

					<div class="flex justify-end mb-4">
						<button class="btn-primary" on:click={openAddContact}>+ Add Contact</button>
					</div>

					{#if contacts.length === 0}
						<div class="settings-card">
							<p class="text-slate-500 text-sm text-center py-8">No contacts yet. Add one to get started.</p>
						</div>
					{:else}
						<div class="settings-card">
							{#each contacts as contact}
								<div class="settings-item">
									<div class="item-info">
										<strong>{contact.name}</strong>
										<span class="font-mono text-xs break-all">{contact.address}</span>
										<span class="text-xs text-slate-600 uppercase">{contact.chain}</span>
									</div>
									<div class="item-actions">
										<button class="btn-secondary" on:click={() => openEditContact(contact)}>Edit</button>
										<button class="btn-danger" on:click={() => deleteContact(contact.id)}>Delete</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

				<!-- ─── Privacy ─── -->
				{:else if activeTab === 'privacy'}
					<h2 class="section-title">Privacy</h2>
					<p class="section-desc">How Rivara handles your data</p>

					<div class="settings-card">
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

				<!-- ─── About ─── -->
				{:else if activeTab === 'about'}
					<h2 class="section-title">About Rivara</h2>
					<p class="section-desc">Version information and project details</p>

					<div class="settings-card">
						<div class="settings-item">
							<div class="item-info">
								<strong>Version</strong>
								{#if loadingVersion}
									<span class="text-slate-500">Loading...</span>
								{:else if versionInfo?.engine}
									<span>{versionInfo.engine}</span>
								{:else}
									<span>Phantom v6.1.0</span>
								{/if}
							</div>
							{#if !loadingVersion && !versionInfo}
								<div class="item-actions">
									<button class="btn-secondary" on:click={loadVersionInfo}>Check API</button>
								</div>
							{/if}
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>API Status</strong>
								{#if loadingVersion}
									<span class="text-slate-500">Checking...</span>
								{:else if versionInfo?.status === 'online'}
									<span class="text-emerald-400">● Online</span>
								{:else if versionInfo?.status}
									<span class="text-yellow-400">● {versionInfo.status}</span>
								{:else}
									<span class="text-slate-500">Not checked</span>
								{/if}
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Release Date</strong>
								<span>March 15, 2026</span>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>License</strong>
								<span>Open source under MIT License</span>
							</div>
							<div class="item-actions">
								<a href="https://github.com/dominic84p/Rivara-Wallet/blob/main/LICENSE" target="_blank" rel="noopener" class="btn-secondary">View ↗</a>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>GitHub Repository</strong>
								<span>View source code, report issues, contribute</span>
							</div>
							<div class="item-actions">
								<a href="https://github.com/dominic84p/Rivara-Wallet" target="_blank" rel="noopener" class="btn-secondary">Open ↗</a>
							</div>
						</div>
					</div>

					<div class="settings-card mt-6">
						<h3 class="card-subtitle">🔗 Links</h3>
						<div class="settings-item">
							<div class="item-info">
								<strong>Documentation</strong>
								<span>Learn how to use Rivara</span>
							</div>
							<div class="item-actions">
								<a href="https://github.com/dominic84p/Rivara-Wallet#readme" target="_blank" rel="noopener" class="btn-secondary">Read ↗</a>
							</div>
						</div>
						<div class="settings-item">
							<div class="item-info">
								<strong>Report an Issue</strong>
								<span>Found a bug? Let us know</span>
							</div>
							<div class="item-actions">
								<a href="https://github.com/dominic84p/Rivara-Wallet/issues" target="_blank" rel="noopener" class="btn-secondary">Report ↗</a>
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

<!-- Duress Password Modal -->
{#if showDuressModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">Set Duress Password</h3>
			<p class="text-sm text-slate-400 mb-4">Create an alternate password that will show a fake wallet with small balances. Use this in emergency situations where you're forced to unlock your wallet.</p>
			<div class="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
				<p class="text-amber-200 text-sm"><strong>⚠️ Important:</strong> Make sure this password is different from your real password and easy to remember under stress.</p>
			</div>
			{#if error}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p class="text-red-200 text-sm">{error}</p>
				</div>
			{/if}
			<input type="password" bind:value={duressPassword} placeholder="Enter duress password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-3" />
			<input type="password" bind:value={duressPasswordConfirm} placeholder="Confirm duress password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
				on:keydown={(e) => e.key === 'Enter' && setDuressPassword()} />
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition" on:click={() => { showDuressModal = false; duressPassword = ''; duressPasswordConfirm = ''; error = ''; }}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25" on:click={setDuressPassword}>Set Password</button>
			</div>
		</div>
	</div>
{/if}

<!-- Change Password Modal -->
{#if showChangePasswordModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">Change Password</h3>
			<p class="text-sm text-slate-400 mb-4">Enter your current password and choose a new one.</p>
			{#if error}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p class="text-red-200 text-sm">{error}</p>
				</div>
			{/if}
			<input type="password" bind:value={currentPassword} placeholder="Current password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-3" />
			<input type="password" bind:value={newPassword} placeholder="New password (12+ characters)"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-3" />
			<input type="password" bind:value={newPasswordConfirm} placeholder="Confirm new password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
				on:keydown={(e) => e.key === 'Enter' && changePassword()} />
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition"
					disabled={changingPassword}
					on:click={() => { showChangePasswordModal = false; error = ''; }}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
					disabled={changingPassword} on:click={changePassword}>
					{changingPassword ? 'Changing...' : 'Change Password'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Backup Password Modal -->
{#if showImportPasswordModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-2">Import Tuffbackup</h3>
			{#if importFileInfo}
				<p class="text-xs text-cyan-400 mb-4">{importFileInfo}</p>
			{/if}
			<p class="text-sm text-slate-400 mb-4">Enter the password used when this backup was created.</p>
			{#if error}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p class="text-red-200 text-sm">{error}</p>
				</div>
			{/if}
			<input type="password" bind:value={importPassword} placeholder="Backup password"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-4"
				on:keydown={(e) => e.key === 'Enter' && confirmImportBackup()} />
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition"
					disabled={importingBackup}
					on:click={() => { showImportPasswordModal = false; importFile = null; error = ''; }}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
					disabled={importingBackup} on:click={confirmImportBackup}>
					{importingBackup ? 'Importing...' : 'Import'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Contact Modal -->
{#if showContactModal}
	<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-white mb-4">{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
			{#if contactError}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
					<p class="text-red-200 text-sm">{contactError}</p>
				</div>
			{/if}
			<input type="text" bind:value={contactName} placeholder="Name"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-3" />
			<input type="text" bind:value={contactAddress} placeholder="Address"
				class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white font-mono text-sm placeholder-slate-600 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 transition-all outline-none mb-3" />
			<div class="relative mb-4">
				<select bind:value={contactChain} class="settings-select w-full">
					{#each chains as c}
						<option value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
					{/each}
				</select>
				{#if contactChainAutoDetected}
					<span class="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-cyan-400 pointer-events-none">auto-detected</span>
				{/if}
			</div>
			<div class="flex gap-3">
				<button class="flex-1 px-4 py-3 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition"
					on:click={() => { showContactModal = false; contactError = ''; }}>Cancel</button>
				<button class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/25"
					on:click={saveContact}>Save</button>
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
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
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
