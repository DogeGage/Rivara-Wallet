<script lang="ts">
	import { tv } from 'tailwind-variants';

	export let variant: 'solid' | 'bordered' | 'light' | 'flat' | 'ghost' = 'solid';
	export let color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'default';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let fullWidth = false;
	export let isLoading = false;

	const button = tv({
		base: 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
		variants: {
			variant: {
				solid: '',
				bordered: 'bg-transparent border-2',
				light: 'bg-transparent',
				flat: '',
				ghost: 'bg-transparent'
			},
			color: {
				default: '',
				primary: '',
				secondary: '',
				success: '',
				warning: '',
				danger: ''
			},
			size: {
				sm: 'px-4 py-2 text-sm',
				md: 'px-6 py-3 text-base',
				lg: 'px-8 py-4 text-lg'
			},
			fullWidth: {
				true: 'w-full'
			},
			disabled: {
				true: 'opacity-50 cursor-not-allowed'
			}
		},
		compoundVariants: [
			{
				variant: 'solid',
				color: 'primary',
				class: 'bg-gradient-to-r from-cyan-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:-translate-y-0.5 focus:ring-cyan-500'
			},
			{
				variant: 'solid',
				color: 'danger',
				class: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-0.5 focus:ring-red-500'
			},
			{
				variant: 'bordered',
				color: 'primary',
				class: 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 focus:ring-cyan-500'
			},
			{
				variant: 'flat',
				color: 'default',
				class: 'bg-white/5 text-white hover:bg-white/10 focus:ring-white/20'
			},
			{
				variant: 'ghost',
				color: 'default',
				class: 'text-slate-400 hover:text-white hover:bg-white/5'
			}
		]
	});
</script>

<button
	class={button({ variant, color, size, fullWidth, disabled })}
	{disabled}
	on:click
	{...$$restProps}
>
	{#if isLoading}
		<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
	<slot />
</button>
