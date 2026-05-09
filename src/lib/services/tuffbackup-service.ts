/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
/**
 * Tuffbackup Service
 * Handles encrypted wallet backup and restore
 * SECURITY FIX 6: HMAC integrity verification added to backup files
 * v3.0: Includes derived private keys and address book
 */

import { encryptionService } from "./encryption-service";

// HMAC helper functions
async function deriveHmacKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  const salt = encoder.encode("tuffbackup-hmac-salt-v1");
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}

async function computeBackupHmac(
  data: string,
  password: string,
): Promise<string> {
  const key = await deriveHmacKey(password);
  const encoded = new TextEncoder().encode(data);
  const sig = await crypto.subtle.sign("HMAC", key, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyBackupHmac(
  data: string,
  hmac: string,
  password: string,
): Promise<boolean> {
  const key = await deriveHmacKey(password);
  const encoded = new TextEncoder().encode(data);
  const sigBytes = Uint8Array.from(atob(hmac), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoded);
}

/** Encrypt a string with AES-GCM using the wallet password */
async function encryptField(
  plaintext: string,
  password: string,
): Promise<string> {
  return encryptionService.encrypt(plaintext, password);
}

class TuffbackupService {
  /**
   * Create a Tuffbackup file (v3.0)
   * Includes: encrypted seed, encrypted private keys per chain, encrypted address book, HMAC
   */
  async createBackup(password: string): Promise<Blob | null> {
    try {
      const encryptedWallet = localStorage.getItem("encryptedWallet");
      if (!encryptedWallet) return null;

      // Derive private keys from mnemonic
      let encryptedPrivateKeys: Record<string, string> = {};
      try {
        const mnemonic = await encryptionService.decrypt(
          encryptedWallet,
          password,
        );
        // @ts-ignore
        const { ethers, bitcoin } = window.cryptoLibs;

        if (ethers && mnemonic) {
          // EVM (ETH + Polygon)
          const evmWallet = ethers.Wallet.fromMnemonic(mnemonic);
          encryptedPrivateKeys.ethereum = await encryptField(
            evmWallet.privateKey,
            password,
          );
          encryptedPrivateKeys.polygon = encryptedPrivateKeys.ethereum; // same key

          // Tron
          const tronNode =
            ethers.utils.HDNode.fromMnemonic(mnemonic).derivePath(
              "m/44'/195'/0'/0/0",
            );
          encryptedPrivateKeys.tron = await encryptField(
            tronNode.privateKey.slice(2),
            password,
          );

          // Solana
          try {
            // @ts-ignore
            const solKeys = await getTezosEd25519Keys(
              mnemonic,
              "m/44'/501'/0'/0'",
            );
            const solPrivHex = Array.from(solKeys.privateKey.slice(0, 32))
              .map((b: number) => b.toString(16).padStart(2, "0"))
              .join("");
            encryptedPrivateKeys.solana = await encryptField(
              solPrivHex,
              password,
            );
          } catch {}

          // Bitcoin / UTXO
          if (bitcoin) {
            try {
              const seed = ethers.utils.mnemonicToSeed(mnemonic);
              const seedBuffer = Buffer.from(seed.slice(2), "hex");
              const root = bitcoin.bip32.fromSeed(seedBuffer);
              const btcChild = root.derivePath("m/44'/0'/0'/0/0");
              const dogeChild = root.derivePath("m/44'/3'/0'/0/0");
              const ltcChild = root.derivePath("m/44'/2'/0'/0/0");
              encryptedPrivateKeys.bitcoin = await encryptField(
                btcChild.privateKey!.toString("hex"),
                password,
              );
              encryptedPrivateKeys.dogecoin = await encryptField(
                dogeChild.privateKey!.toString("hex"),
                password,
              );
              encryptedPrivateKeys.litecoin = await encryptField(
                ltcChild.privateKey!.toString("hex"),
                password,
              );
            } catch {}
          }
        }
      } catch {
        // Wrong password or libs not loaded — skip private keys, still back up seed
      }

      // Address book
      const rawAddressBook = localStorage.getItem("addressBook");
      const encryptedAddressBook = rawAddressBook
        ? await encryptField(rawAddressBook, password)
        : null;

      // Build payload
      const backupPayload = {
        version: "3.0",
        timestamp: new Date().toISOString(),
        encryptedWallet,
        encryptedPrivateKeys,
        encryptedAddressBook,
      };

      const payloadJson = JSON.stringify(backupPayload);
      const hmac = await computeBackupHmac(payloadJson, password);

      const backupData = { ...backupPayload, hmac };
      return new Blob([JSON.stringify(backupData)], {
        type: "application/json",
      });
    } catch {
      return null;
    }
  }

  /**
   * Download Tuffbackup file
   */
  async downloadBackup(password?: string): Promise<boolean> {
    try {
      const blob = password
        ? await this.createBackup(password)
        : await this.createBackupLegacy();

      if (!blob) return false;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tuffbackup.rivara`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch {
      return false;
    }
  }

  /** Legacy v2.0 backup (no password provided) */
  private async createBackupLegacy(): Promise<Blob | null> {
    const encryptedWallet = localStorage.getItem("encryptedWallet");
    if (!encryptedWallet) return null;

    const backupPayload = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      encryptedWallet,
    };

    return new Blob([JSON.stringify(backupPayload)], {
      type: "application/json",
    });
  }

  /**
   * Restore wallet from Tuffbackup file
   */
  async restoreBackup(
    file: File,
    password: string,
  ): Promise<{ addressBookRestored: boolean; privateKeysRestored: string[] }> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.encryptedWallet || !backupData.version)
        throw new Error("Invalid backup file");

      // Verify HMAC if present (v2.0+ backups)
      if (backupData.hmac) {
        const payloadObj: Record<string, any> = {
          version: backupData.version,
          timestamp: backupData.timestamp,
          encryptedWallet: backupData.encryptedWallet,
        };
        if (backupData.version === "3.0") {
          payloadObj.encryptedPrivateKeys = backupData.encryptedPrivateKeys;
          payloadObj.encryptedAddressBook = backupData.encryptedAddressBook;
        }
        const valid = await verifyBackupHmac(
          JSON.stringify(payloadObj),
          backupData.hmac,
          password,
        );
        if (!valid)
          throw new Error(
            "Backup integrity check failed — file may have been tampered with",
          );
      }

      // Verify password decrypts the wallet
      await encryptionService.decrypt(backupData.encryptedWallet, password);

      // Restore wallet
      localStorage.setItem("encryptedWallet", backupData.encryptedWallet);

      // Restore address book if present
      let addressBookRestored = false;
      if (backupData.encryptedAddressBook) {
        try {
          const addressBook = await encryptionService.decrypt(
            backupData.encryptedAddressBook,
            password,
          );
          const existing = localStorage.getItem("addressBook");
          // Merge: backup entries take precedence, but don't overwrite if identical
          if (existing !== addressBook) {
            if (existing) {
              try {
                const existingEntries = JSON.parse(existing);
                const backupEntries = JSON.parse(addressBook);
                // Merge by address — backup wins on conflict
                const merged = { ...existingEntries };
                for (const [addr, label] of Object.entries(backupEntries)) {
                  merged[addr] = label;
                }
                localStorage.setItem("addressBook", JSON.stringify(merged));
              } catch {
                localStorage.setItem("addressBook", addressBook);
              }
            } else {
              localStorage.setItem("addressBook", addressBook);
            }
            addressBookRestored = true;
          }
        } catch {}
      }

      // Restore private keys if present (v3.0+)
      const privateKeysRestored: string[] = [];
      if (backupData.encryptedPrivateKeys) {
        const existing = localStorage.getItem("encryptedPrivateKeys");
        const existingKeys: Record<string, string> = existing
          ? JSON.parse(existing)
          : {};

        for (const [chain, encryptedKey] of Object.entries(
          backupData.encryptedPrivateKeys,
        ) as [string, string][]) {
          try {
            const privKey = await encryptionService.decrypt(
              encryptedKey,
              password,
            );
            // Only store if not already present or different
            if (!existingKeys[chain]) {
              existingKeys[chain] = encryptedKey; // store still encrypted
              privateKeysRestored.push(chain);
            }
          } catch {}
        }

        if (privateKeysRestored.length > 0) {
          localStorage.setItem(
            "encryptedPrivateKeys",
            JSON.stringify(existingKeys),
          );
        }
      }

      return { addressBookRestored, privateKeysRestored };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate Tuffbackup file
   */
  async validateBackupFile(file: File): Promise<{
    valid: boolean;
    version?: string;
    timestamp?: string;
    hasHmac?: boolean;
    hasPrivateKeys?: boolean;
    hasAddressBook?: boolean;
  }> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.encryptedWallet || !backupData.version)
        return { valid: false };

      return {
        valid: true,
        version: backupData.version,
        timestamp: backupData.timestamp,
        hasHmac: !!backupData.hmac,
        hasPrivateKeys:
          !!backupData.encryptedPrivateKeys &&
          Object.keys(backupData.encryptedPrivateKeys).length > 0,
        hasAddressBook: !!backupData.encryptedAddressBook,
      };
    } catch {
      return { valid: false };
    }
  }
}

export const tuffbackupService = new TuffbackupService();
