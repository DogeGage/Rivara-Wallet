<script lang="ts">
	import { tv } from 'tailwind-variants';

	export let type = 'text';
	export let value = '';
	export let placeholder = '';
	export let label = '';
	export let error = '';
	export let disabled = false;
	export let fullWidth = true;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const input = tv({
		base: 'bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all',
		variants: {
			size: {
				sm: 'px-3 py-2 text-sm',
				md: 'px-4 py-3 text-base',
				lg: 'px-5 py-4 text-lg'
			},
			fullWidth: {
				true: 'w-full'
			},
			error: {
				true: 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
			},
			disabled: {
				true: 'opacity-50 cursor-not-allowed'
			}
		}
	});
</script>

<div class={fullWidth ? 'w-full' : ''}>
	{#if label}
		<label class="block text-sm text-slate-400 mb-2 font-medium">
			{label}
		</label>
	{/if}
	
	<input
		{type}
		bind:value
		{placeholder}
		{disabled}
		class={input({ size, fullWidth, error: !!error, disabled })}
		on:input
		on:change
		on:focus
		on:blur
		{...$$restProps}
	/>
	
	{#if error}
		<p class="mt-2 text-sm text-red-400">
			{error}
		</p>
	{/if}
</div>
