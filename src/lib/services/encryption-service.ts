/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */

/**
 * Encryption Service — Encrypt/decrypt seed phrases with password.
 *
 * SECURITY MODEL:
 *  - Key derivation and runtime decryption happen inside the Service Worker.
 *  - The main thread never holds a CryptoKey or raw key material after unlock.
 *  - Duress mode is tracked in a module-level variable — never written to any storage.
 *  - There is NO silent fallback to main-thread decryption; SW is required.
 */

import { secureKeyManager } from './secure-key-manager';

// ── Duress state ──────────────────────────────────────────────────────────────
// Tracked in memory only. sessionStorage is visible to DevTools and extensions.
let _isDuressMode = false;

class EncryptionService {

  // ── Key Derivation (main-thread, used only at wallet creation) ──────────────

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  // ── Encrypt / Decrypt ────────────────────────────────────────────────────────

  /** Encrypt a seed phrase. Called once at wallet creation. */
  async encrypt(seedPhrase: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(seedPhrase),
    );

    // Layout: [salt 16B][iv 12B][ciphertext]
    const result = new Uint8Array(16 + 12 + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv,   16);
    result.set(new Uint8Array(encrypted), 28);
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Direct decrypt — used only for:
   *  - wallet creation verification
   *  - seed phrase display in settings (re-auth flow)
   *  - duress decoy wallet decryption
   * All runtime signing goes through the Service Worker.
   */
  async decrypt(encryptedData: string, password: string): Promise<string> {
    const data      = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const salt      = data.slice(0, 16);
    const iv        = data.slice(16, 28);
    const encrypted = data.slice(28);
    const key       = await this.deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    );
    return new TextDecoder().decode(plaintext);
  }

  // ── Wallet Storage ────────────────────────────────────────────────────────────

  hasStoredWallet(): boolean {
    return localStorage.getItem('encryptedWallet') !== null;
  }

  /**
   * Encrypt and persist the wallet.
   * If duressPassword + duressSeedPhrase are supplied, a separate decoy
   * wallet is stored under that password.
   */
  async saveWallet(
    seedPhrase: string,
    password: string,
    duressPassword?: string,
    duressSeedPhrase?: string,
  ): Promise<void> {
    const encrypted = await this.encrypt(seedPhrase, password);
    localStorage.setItem('encryptedWallet', encrypted);

    if (duressPassword && duressSeedPhrase) {
      await this.setDuressWallet(duressSeedPhrase, duressPassword);
    }
  }

  /**
   * Unlock the wallet by password.
   *
   * Duress path: decrypt the *real* duress wallet (not a hardcoded seed).
   * Normal path: derive key inside the SW — password is not retained anywhere.
   */
  async loadWallet(password: string): Promise<string> {
    const encrypted = localStorage.getItem('encryptedWallet');
    if (!encrypted) throw new Error('No wallet found in storage');

    // ── Duress check ────────────────────────────────────────────────────────
    const duressSaltB64 = localStorage.getItem('duressSalt');
    const duressHash    = localStorage.getItem('duressHash');

    if (duressSaltB64 && duressHash) {
      const saltBytes = Uint8Array.from(atob(duressSaltB64), c => c.charCodeAt(0));
      const candidate = await this.hashWithSalt(password, saltBytes);

      if (candidate === duressHash) {
        _isDuressMode = true;
        const duressEncrypted = localStorage.getItem('encryptedDuressWallet');
        if (!duressEncrypted) throw new Error('Duress wallet not configured');
        // Decrypt decoy wallet directly (no SW needed for duress path)
        return this.decrypt(duressEncrypted, password);
      }
    }

    // ── Legacy migration (one-time, silent) ─────────────────────────────────
    this.migrateLegacyDuress();

    // ── Normal unlock via Service Worker ────────────────────────────────────
    _isDuressMode = false;
    await this.requireServiceWorker();

    const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const salt = data.slice(0, 16);

    await secureKeyManager.deriveAndStoreKey(password, salt);
    return secureKeyManager.decryptWallet(encrypted);
  }

  /**
   * Decrypt using the key already held in the SW (no password needed).
   * Used for re-loading wallet data within the same SW session.
   */
  async loadWalletFromStoredKey(): Promise<string> {
    const encrypted = localStorage.getItem('encryptedWallet');
    if (!encrypted) throw new Error('No wallet found in storage');

    await this.requireServiceWorker();

    if (!(await secureKeyManager.isUnlocked())) {
      throw new Error('Wallet is locked — password required');
    }
    return secureKeyManager.decryptWallet(encrypted);
  }

  /** True only if the current session was unlocked with the duress password. */
  isDuressMode(): boolean {
    return _isDuressMode;
  }

  // ── Duress Wallet ──────────────────────────────────────────────────────────

  /**
   * Store a real encrypted decoy seed + a hashed duress password.
   * Uses a per-wallet random salt — no hardcoded suffix.
   */
  async setDuressWallet(duressSeed: string, duressPassword: string): Promise<void> {
    const salt           = crypto.getRandomValues(new Uint8Array(16));
    const hash           = await this.hashWithSalt(duressPassword, salt);
    const encryptedDecoy = await this.encrypt(duressSeed, duressPassword);

    localStorage.setItem('duressSalt',            btoa(String.fromCharCode(...salt)));
    localStorage.setItem('duressHash',            hash);
    localStorage.setItem('encryptedDuressWallet', encryptedDecoy);
    localStorage.setItem('hasDuressPassword',     'true');
  }

  /** @deprecated Use setDuressWallet instead. Kept for settings page compat. */
  async setDuressPassword(password: string): Promise<void> {
    // Without the decoy seed we can't do a full setup here.
    // Settings page should call setDuressWallet(duressSeed, password) instead.
    // This stub prevents hard errors if called from old code paths.
    console.warn('setDuressPassword: provide a duress seed via setDuressWallet()');
  }

  hasDuressPassword(): boolean {
    return localStorage.getItem('hasDuressPassword') === 'true';
  }

  clearDuressPassword(): void {
    [
      'duressSalt', 'duressHash', 'encryptedDuressWallet',
      'hasDuressPassword',
      // legacy keys
      'hashedDuressPassword', 'encryptedDuressPassword',
    ].forEach(k => localStorage.removeItem(k));
  }

  // ── Wallet Cleanup ─────────────────────────────────────────────────────────

  async lock(): Promise<void> {
    _isDuressMode = false;
    await secureKeyManager.lock().catch(() => {});
  }

  clearWallet(): void {
    _isDuressMode = false;
    ['encryptedWallet', 'cachedBalances'].forEach(k => localStorage.removeItem(k));
    this.clearDuressPassword();
    secureKeyManager.lock().catch(() => {});
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  /** SHA-256 with a per-call random salt. Returns lowercase hex. */
  private async hashWithSalt(input: string, salt: Uint8Array): Promise<string> {
    const encoded  = new TextEncoder().encode(input);
    const combined = new Uint8Array(salt.length + encoded.length);
    combined.set(salt);
    combined.set(encoded, salt.length);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /** Throw if Service Workers are unavailable. No silent fallback. */
  private async requireServiceWorker(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error(
        'Rivara Wallet requires Service Worker support. Please use a modern browser.',
      );
    }
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      throw new Error('Service Worker is not active. Please reload the page.');
    }
  }

  /**
   * Silently migrate legacy base64/static-salt duress entries.
   * Can't re-hash without the original password so just wipes them.
   * No-op once already migrated.
   */
  private migrateLegacyDuress(): void {
    const hasLegacy =
      localStorage.getItem('encryptedDuressPassword') ||
      localStorage.getItem('hashedDuressPassword');

    if (!hasLegacy) return;

    localStorage.removeItem('encryptedDuressPassword');
    localStorage.removeItem('hashedDuressPassword');
    localStorage.removeItem('hasDuressPassword');
    console.info(
      'Rivara: Legacy duress data removed. Please re-configure your duress password in Settings.',
    );
  }
}

export const encryptionService = new EncryptionService();
