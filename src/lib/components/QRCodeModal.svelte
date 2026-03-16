<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Copy, Check } from 'lucide-svelte';
	import QRCode from 'qrcode';

	export let address: string;
	export let symbol: string;
	export let name: string;
	export let onClose: () => void;

	let qrCanvas: HTMLCanvasElement;
	let copied = false;

	onMount(() => {
		if (qrCanvas && address) {
			QRCode.toCanvas(qrCanvas, address, {
				width: 256,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				}
			});
		}
	});

	async function copyAddress() {
		await navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}
</script>

<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" on:click={onClose}>
	<div class="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-md w-full" on:click|stopPropagation>
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-xl font-bold text-white">Receive {symbol}</h3>
			<button class="p-2 text-slate-400 hover:text-white transition" on:click={onClose}>
				<X size={20} />
			</button>
		</div>

		<div class="flex flex-col items-center gap-6">
			<div class="bg-white p-4 rounded-xl">
				<canvas bind:this={qrCanvas}></canvas>
			</div>

			<div class="w-full">
				<p class="text-sm text-slate-400 mb-2">Your {name} address:</p>
				<div class="flex items-center gap-2 p-3 bg-black/20 border border-white/10 rounded-lg">
					<p class="flex-1 text-sm text-white font-mono break-all">{address}</p>
					<button 
						class="p-2 text-slate-400 hover:text-white transition flex-shrink-0"
						on:click={copyAddress}
					>
						{#if copied}
							<Check size={18} class="text-green-400" />
						{:else}
							<Copy size={18} />
						{/if}
					</button>
				</div>
			</div>

			<p class="text-xs text-slate-500 text-center">
				Scan this QR code or copy the address to receive {symbol}
			</p>
		</div>
	</div>
</div>
