
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '$app/paths/internal/server';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	async: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	server_error_boundaries: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n\t<meta charset=\"utf-8\" />\n\t<link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\n\t<!-- Primary Meta Tags -->\n\t<title>Rivara Wallet - Secure Multi-Chain Crypto Wallet</title>\n\t<meta name=\"title\" content=\"Rivara Wallet - Secure Multi-Chain Crypto Wallet\" />\n\t<meta name=\"description\"\n\t\tcontent=\"Non-custodial multi-chain cryptocurrency wallet supporting Bitcoin, Ethereum, Dogecoin, Litecoin, Solana, Tezos, Tron, and Polygon. Your keys, your crypto.\" />\n\t<meta name=\"keywords\"\n\t\tcontent=\"crypto wallet, bitcoin wallet, ethereum wallet, dogecoin wallet, multi-chain wallet, non-custodial wallet, web3 wallet, cryptocurrency, blockchain\" />\n\t<meta name=\"author\" content=\"Rivara\" />\n\t<meta name=\"robots\" content=\"index, follow\" />\n\n\t<!-- Open Graph / Facebook -->\n\t<meta property=\"og:type\" content=\"website\" />\n\t<meta property=\"og:url\" content=\"https://rivarawallet.xyz/\" />\n\t<meta property=\"og:title\" content=\"Rivara Wallet - Secure Multi-Chain Crypto Wallet\" />\n\t<meta property=\"og:description\"\n\t\tcontent=\"Non-custodial multi-chain cryptocurrency wallet supporting Bitcoin, Ethereum, Dogecoin, Litecoin, Solana, Tezos, Tron, and Polygon. Your keys, your crypto.\" />\n\t<meta property=\"og:site_name\" content=\"Rivara Wallet\" />\n\n\t<!-- Twitter -->\n\t<meta property=\"twitter:card\" content=\"summary\" />\n\t<meta property=\"twitter:url\" content=\"https://rivarawallet.xyz/\" />\n\t<meta property=\"twitter:title\" content=\"Rivara Wallet - Secure Multi-Chain Crypto Wallet\" />\n\t<meta property=\"twitter:description\"\n\t\tcontent=\"Non-custodial multi-chain cryptocurrency wallet supporting Bitcoin, Ethereum, Dogecoin, Litecoin, Solana, Tezos, Tron, and Polygon. Your keys, your crypto.\" />\n\n\t<!-- Additional Meta Tags -->\n\t<meta name=\"theme-color\" content=\"#0891b2\" />\n\t<meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n\t<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\" />\n\t<meta name=\"apple-mobile-web-app-title\" content=\"Rivara\" />\n\n\t<!-- PWA Manifest -->\n\t<link rel=\"manifest\" href=\"" + assets + "/manifest.json\" />\n\n\t<!-- Security Headers -->\n\t<meta http-equiv=\"X-Content-Type-Options\" content=\"nosniff\" />\n\t<meta http-equiv=\"X-Frame-Options\" content=\"DENY\" />\n\t<meta http-equiv=\"Referrer-Policy\" content=\"strict-origin-when-cross-origin\" />\n\n\t<!-- Structured Data (JSON-LD) -->\n\t<script type=\"application/ld+json\">\n\t\t{\n\t\t\t\"@context\": \"https://schema.org\",\n\t\t\t\"@type\": \"SoftwareApplication\",\n\t\t\t\"name\": \"Rivara Wallet\",\n\t\t\t\"applicationCategory\": \"FinanceApplication\",\n\t\t\t\"operatingSystem\": \"Web Browser\",\n\t\t\t\"offers\": {\n\t\t\t\t\"@type\": \"Offer\",\n\t\t\t\t\"price\": \"0\",\n\t\t\t\t\"priceCurrency\": \"USD\"\n\t\t\t},\n\t\t\t\"description\": \"Non-custodial multi-chain cryptocurrency wallet supporting Bitcoin, Ethereum, Dogecoin, Litecoin, Solana, Tezos, Tron, and Polygon.\",\n\t\t\t\"featureList\": [\n\t\t\t\t\"Multi-chain support\",\n\t\t\t\t\"Non-custodial\",\n\t\t\t\t\"Encrypted local storage\",\n\t\t\t\t\"Built-in exchange\",\n\t\t\t\t\"Portfolio tracking\"\n\t\t\t]\n\t\t}\n\t\t</script>\n\n\t<!-- Load crypto libraries from CDN (same as old desktop app) -->\n\t<script src=\"https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js\"></script>\n\t<script src=\"https://cdn.jsdelivr.net/npm/bitcoinjs-lib-browser@5.1.7/bitcoinjs.min.js\"></script>\n\t<script src=\"https://cdn.jsdelivr.net/npm/tronweb@6.1.1/dist/TronWeb.js\"></script>\n\t<script src=\"https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js\"></script>\n\t<script src=\"https://unpkg.com/@solana/web3.js@1.98.4/lib/index.iife.min.js\"></script>\n\n\t<!-- Load wallet utility scripts from static folder -->\n\t<script src=\"/blake2b-proper.js\"></script>\n\t<script src=\"/base58check.js\"></script>\n\t<script src=\"/tezos-ed25519.js\"></script>\n\n\t<script>\n\t\t// Setup crypto libraries (same as old desktop app)\n\t\twindow.addEventListener('load', () => {\n\t\t\tif (window.ethers && window.bitcoinjs) {\n\t\t\t\twindow.cryptoLibs = {\n\t\t\t\t\tethers: window.ethers,\n\t\t\t\t\tbitcoin: window.bitcoinjs,\n\t\t\t\t\ttron: window.TronWeb\n\t\t\t\t};\n\t\t\t\tconsole.log('✅ Crypto libraries loaded from CDN');\n\t\t\t}\n\t\t});\n\t</script>\n\n\t" + head + "\n</head>\n\n<body data-sveltekit-preload-data=\"hover\">\n\t<div style=\"display: contents\">" + body + "</div>\n</body>\n\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1o0z04e"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
