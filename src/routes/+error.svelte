<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Home, ArrowLeft } from 'lucide-svelte';

	$: status = $page.status;
	$: message = $page.error?.message || 'An unexpected error occurred';

	function getErrorTitle(status: number): string {
		switch (status) {
			case 404:
				return 'Page Not Found';
			case 500:
				return 'Server Error';
			case 403:
				return 'Access Denied';
			default:
				return 'Something Went Wrong';
		}
	}

	function getErrorDescription(status: number): string {
		switch (status) {
			case 404:
				return "The page you're looking for doesn't exist or has been moved.";
			case 500:
				return 'Our servers encountered an error. Please try again later.';
			case 403:
				return "You don't have permission to access this resource.";
			default:
				return 'An unexpected error occurred. Please try again.';
		}
	}
</script>

<div class="min-h-screen bg-[#070b10] flex items-center justify-center p-6">
	<div class="max-w-2xl w-full">
		<!-- Error Card -->
		<div class="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 text-center">
			<!-- Icon -->
			<div class="mb-6 flex justify-center">
				<div class="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
					<AlertTriangle size={40} class="text-red-400" />
				</div>
			</div>

			<!-- Status Code -->
			<div class="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-400 mb-4">
				{status}
			</div>

			<!-- Title -->
			<h1 class="text-3xl font-bold text-white mb-3">
				{getErrorTitle(status)}
			</h1>

			<!-- Description -->
			<p class="text-slate-400 text-lg mb-8">
				{getErrorDescription(status)}
			</p>

			<!-- Error Message (if available) -->
			<div class="mb-8 p-4 bg-black/20 border border-white/5 rounded-lg" style="display: {message && status !== 404 ? 'block' : 'none'}">
				<p class="text-sm text-slate-500 font-mono break-all">{message}</p>
			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<button
					class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
					on:click={() => goto('/')}
				>
					<Home size={18} />
					Go Home
				</button>
				<button
					class="px-6 py-3 bg-stone-800/50 border border-white/10 text-white font-semibold rounded-lg hover:bg-stone-700/50 transition-all flex items-center justify-center gap-2"
					on:click={() => window.history.back()}
				>
					<ArrowLeft size={18} />
					Go Back
				</button>
			</div>
		</div>

		<!-- Branding -->
		<div class="mt-8 text-center">
			<div class="flex items-center justify-center gap-2 text-slate-500">
				<span class="text-xl">⬢</span>
				<span class="font-bold">Rivara</span>
			</div>
		</div>
	</div>
</div>
