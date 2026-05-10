/*
 * Rivara Wallet - Secure Service Worker
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 * 
 * This Service Worker holds the non-extractable CryptoKey
 * Main thread cannot access it directly - must send messages
 */

let cryptoKey = null;
let salt = null;
let lockTimeout = null;
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

// Reset auto-lock timer
function resetLockTimer() {
  if (lockTimeout) {
    clearTimeout(lockTimeout);
  }
  lockTimeout = setTimeout(() => {
    console.log('[SecureWorker] Auto-locking due to inactivity');
    cryptoKey = null;
    salt = null;
  }, AUTO_LOCK_MS);
}

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;

  try {
    let response = { success: true, data: null };

    switch (type) {
      case 'DERIVE_AND_STORE_KEY': {
        // SECURITY: Derive key INSIDE Service Worker
        // Password comes in, key NEVER leaves
        const { password, salt: saltArray } = payload;
        
        console.log('[SecureWorker] Deriving key with', saltArray.length, 'byte salt');
        
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        // Import password as key material
        const importedKey = await crypto.subtle.importKey(
          'raw',
          passwordBuffer,
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
        );
        
        salt = new Uint8Array(saltArray);
        
        // Derive the actual encryption key (NON-EXTRACTABLE)
        console.log('[SecureWorker] Starting PBKDF2 derivation (600k iterations)...');
        cryptoKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 600000,
            hash: 'SHA-256'
          },
          importedKey,
          { name: 'AES-GCM', length: 256 },
          false, // ❌ NON-EXTRACTABLE - Cannot be exported, ever
          ['decrypt']
        );
        
        resetLockTimer();
        
        console.log('[SecureWorker] ✅ Key derived and stored securely (non-extractable)');
        response.data = { stored: true };
        break;
      }

      case 'DECRYPT_WALLET': {
        if (!cryptoKey) {
          throw new Error('No key stored - wallet is locked');
        }

        const { encryptedData } = payload;
        
        // Convert from base64
        const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extract salt, iv, and encrypted data
        const storedSalt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const encrypted = data.slice(28);

        // Decrypt using the non-extractable key
        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          cryptoKey,
          encrypted
        );

        // Convert back to string
        const decoder = new TextDecoder();
        const seedPhrase = decoder.decode(decryptedData);

        resetLockTimer();
        response.data = seedPhrase;
        break;
      }

      case 'LOCK': {
        cryptoKey = null;
        salt = null;
        if (lockTimeout) {
          clearTimeout(lockTimeout);
          lockTimeout = null;
        }
        console.log('[SecureWorker] Wallet locked');
        response.data = { locked: true };
        break;
      }

      case 'PING': {
        response.data = { 
          hasKey: cryptoKey !== null,
          autoLockIn: lockTimeout ? AUTO_LOCK_MS : 0
        };
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send response back to main thread
    event.ports[0]?.postMessage({ id, ...response }) || 
      event.source.postMessage({ id, ...response });

  } catch (error) {
    console.error('[SecureWorker] Error:', error);
    event.ports[0]?.postMessage({ 
      id, 
      success: false, 
      error: error.message 
    }) || event.source.postMessage({ 
      id, 
      success: false, 
      error: error.message 
    });
  }
});

// Service Worker lifecycle
self.addEventListener('install', (event) => {
  console.log('[SecureWorker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SecureWorker] Activated');
  event.waitUntil(self.clients.claim());
});

console.log('[SecureWorker] Loaded and ready');
