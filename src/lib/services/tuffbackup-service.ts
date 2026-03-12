/**
 * Tuffbackup Service
 * Handles encrypted wallet backup and restore
 * SECURITY FIX 6: HMAC integrity verification added to backup files
 */

import { encryptionService } from './encryption-service';

// HMAC helper functions
async function deriveHmacKey(password: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	const salt = encoder.encode('tuffbackup-hmac-salt-v1');
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
		keyMaterial,
		{ name: 'HMAC', hash: 'SHA-256', length: 256 },
		false,
		['sign', 'verify']
	);
}

async function computeBackupHmac(data: string, password: string): Promise<string> {
	const key = await deriveHmacKey(password);
	const encoded = new TextEncoder().encode(data);
	const sig = await crypto.subtle.sign('HMAC', key, encoded);
	return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyBackupHmac(data: string, hmac: string, password: string): Promise<boolean> {
	const key = await deriveHmacKey(password);
	const encoded = new TextEncoder().encode(data);
	const sigBytes = Uint8Array.from(atob(hmac), c => c.charCodeAt(0));
	return crypto.subtle.verify('HMAC', key, sigBytes, encoded);
}

class TuffbackupService {
	/**
	 * Create a Tuffbackup file
	 * @param password - User's password (needed for HMAC)
	 * @returns Blob containing encrypted backup with HMAC
	 */
	async createBackup(password?: string): Promise<Blob | null> {
		try {
			// Get encrypted wallet from localStorage
			const encryptedWallet = localStorage.getItem('encryptedWallet');

			if (!encryptedWallet) {
				return null;
			}

			// Create backup payload (everything except HMAC)
			const backupPayload = {
				version: '2.0',
				timestamp: new Date().toISOString(),
				encryptedWallet: encryptedWallet
			};

			const payloadJson = JSON.stringify(backupPayload);

			// SECURITY FIX 6: Add HMAC for integrity verification
			let hmac = '';
			if (password) {
				hmac = await computeBackupHmac(payloadJson, password);
			}

			// Final backup object with HMAC
			const backupData = {
				...backupPayload,
				hmac: hmac
			};

			// Convert to JSON string
			const backupJson = JSON.stringify(backupData);

			// Create blob
			const blob = new Blob([backupJson], { type: 'application/json' });

			return blob;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Download Tuffbackup file
	 */
	async downloadBackup(password?: string): Promise<boolean> {
		try {
			const blob = await this.createBackup(password);

			if (!blob) {
				return false;
			}

			// Create download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `tuffbackup.rivara`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Restore wallet from Tuffbackup file
	 * @param file - Tuffbackup file
	 * @param password - User's password
	 * @returns Success status
	 */
	async restoreBackup(file: File, password: string): Promise<boolean> {
		try {
			// Read file
			const text = await file.text();
			const backupData = JSON.parse(text);

			// Validate backup structure
			if (!backupData.encryptedWallet || !backupData.version) {
				return false;
			}

			// SECURITY FIX 6: Verify HMAC if present (v2.0+ backups)
			if (backupData.hmac) {
				// Reconstruct the payload that was signed
				const payloadObj = {
					version: backupData.version,
					timestamp: backupData.timestamp,
					encryptedWallet: backupData.encryptedWallet
				};
				const payloadJson = JSON.stringify(payloadObj);

				const valid = await verifyBackupHmac(payloadJson, backupData.hmac, password);
				if (!valid) {
					throw new Error('Backup integrity check failed — file may have been tampered with');
				}
			}

			// Try to decrypt the wallet to verify password
			const decrypted = await encryptionService.decrypt(backupData.encryptedWallet, password);

			if (!decrypted) {
				return false;
			}

			// Store encrypted wallet
			localStorage.setItem('encryptedWallet', backupData.encryptedWallet);

			return true;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Validate Tuffbackup file
	 * @param file - File to validate
	 * @returns Validation result
	 */
	async validateBackupFile(file: File): Promise<{ valid: boolean; version?: string; timestamp?: string; hasHmac?: boolean }> {
		try {
			const text = await file.text();
			const backupData = JSON.parse(text);

			if (!backupData.encryptedWallet || !backupData.version) {
				return { valid: false };
			}

			return {
				valid: true,
				version: backupData.version,
				timestamp: backupData.timestamp,
				hasHmac: !!backupData.hmac
			};
		} catch (error) {
			return { valid: false };
		}
	}
}

export const tuffbackupService = new TuffbackupService();
