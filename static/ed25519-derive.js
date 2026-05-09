/**
 * SLIP-0010 Ed25519 key derivation utility
 * Used for Solana (m/44'/501'/0'/0') key derivation.
 *
 * Note: The legacy function name getTezosEd25519Keys is preserved for
 * compatibility with existing call sites. This is a general-purpose
 * SLIP-0010 Ed25519 hardened derivation function — not Tezos-specific.
 *
 * Requires: ethers (for mnemonicToSeed), nacl (tweetnacl, for sign keypair)
 * Both are loaded from CDN in app.html before this script.
 */
(function () {
    /**
     * HMAC-SHA512 using Web Crypto API
     */
    async function hmacSha512(key, data) {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
        return new Uint8Array(sig);
    }

    /**
     * Hex string (with or without 0x prefix) → Uint8Array
     */
    function hexToBytes(hex) {
        const h = hex.startsWith('0x') ? hex.slice(2) : hex;
        const bytes = new Uint8Array(h.length / 2);
        for (let i = 0; i < h.length; i += 2) {
            bytes[i >> 1] = parseInt(h.slice(i, i + 2), 16);
        }
        return bytes;
    }

    /**
     * Derive Ed25519 keypair from mnemonic + BIP44 path using SLIP-0010.
     *
     * All path components MUST be hardened (') — Ed25519 SLIP-0010
     * does not support non-hardened derivation.
     *
     * @param {string} mnemonic  BIP39 mnemonic phrase
     * @param {string} path      Derivation path, e.g. "m/44'/501'/0'/0'"
     * @returns {Promise<{privateKey: Uint8Array, publicKey: Uint8Array}>}
     */
    async function getTezosEd25519Keys(mnemonic, path) {
        // 1. Seed from mnemonic (ethers v5 sync/async both work)
        const seedHex = await ethers.utils.mnemonicToSeed(mnemonic);
        const seed = hexToBytes(seedHex);

        // 2. SLIP-0010 master key: HMAC-SHA512("ed25519 seed", seed)
        const masterKey = await hmacSha512(
            new TextEncoder().encode('ed25519 seed'),
            seed
        );
        let kL = masterKey.slice(0, 32);   // private key material
        let kR = masterKey.slice(32);      // chain code

        // 3. Derive each path component
        const segments = path.replace(/^m\//, '').split('/').filter(Boolean);

        for (const segment of segments) {
            const hardened = segment.endsWith("'");
            const index = parseInt(hardened ? segment.slice(0, -1) : segment, 10);

            if (!hardened) {
                throw new Error(
                    'SLIP-0010 Ed25519 only supports hardened derivation. ' +
                    `Non-hardened index ${index} found in path "${path}".`
                );
            }

            const indexWithOffset = (index + 0x80000000) >>> 0; // force uint32

            // data = 0x00 || kL (32 bytes) || index (4 bytes big-endian)
            const indexBytes = new Uint8Array(4);
            new DataView(indexBytes.buffer).setUint32(0, indexWithOffset, false);

            const data = new Uint8Array(37); // 1 + 32 + 4
            data[0] = 0x00;
            data.set(kL, 1);
            data.set(indexBytes, 33);

            const child = await hmacSha512(kR, data);
            kL = child.slice(0, 32);
            kR = child.slice(32);
        }

        // 4. Public key via nacl (tweetnacl)
        const keypair = nacl.sign.keyPair.fromSeed(kL);

        return {
            privateKey: kL,          // 32-byte seed / private scalar
            publicKey: keypair.publicKey  // 32-byte Ed25519 public key
        };
    }

    // Expose as global so all call sites (solana-service, key-derivation-service,
    // tuffbackup-service, settings) can reach it without importing.
    window.getTezosEd25519Keys = getTezosEd25519Keys;
})();
