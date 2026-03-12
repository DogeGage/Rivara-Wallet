<script lang="ts">
	export let position: 'static' | 'sticky' | 'fixed' = 'fixed';
	export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'full';
	export let blur = true;
</script>

<nav
	class="top-0 left-0 right-0 z-50 border-b border-white/10 {position === 'fixed' ? 'fixed' : position === 'sticky' ? 'sticky' : ''} {blur ? 'bg-stone-900/90 backdrop-blur-lg' : 'bg-stone-900'}"
>
	<div class="mx-auto px-8 py-4 {maxWidth === 'full' ? '' : `max-w-${maxWidth}`}">
		<slot />
	</div>
</nav>
