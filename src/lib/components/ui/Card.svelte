<script lang="ts">
	import { tv } from 'tailwind-variants';

	export let variant: 'elevated' | 'bordered' | 'flat' = 'elevated';
	export let hoverable = false;
	export let pressable = false;

	const card = tv({
		base: 'rounded-2xl overflow-hidden transition-all duration-200',
		variants: {
			variant: {
				elevated: 'bg-stone-800/40 backdrop-blur-sm border border-white/10 shadow-lg',
				bordered: 'bg-transparent border-2 border-white/10',
				flat: 'bg-stone-800/20'
			},
			hoverable: {
				true: 'hover:border-cyan-500/30 hover:-translate-y-1 cursor-pointer'
			},
			pressable: {
				true: 'active:scale-95 cursor-pointer'
			}
		}
	});
</script>

<div class={card({ variant, hoverable, pressable })} on:click {...$$restProps}>
	<slot />
</div>
