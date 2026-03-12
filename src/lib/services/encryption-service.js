/**
 * Rivara Wallet
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

// Encryption Service - Encrypt/decrypt seed phrases with password
class EncryptionService {
    
    // Derive encryption key from password using PBKDF2
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const importedKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            importedKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    // Encrypt seed phrase with password
    async encrypt(seedPhrase, password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(seedPhrase);
            
            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Encrypt the data
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );
            
            // Combine salt + iv + encrypted data
            const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);
            
            // Convert to base64 for storage
            return btoa(String.fromCharCode(...result));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt seed phrase');
        }
    }
    
    // Decrypt seed phrase with password
    async decrypt(encryptedData, password) {
        try {
            // Convert from base64
            const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract salt, iv, and encrypted data
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Invalid password or corrupted data');
        }
    }
    
    // Check if wallet exists in storage
    hasStoredWallet() {
        return localStorage.getItem('encryptedWallet') !== null;
    }
    
    // Save encrypted wallet to localStorage
    async saveWallet(seedPhrase, password) {
        const encrypted = await this.encrypt(seedPhrase, password);
        localStorage.setItem('encryptedWallet', encrypted);
        console.log('Wallet saved to localStorage (encrypted)');
    }
    
    // Load and decrypt wallet from localStorage
    async loadWallet(password) {
        const encrypted = localStorage.getItem('encryptedWallet');
        if (!encrypted) {
            throw new Error('No wallet found in storage');
        }
        
        return await this.decrypt(encrypted, password);
    }
    
    // Clear wallet from storage
    clearWallet() {
        localStorage.removeItem('encryptedWallet');
        console.log('Wallet cleared from localStorage');
    }
}

export const encryptionService = new EncryptionService();
