/* 
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */

import { deriveEvmPrivateKey, deriveUtxoKeyNode, getMnemonicForSigning } from "./key-derivation-service";
import { get } from "svelte/store";
import { wallet } from "$lib/stores/wallet";

export interface DryRunResult {
  chain: string;
  success: boolean;
  hex?: string;
  error?: string;
}

export class TxDryRunService {
  async runAllTests(): Promise<DryRunResult[]> {
    const results: DryRunResult[] = [];
    
    // 1. Test Bitcoin (UTXO) Builder
    try {
      const btcHex = await this.testBitcoinBuilder();
      results.push({ chain: "Bitcoin", success: true, hex: btcHex });
    } catch (e: any) {
      results.push({ chain: "Bitcoin", success: false, error: e.message });
    }

    // 2. Test EVM Builder
    try {
      const evmHex = await this.testEvmBuilder();
      results.push({ chain: "EVM", success: true, hex: evmHex });
    } catch (e: any) {
      results.push({ chain: "EVM", success: false, error: e.message });
    }

    // 3. Test Solana Builder
    try {
      const solHex = await this.testSolanaBuilder();
      results.push({ chain: "Solana", success: true, hex: solHex });
    } catch (e: any) {
      results.push({ chain: "Solana", success: false, error: e.message });
    }

    return results;
  }

  private async testBitcoinBuilder(): Promise<string> {
    // @ts-ignore
    const { bitcoin, ethers } = window.cryptoLibs;
    
    // SECURITY: Generate a completely fake mnemonic for testing
    const dummyMnemonic = "test test test test test test test test test test test junk";
    const seed = ethers.utils.mnemonicToSeed(dummyMnemonic);
    const seedBuffer = Buffer.from(seed.slice(2), "hex");
    const root = bitcoin.bip32.fromSeed(seedBuffer, bitcoin.networks.bitcoin);
    const child = root.derivePath("m/44'/0'/0'/0/0");
    
    const p2pkh = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    
    // Create a dummy previous transaction so the hash check passes
    const dummyTx = new bitcoin.Transaction();
    dummyTx.version = 1;
    dummyTx.addInput(Buffer.alloc(32, 0), 0); // Fake coinbase-like input
    dummyTx.addOutput(p2pkh.output, 100000); // Give ourselves 100k sats
    
    const dummyTxHex = dummyTx.toHex();
    const computedTxid = dummyTx.getId(); // The actual hash of the dummy hex
    
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    psbt.addInput({
      hash: computedTxid,
      index: 0,
      nonWitnessUtxo: Buffer.from(dummyTxHex, "hex"),
    });
    
    psbt.addOutput({
      address: p2pkh.address!,
      value: 10000,
    });
    
    psbt.signInput(0, child);
    psbt.finalizeAllInputs();
    
    const txHex = psbt.extractTransaction().toHex();
    return txHex;
  }

  private async testEvmBuilder(): Promise<string> {
    // @ts-ignore
    const { ethers } = window.cryptoLibs;
    
    // SECURITY: Generate a completely random EVM wallet for testing
    const evmWallet = ethers.Wallet.createRandom();
    
    const tx = {
      to: evmWallet.address,
      value: ethers.utils.parseEther("0.0001"),
      gasLimit: 21000,
      gasPrice: ethers.utils.parseUnits("10", "gwei"),
      nonce: 0,
      chainId: 1
    };
    
    const signedTx = await evmWallet.signTransaction(tx);
    return signedTx;
  }

  private async testSolanaBuilder(): Promise<string> {
    // @ts-ignore
    const solanaWeb3 = window.solanaWeb3;
    
    // SECURITY: Generate a completely random Solana keypair for testing
    const fromKeypair = solanaWeb3.Keypair.generate();
    
    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: fromKeypair.publicKey,
        lamports: 1000,
      })
    );
    
    // Dummy recent blockhash for local signing test
    tx.recentBlockhash = "11111111111111111111111111111111"; 
    tx.feePayer = fromKeypair.publicKey;
    tx.sign(fromKeypair);
    
    return tx.serialize().toString("base64");
  }
}

export const txDryRunService = new TxDryRunService();
