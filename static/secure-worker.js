/*
 * Rivara Wallet - Secure Service Worker
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 *
 * Holds the non-extractable AES-GCM CryptoKey in SW scope.
 * The main thread communicates via postMessage — the key never leaves this scope.
 */

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

let cryptoKey    = null;
let lockTimeout  = null;
let lockDeadline = 0; // absolute timestamp when the lock fires

// ─── Auto-lock ───────────────────────────────────────────────────────────────

function resetLockTimer() {
  if (lockTimeout) clearTimeout(lockTimeout);
  lockDeadline = Date.now() + AUTO_LOCK_MS;
  lockTimeout  = setTimeout(lockNow, AUTO_LOCK_MS);
}

function lockNow() {
  cryptoKey    = null;
  lockTimeout  = null;
  lockDeadline = 0;
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.addEventListener('message', async (event) => {
  // Reject messages from any origin other than our own app.
  if (event.origin !== self.location.origin) return;

  const { id, type, payload } = event.data ?? {};

  const reply = (data) =>
    (event.ports[0] ?? event.source)?.postMessage({ id, success: true,  data });
  const fail  = (msg)  =>
    (event.ports[0] ?? event.source)?.postMessage({ id, success: false, error: msg });

  try {
    switch (type) {

      case 'DERIVE_AND_STORE_KEY': {
        const { password, salt: saltArray } = payload;
        const salt = new Uint8Array(saltArray);

        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          { name: 'PBKDF2' },
          false,
          ['deriveKey'],
        );

        // NON-EXTRACTABLE — cannot be exported from SW scope, ever.
        cryptoKey = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt'],
        );

        resetLockTimer();
        reply({ stored: true });
        break;
      }

      case 'DECRYPT_WALLET': {
        if (!cryptoKey) { fail('No key stored — wallet is locked'); break; }

        const raw       = Uint8Array.from(atob(payload.encryptedData), c => c.charCodeAt(0));
        const iv        = raw.slice(16, 28);
        const encrypted = raw.slice(28);

        const plaintext = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          encrypted,
        );

        resetLockTimer();
        reply(new TextDecoder().decode(plaintext));
        break;
      }

      case 'LOCK': {
        lockNow();
        reply({ locked: true });
        break;
      }

      case 'PING': {
        reply({
          hasKey:     cryptoKey !== null,
          // Remaining ms until auto-lock fires (0 if already locked / no timer)
          autoLockIn: lockDeadline > 0 ? Math.max(0, lockDeadline - Date.now()) : 0,
        });
        break;
      }

      default:
        fail(`Unknown message type: ${type}`);
    }
  } catch (err) {
    fail(err?.message ?? 'Unknown error');
  }
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install',  ()      => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
