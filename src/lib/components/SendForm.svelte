<!-- 
  Rivara Wallet
  Copyright (c) 2024-2026 DogeGage
  Licensed under DogeGage Source Available License
-->
<script lang="ts">
  import {
    sendTransaction,
    validateAddress,
    getExplorerUrl,
  } from "$lib/services/send";
  import type { CryptoChain } from "$lib/types";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Card from "$lib/components/ui/Card.svelte";

  export let chain: CryptoChain = "bitcoin";

  let toAddress = "";
  let amount = "";
  let sending = false;
  let error = "";
  let txHash = "";

  async function handleSend() {
    error = "";
    txHash = "";

    // Validate address
    if (!validateAddress(chain, toAddress)) {
      error = `Invalid ${chain} address`;
      return;
    }

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      error = "Invalid amount";
      return;
    }

    sending = true;

    try {
      const hash = await sendTransaction({
        chain,
        toAddress,
        amount,
      });

      txHash = hash;
      toAddress = "";
      amount = "";
    } catch (err: any) {
      error = err.message || "Transaction failed";
    } finally {
      sending = false;
    }
  }
</script>

<Card variant="elevated">
  <div class="p-6">
    <h3 class="text-xl font-semibold mb-4">Send {chain.toUpperCase()}</h3>

    <div class="space-y-4">
      <Input
        label="Recipient Address"
        bind:value={toAddress}
        placeholder="Enter address"
      />

      <Input
        type="number"
        label="Amount"
        bind:value={amount}
        placeholder="0.00"
        step="0.00000001"
      />

      {#if error}
        <div
          class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
        >
          {error}
        </div>
      {/if}

      {#if txHash}
        <div
          class="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"
        >
          Transaction sent!
          <a
            href={getExplorerUrl(chain, txHash)}
            target="_blank"
            class="underline"
          >
            View on explorer
          </a>
        </div>
      {/if}

      <Button
        color="primary"
        fullWidth
        isLoading={sending}
        disabled={sending}
        on:click={handleSend}
      >
        {sending ? "Sending..." : "Send Transaction"}
      </Button>
    </div>
  </div>
</Card>
