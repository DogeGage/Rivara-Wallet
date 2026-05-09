/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
/**
 * Encryption Service - Encrypt/decrypt seed phrases with password
 */
class EncryptionService {
  private duressPassword: string | null = null;
  // Derive encryption key from password using PBKDF2
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  // Encrypt seed phrase with password
  async encrypt(seedPhrase: string, password: string): Promise<string> {
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
        { name: "AES-GCM", iv: iv },
        key,
        data,
      );

      // Combine salt + iv + encrypted data
      const result = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength,
      );
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt seed phrase");
    }
  }

  // Decrypt seed phrase with password
  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Convert from base64
      const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

      // Extract salt, iv, and encrypted data
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encrypted,
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Invalid password or corrupted data");
    }
  }

  // Check if wallet exists in storage
  hasStoredWallet(): boolean {
    return localStorage.getItem("encryptedWallet") !== null;
  }

  // Save encrypted wallet to localStorage
  async saveWallet(
    seedPhrase: string,
    password: string,
    duressPassword?: string,
  ): Promise<void> {
    const encrypted = await this.encrypt(seedPhrase, password);
    localStorage.setItem("encryptedWallet", encrypted);

    // Store duress password if provided
    if (duressPassword) {
      this.duressPassword = duressPassword;
      localStorage.setItem("hasDuressPassword", "true");
    }

    console.log("Wallet saved to localStorage (encrypted)");
  }

  // Load and decrypt wallet from localStorage
  async loadWallet(password: string): Promise<string> {
    const encrypted = localStorage.getItem("encryptedWallet");
    if (!encrypted) {
      throw new Error("No wallet found in storage");
    }

    // Check duress password first
    const hashedDuress = localStorage.getItem("hashedDuressPassword");
    if (hashedDuress) {
      const inputHash = await this.hashString(password);
      if (inputHash === hashedDuress) {
        return "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      }
    }

    // Fallback for older wallets that still use base64
    const legacyDuress = localStorage.getItem("encryptedDuressPassword");
    if (legacyDuress) {
      try {
        if (password === atob(legacyDuress)) {
          // Auto-upgrade to secure hash
          await this.setDuressPassword(password);
          return "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        }
      } catch {}
    }

    return await this.decrypt(encrypted, password);
  }

  // Helper to securely hash the duress password
  private async hashString(input: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(input + "rivara_salt_duress");
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Set duress password
  async setDuressPassword(password: string): Promise<void> {
    this.duressPassword = password;
    // Store securely hashed password instead of base64
    const hashed = await this.hashString(password);
    localStorage.setItem("hashedDuressPassword", hashed);
    localStorage.removeItem("encryptedDuressPassword"); // Clear legacy
    localStorage.setItem("hasDuressPassword", "true");
  }

  // Check if duress password is set
  hasDuressPassword(): boolean {
    return localStorage.getItem("hasDuressPassword") === "true";
  }

  // Clear duress password
  clearDuressPassword(): void {
    this.duressPassword = null;
    localStorage.removeItem("hashedDuressPassword");
    localStorage.removeItem("encryptedDuressPassword");
    localStorage.removeItem("hasDuressPassword");
  }

  // Clear wallet from storage
  clearWallet(): void {
    localStorage.removeItem("encryptedWallet");
    localStorage.removeItem("cachedBalances");
    this.clearDuressPassword();
    console.log("Wallet cleared from localStorage");
  }
}

export const encryptionService = new EncryptionService();
