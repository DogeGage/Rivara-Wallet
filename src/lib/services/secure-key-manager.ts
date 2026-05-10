/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */

/**
 * Secure Key Manager — Service Worker Communication
 *
 * Key derivation and storage happen entirely inside the Service Worker.
 * The main thread never holds a CryptoKey or raw key material.
 */

export interface KeyManagerMessage {
  type:
    | 'DERIVE_AND_STORE_KEY'
    | 'DECRYPT_WALLET'
    | 'SIGN_TRANSACTION'
    | 'LOCK'
    | 'PING';
  payload?: any;
}

export interface KeyManagerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Internal type — not exported, only used by the pending-request map
interface PendingRequest {
  resolve: (value: any) => void;
  reject:  (error: any)  => void;
  timer:   ReturnType<typeof setTimeout>;
}

class SecureKeyManager {
  private messageId = 0;
  private pendingRequests = new Map<number, PendingRequest>();

  constructor() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      // Drop messages that didn't come from our own SW
      if (event.origin !== window.location.origin) return;

      const { id, success, data, error } = event.data ?? {};
      const pending = this.pendingRequests.get(id);
      if (!pending) return;

      // Cancel the timeout now that we have a response
      clearTimeout(pending.timer);
      this.pendingRequests.delete(id);

      if (success) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error ?? 'Service worker error'));
      }
    });
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async sendMessage(type: string, payload?: any): Promise<any> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this environment');
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      throw new Error('Service Worker is not active');
    }

    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      // Store timer handle so we can cancel it on success
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Service Worker request timed out (type: ${type})`));
        }
      }, 10_000);

      this.pendingRequests.set(id, { resolve, reject, timer });
      registration.active!.postMessage({ id, type, payload });
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Send password + salt to the Service Worker.
   * Key derivation (PBKDF2 → AES-GCM) happens entirely inside the SW.
   * The CryptoKey never touches the main thread.
   */
  async deriveAndStoreKey(password: string, salt: Uint8Array): Promise<void> {
    await this.sendMessage('DERIVE_AND_STORE_KEY', {
      password,
      salt: Array.from(salt),
    });

    // JS strings are immutable so we can't zero the buffer,
    // but dropping our reference lets the GC collect it.
    password = '';
  }

  /**
   * Decrypt an encrypted wallet blob using the key held in the SW.
   * Returns the plaintext seed — only call this when you need to
   * display the seed phrase. For send flows, prefer signTransaction().
   */
  async decryptWallet(encryptedData: string): Promise<string> {
    return this.sendMessage('DECRYPT_WALLET', { encryptedData });
  }

  /**
   * Sign a transaction payload inside the SW.
   * The seed is decrypted and used entirely within SW scope —
   * only the signature is returned to the main thread.
   */
  async signTransaction(txPayload: object): Promise<string> {
    return this.sendMessage('SIGN_TRANSACTION', { txPayload });
  }

  /**
   * Wipe the CryptoKey from Service Worker memory and lock the wallet.
   */
  async lock(): Promise<void> {
    await this.sendMessage('LOCK');
  }

  /**
   * Returns true if the SW currently holds a derived key (wallet is unlocked).
   */
  async isUnlocked(): Promise<boolean> {
    try {
      const result = await this.sendMessage('PING');
      // Optional chaining guards against unexpected SW response shapes
      return result?.hasKey === true;
    } catch {
      return false;
    }
  }
}

export const secureKeyManager = new SecureKeyManager();