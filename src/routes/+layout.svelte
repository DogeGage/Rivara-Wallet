<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	
	// Dynamic meta tags based on route
	$: pageTitle = $page.url.pathname === '/' ? 'Rivara Wallet - Secure Multi-Chain Crypto Wallet' :
		$page.url.pathname === '/wallet' ? 'My Wallet - Rivara' :
		$page.url.pathname === '/create' ? 'Create Wallet - Rivara' :
		$page.url.pathname === '/import' ? 'Import Wallet - Rivara' :
		$page.url.pathname === '/portfolio' ? 'Portfolio - Rivara' :
		$page.url.pathname === '/exchange' ? 'Exchange - Rivara' :
		$page.url.pathname === '/settings' ? 'Settings - Rivara' :
		'Rivara Wallet';
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<slot />
