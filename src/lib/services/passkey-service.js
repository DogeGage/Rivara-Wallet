/**
 * Rivara Wallet - Desktop Edition
 * Copyright (c) 2024-2026 Rivara
 * Source Available License - See LICENSE file
 * https://github.com/dominic84p/Rivara-Wallet
 */

// Passkey Service - WebAuthn support for wallet unlocking
class PasskeyService {
    
    constructor() {
        this.rpName = 'Rivara Wallet';
        // Don't set rpId - let browser use the origin automatically
        this.rpId = undefined;
    }
    
    // Check if WebAuthn is supported
    isSupported() {
        // Check basic WebAuthn support
        if (window.PublicKeyCredential === undefined || navigator.credentials === undefined) {
            return false;
        }
        
        // Check protocol - must be https or http://localhost
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // Tauri apps won't work
        if (protocol === 'tauri:' || window.__TAURI__) {
            console.warn('Passkeys not supported in Tauri desktop apps');
            return false;
        }
        
        // file:// protocol won't work
        if (protocol === 'file:') {
            console.warn('Passkeys require http://localhost or https://');
            return false;
        }
        
        // Must be https or localhost
        if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
            console.warn('Passkeys require HTTPS or localhost');
            return false;
        }
        
        return true;
    }
    
    // Check if passkey is registered
    hasPasskey() {
        return localStorage.getItem('passkeyCredentialId') !== null;
    }
    
    // Register a new passkey
    async register(userId = 'user') {
        if (!this.isSupported()) {
            throw new Error('Passkeys are not supported in this browser');
        }
        
        try {
            // Generate challenge
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            
            // Create credential options
            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: this.rpName
                },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: userId,
                    displayName: 'Rivara User'
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },  // ES256
                    { alg: -257, type: 'public-key' } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    requireResidentKey: true,
                    residentKey: 'required',
                    userVerification: 'required'
                },
                timeout: 60000,
                attestation: 'none'
            };
            
            // Create credential
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });
            
            if (!credential) {
                throw new Error('Failed to create passkey');
            }
            
            // Store credential ID
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem('passkeyCredentialId', credentialId);
            localStorage.setItem('passkeyChallenge', btoa(String.fromCharCode(...challenge)));
            
            console.log('Passkey registered successfully');
            return true;
            
        } catch (error) {
            console.error('Passkey registration failed:', error);
            throw new Error('Failed to register passkey: ' + error.message);
        }
    }
    
    // Authenticate with passkey
    async authenticate() {
        if (!this.isSupported()) {
            throw new Error('Passkeys are not supported in this browser');
        }
        
        if (!this.hasPasskey()) {
            throw new Error('No passkey registered');
        }
        
        try {
            // Generate new challenge
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            
            // Get stored credential ID
            const credentialIdBase64 = localStorage.getItem('passkeyCredentialId');
            const credentialId = Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0));
            
            // Create authentication options
            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: credentialId,
                    type: 'public-key',
                    transports: ['internal']
                }],
                timeout: 60000,
                userVerification: 'required'
            };
            
            // Get credential
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });
            
            if (!assertion) {
                throw new Error('Authentication failed');
            }
            
            console.log('Passkey authentication successful');
            return true;
            
        } catch (error) {
            console.error('Passkey authentication failed:', error);
            throw new Error('Failed to authenticate with passkey: ' + error.message);
        }
    }
    
    // Remove passkey
    removePasskey() {
        localStorage.removeItem('passkeyCredentialId');
        localStorage.removeItem('passkeyChallenge');
        localStorage.removeItem('passkeyEncryptedPassword');
        console.log('Passkey removed');
    }
    
    // Store encrypted password for passkey unlock
    async storePasswordForPasskey(password) {
        // Generate a key from the passkey credential
        const key = await this.derivePasskeyKey();
        
        // Encrypt the password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        // Store encrypted password and IV
        const result = new Uint8Array(iv.length + encryptedData.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedData), iv.length);
        
        localStorage.setItem('passkeyEncryptedPassword', btoa(String.fromCharCode(...result)));
    }
    
    // Retrieve password using passkey
    async retrievePasswordWithPasskey() {
        // Authenticate first
        await this.authenticate();
        
        // Get encrypted password
        const encryptedBase64 = localStorage.getItem('passkeyEncryptedPassword');
        if (!encryptedBase64) {
            throw new Error('No stored password found');
        }
        
        const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = data.slice(0, 12);
        const encrypted = data.slice(12);
        
        // Derive key and decrypt
        const key = await this.derivePasskeyKey();
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    }
    
    // Derive encryption key from passkey credential
    async derivePasskeyKey() {
        const credentialId = localStorage.getItem('passkeyCredentialId');
        if (!credentialId) {
            throw new Error('No passkey registered');
        }
        
        // Use credential ID as key material
        const keyMaterial = new TextEncoder().encode(credentialId);
        
        const importedKey = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const salt = new TextEncoder().encode('rivara-passkey-salt');
        
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
}

const passkeyService = new PasskeyService();
