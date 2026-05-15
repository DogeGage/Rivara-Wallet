/* 
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */


export interface DryRunResult {
  chain: string;
  success: boolean;
  hex?: string;
  error?: string;
}

export class TxDryRunService {
  async runAllTests(): Promise<DryRunResult[]> {
    const results: DryRunResult[] = [];

    const run = async (chain: string, fn: () => Promise<string>) => {
      try {
        results.push({ chain, success: true, hex: await fn() });
      } catch (e: any) {
        results.push({ chain, success: false, error: e.message });
      }
    };

    await run("Bitcoin",  () => this.testUtxoBuilder("bitcoin"));
    await run("Litecoin", () => this.testUtxoBuilder("litecoin"));
    await run("Dogecoin", () => this.testUtxoBuilder("dogecoin"));
    await run("Ethereum",  () => this.testEvmBuilder(1));
    await run("Polygon",   () => this.testEvmBuilder(137));
    await run("Avalanche", () => this.testEvmBuilder(43114));
    await run("BSC",       () => this.testEvmBuilder(56));
    await run("USDC",      () => this.testUsdcBuilder());
    await run("Solana",    () => this.testSolanaBuilder());
    await run("Tron",      () => this.testTronBuilder());

    return results;
  }

  private readonly DUMMY_MNEMONIC = "test test test test test test test test test test test junk";

  private readonly UTXO_NETWORKS: Record<string, any> = {
    bitcoin: null, // uses bitcoinjs default
    litecoin: {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: { public: 0x019da462, private: 0x019d9cfe },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0
    },
    dogecoin: {
      messagePrefix: '\x19Dogecoin Signed Message:\n',
      bech32: 'doge',
      bip32: { public: 0x02facafd, private: 0x02fac398 },
      pubKeyHash: 0x1e,
      scriptHash: 0x16,
      wif: 0x9e
    }
  };

  private readonly UTXO_PATHS: Record<string, string> = {
    bitcoin:  "m/44'/0'/0'/0/0",
    litecoin: "m/44'/2'/0'/0/0",
    dogecoin: "m/44'/3'/0'/0/0"
  };

  private async testUtxoBuilder(chain: string): Promise<string> {
    // @ts-ignore
    const { bitcoin, ethers } = window.cryptoLibs;
    const network = this.UTXO_NETWORKS[chain];
    const btcNetwork = network ?? bitcoin.networks.bitcoin;

    const seed = ethers.utils.mnemonicToSeed(this.DUMMY_MNEMONIC);
    const seedBuffer = Buffer.from(seed.slice(2), "hex");
    const root = bitcoin.bip32.fromSeed(seedBuffer, btcNetwork);
    const child = root.derivePath(this.UTXO_PATHS[chain]);

    const p2pkh = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network: btcNetwork });

    const dummyTx = new bitcoin.Transaction();
    dummyTx.version = 1;
    dummyTx.addInput(Buffer.alloc(32, 0), 0);
    dummyTx.addOutput(p2pkh.output, 100000);
    const dummyTxHex = dummyTx.toHex();
    const computedTxid = dummyTx.getId();

    const psbt = new bitcoin.Psbt({ network: btcNetwork });
    psbt.addInput({ hash: computedTxid, index: 0, nonWitnessUtxo: Buffer.from(dummyTxHex, "hex") });
    psbt.addOutput({ address: p2pkh.address!, value: 10000 });
    psbt.signInput(0, child);
    psbt.finalizeAllInputs();
    return psbt.extractTransaction().toHex();
  }

  private async testEvmBuilder(chainId: number): Promise<string> {
    // @ts-ignore
    const { ethers } = window.cryptoLibs;
    const evmWallet = ethers.Wallet.createRandom();
    const tx = {
      to: evmWallet.address,
      value: ethers.utils.parseEther("0.0001"),
      gasLimit: 21000,
      gasPrice: ethers.utils.parseUnits("10", "gwei"),
      nonce: 0,
      chainId
    };
    return evmWallet.signTransaction(tx);
  }

  private async testSolanaBuilder(): Promise<string> {
    // @ts-ignore
    const solanaWeb3 = window.solanaWeb3;
    const fromKeypair = solanaWeb3.Keypair.generate();
    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: fromKeypair.publicKey,
        lamports: 1000,
      })
    );
    tx.recentBlockhash = "11111111111111111111111111111111";
    tx.feePayer = fromKeypair.publicKey;
    tx.sign(fromKeypair);
    return tx.serialize().toString("base64");
  }

  private async testUsdcBuilder(): Promise<string> {
    // USDC is an ERC-20 (6 decimals) on Ethereum — test signing a token transfer
    // @ts-ignore
    const { ethers } = window.cryptoLibs;
    const wallet = ethers.Wallet.createRandom();
    const iface = new ethers.utils.Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
    const data = iface.encodeFunctionData("transfer", [
      wallet.address,
      ethers.utils.parseUnits("1", 6)
    ]);
    const tx = {
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      data,
      gasLimit: 100000,
      gasPrice: ethers.utils.parseUnits("10", "gwei"),
      nonce: 0,
      chainId: 1
    };
    return wallet.signTransaction(tx);
  }

  private async testTronBuilder(): Promise<string> {
    // Tron uses secp256k1 (same as EVM). Derive key via BIP44 path m/44'/195'/0'/0/0
    // and sign a dummy hash to verify the full key-derivation → signing chain.
    // @ts-ignore
    const { ethers } = window.cryptoLibs;
    const node = ethers.utils.HDNode.fromMnemonic(this.DUMMY_MNEMONIC).derivePath("m/44'/195'/0'/0/0");
    const wallet = new ethers.Wallet(node.privateKey);
    const dummyHash = ethers.utils.arrayify('0x' + '42'.repeat(32));
    return wallet.signMessage(dummyHash);
  }

}

export const txDryRunService = new TxDryRunService();
