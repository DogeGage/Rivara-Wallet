// Tezos Transaction Sending
// SECURITY: Derives private key on-demand, clears after use
import { walletService } from '../wallet-service';
import { deriveTezosEdsk } from '../key-derivation-service';

class TezosSendService {
    constructor() {
        // Try different RPC endpoints
        this.rpcUrl = 'https://mainnet.smartpy.io';
        // this.rpcUrl = 'https://rpc.tzbeta.net';
        // this.rpcUrl = 'https://mainnet.api.tez.ie'; // current (broken)
    }

    // Derive tz1 address from public key
    _addressFromPublicKey(publicKey) {
        const pubKeyBytes = publicKey instanceof Uint8Array ? publicKey : new Uint8Array(publicKey);
        const pkHash = window.blake2b(pubKeyBytes, null, 20);
        
        const tz1Prefix = new Uint8Array([6, 161, 159]);
        const payload = new Uint8Array(tz1Prefix.length + pkHash.length);
        payload.set(tz1Prefix);
        payload.set(pkHash, tz1Prefix.length);
        
        const checksum = this.doubleHash(payload).slice(0, 4);
        const final = new Uint8Array(payload.length + 4);
        final.set(payload);
        final.set(checksum, payload.length);
        
        return this.base58Encode(final);
    }

    // Encode public key as edpk base58check
    _encodePublicKey(publicKey) {
        const edpkPrefix = new Uint8Array([13, 15, 37, 217]);
        const pubKeyBytes = publicKey instanceof Uint8Array ? publicKey : new Uint8Array(publicKey);
        
        const payload = new Uint8Array(edpkPrefix.length + pubKeyBytes.length);
        payload.set(edpkPrefix);
        payload.set(pubKeyBytes, edpkPrefix.length);
        
        const checksum = this.doubleHash(payload).slice(0, 4);
        const final = new Uint8Array(payload.length + 4);
        final.set(payload);
        final.set(checksum, payload.length);
        
        return this.base58Encode(final);
    }

    async isRevealed(address) {
        try {
            const response = await fetch(`${this.rpcUrl}/chains/main/blocks/head/context/contracts/${address}/manager_key`);
            if (!response.ok) return false;
            const key = await response.json();
            return key !== null && key !== '';
        } catch {
            return false;
        }
    }

    async sendTransaction(privateKey, toAddress, amountXTZ) {
        try {
            const mnemonic = await (async () => {
                const sessionPw = sessionStorage.getItem('_walletSessionPw');
                if (!sessionPw) throw new Error('Wallet session expired');
                const { encryptionService } = await import('../encryption-service');
                return encryptionService.loadWallet(sessionPw);
            })();

            // @ts-ignore
            const keys = await getTezosEd25519Keys(mnemonic, "m/44'/1729'/0'/0'");
            const keypair = {
                publicKey: keys.publicKey,
                secretKey: keys.privateKey
            };

            const fromAddress = this._addressFromPublicKey(keypair.publicKey);
            console.log('[TEZOS] fromAddress:', fromAddress);
            console.log('[TEZOS] walletAddress:', walletService.getWallet()?.tezos?.address);

            const blockHash = await this.getBlockHash();
            let counter = parseInt(await this.getCounter(fromAddress));
            const amountMutez = Math.floor(parseFloat(amountXTZ) * 1000000).toString();
            
            const revealed = await this.isRevealed(fromAddress);
            
            const contents = [];

            if (!revealed) {
                const encodedPk = this._encodePublicKey(keypair.publicKey);
                console.log('[TEZOS] Encoded public key:', encodedPk);
                contents.push({
                    kind: 'reveal',
                    source: fromAddress,
                    fee: '1270',
                    counter: (++counter).toString(),
                    gas_limit: '1100',
                    storage_limit: '0',
                    public_key: encodedPk
                });
            }

            contents.push({
                kind: 'transaction',
                source: fromAddress,
                fee: '1420',
                counter: (++counter).toString(),
                gas_limit: '10600',
                storage_limit: '0',
                amount: amountMutez,
                destination: toAddress
            });

            const operation = { branch: blockHash, contents };
            console.log('[TEZOS] Operation:', JSON.stringify(operation, null, 2));

            const localHex = this.localForgeOperation(operation);
            const rpcForged = await this.forgeOperation(operation);
            console.log('[COMPARE] local:', localHex);
            console.log('[COMPARE] rpc:  ', rpcForged);
            console.log('[COMPARE] match:', localHex === rpcForged);

            const forgedHex = localHex; // Use local for now
            console.log('[TEZOS] Using forged hex:', forgedHex);

            const watermark = new Uint8Array([3]);
            const forgedBytes = this.hexToBytes(forgedHex);
            const toSign = new Uint8Array(watermark.length + forgedBytes.length);
            toSign.set(watermark);
            toSign.set(forgedBytes, watermark.length);

            const signature = nacl.sign.detached(toSign, keypair.secretKey);
            const signatureHex = this.bytesToHex(signature);
            const signedOpBytes = forgedHex + signatureHex;

            const opHash = await this.injectOperation(signedOpBytes);
            return { hash: opHash, success: true };

        } catch (error) {
            throw error;
        }
    }

    localForgeOperation(operation) {
        const bytes = [];

        // Branch: decode, strip 2-byte prefix + 4-byte checksum = 32 bytes
        const branchDecoded = this.base58Decode(operation.branch);
        bytes.push(...branchDecoded.slice(2, 34));

        for (const op of operation.contents) {
            if (op.kind === 'reveal') {
                bytes.push(0x6b); // reveal tag

                // Source: strip 3-byte tz1 prefix + 4-byte checksum = 20 bytes
                const srcDecoded = this.base58Decode(op.source);
                bytes.push(0x00); // tz1 subtype
                bytes.push(...srcDecoded.slice(3, 23));

                bytes.push(...this.zarithEncode(parseInt(op.fee)));
                bytes.push(...this.zarithEncode(parseInt(op.counter)));
                bytes.push(...this.zarithEncode(parseInt(op.gas_limit)));
                bytes.push(...this.zarithEncode(parseInt(op.storage_limit)));

                // Public key: strip 4-byte edpk prefix + 4-byte checksum = 32 bytes
                const pkDecoded = this.base58Decode(op.public_key);
                bytes.push(0x00); // Ed25519 tag
                bytes.push(...pkDecoded.slice(4, pkDecoded.length - 4));
                
                bytes.push(0x00); // paid_storage_size_diff (always 0 for reveal)

            } else if (op.kind === 'transaction') {
                bytes.push(0x6c); // transaction tag

                // Source
                const srcDecoded = this.base58Decode(op.source);
                bytes.push(0x00); // tz1 subtype
                bytes.push(...srcDecoded.slice(3, 23));

                bytes.push(...this.zarithEncode(parseInt(op.fee)));
                bytes.push(...this.zarithEncode(parseInt(op.counter)));
                bytes.push(...this.zarithEncode(parseInt(op.gas_limit)));
                bytes.push(...this.zarithEncode(parseInt(op.storage_limit)));
                bytes.push(...this.zarithEncode(parseInt(op.amount)));

                // Destination: implicit account needs TWO prefix bytes
                const destDecoded = this.base58Decode(op.destination);
                bytes.push(0x00); // implicit account tag
                bytes.push(0x00); // tz1 subtype
                bytes.push(...destDecoded.slice(3, 23));

                bytes.push(0x00); // no parameters
            }
        }

        return this.bytesToHex(new Uint8Array(bytes));
    }

    zarithEncode(num) {
        const bytes = [];
        while (num >= 128) {
            bytes.push((num % 128) | 0x80);
            num = Math.floor(num / 128);
        }
        bytes.push(num);
        return bytes;
    }

    async getBlockHash() {
        const response = await fetch(`${this.rpcUrl}/chains/main/blocks/head/hash`);
        if (!response.ok) throw new Error(`Failed to get block hash: ${response.status}`);
        const hash = await response.json();
        if (typeof hash !== 'string') throw new Error('Invalid block hash: ' + JSON.stringify(hash));
        return hash.replace(/"/g, '');
    }

    async getCounter(address) {
        const response = await fetch(`${this.rpcUrl}/chains/main/blocks/head/context/contracts/${address}/counter`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get counter: ${response.status} - ${error}`);
        }
        const counter = await response.json();
        if (typeof counter !== 'string') throw new Error('Invalid counter: ' + JSON.stringify(counter));
        return counter.replace(/"/g, '');
    }

    async forgeOperation(operation) {
        const response = await fetch(`${this.rpcUrl}/chains/main/blocks/head/helpers/forge/operations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to forge operation: ${response.status} - ${error}`);
        }
        const forged = await response.json();
        if (typeof forged !== 'string') throw new Error('Invalid forge response: ' + JSON.stringify(forged));
        return forged.replace(/"/g, '');
    }

    async injectOperation(signedOpBytes) {
        const response = await fetch(`${this.rpcUrl}/injection/operation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signedOpBytes)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to inject operation: ${response.status} - ${error}`);
        }
        const hash = await response.json();
        if (typeof hash !== 'string') throw new Error('Injection failed: ' + JSON.stringify(hash));
        return hash.replace(/"/g, '');
    }

    doubleHash(data) {
        const hash1 = window.cryptoLibs.ethers.utils.sha256(data);
        const hash1Bytes = this.hexToBytes(hash1.slice(2));
        const hash2 = window.cryptoLibs.ethers.utils.sha256(hash1Bytes);
        return this.hexToBytes(hash2.slice(2));
    }

    base58Decode(str) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const bytes = [0];
        for (let i = 0; i < str.length; i++) {
            const value = ALPHABET.indexOf(str[i]);
            if (value === -1) throw new Error('Invalid base58 character');
            for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
            bytes[0] += value;
            let carry = 0;
            for (let j = 0; j < bytes.length; j++) {
                bytes[j] += carry;
                carry = bytes[j] >> 8;
                bytes[j] &= 0xff;
            }
            while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
        }
        for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.push(0);
        return new Uint8Array(bytes.reverse());
    }

    base58Encode(bytes) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const digits = [0];
        for (let i = 0; i < bytes.length; i++) {
            let carry = bytes[i];
            for (let j = 0; j < digits.length; j++) {
                carry += digits[j] << 8;
                digits[j] = carry % 58;
                carry = (carry / 58) | 0;
            }
            while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
        }
        let result = '';
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result += ALPHABET[0];
        for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
        return result;
    }

    hexToBytes(hex) {
        if (hex.startsWith('0x')) hex = hex.slice(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        return bytes;
    }

    bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

const tezosSendService = new TezosSendService();

export async function sendTezos(toAddress, amount) {
    let privateKey = null;
    try {
        const wallet = walletService.getWallet();
        if (!wallet) throw new Error('Wallet not found');
        privateKey = await deriveTezosEdsk();
        const result = await tezosSendService.sendTransaction(privateKey, toAddress, amount);
        if (result && result.hash) return result.hash;
        throw new Error('Transaction failed - no hash returned');
    } catch (error) {
        throw error;
    } finally {
        privateKey = null;
    }
}