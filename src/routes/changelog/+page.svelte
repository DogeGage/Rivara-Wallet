<script lang="ts">
  import { ArrowLeft, GitCommit } from "lucide-svelte";
  import { goto } from "$app/navigation";

  const changelog = [
    {
      version: "v7.0.5",
      title: "Dependency cleanup",
      date: "May 2026",
      points: [
        "Removed all CDN dependencies — crypto libraries now bundled locally and served from static assets",
        "Expanded transaction dry-run test suite to cover all supported chains",
        "Fixed dev mode detection in the security monitor to use the correct storage key"
      ]
    },
    {
      version: "v7.0.4",
      title: "Bug fix two",
      date: "May 2026",
      points: [
        "Fixed ETH balance detection after so long",
        "Fixed charts rendering and backend caching limits",
        "Increased worker API security and rate limiting",
        "Fixed global price polling and added missing currencies",
        "Completely redid the homescreen design",
        "Changed 'News' to 'Changelog'",
        "Isolated the security Service Worker even more"
      ]
    },
    {
      version: "v7.0.2",
      title: "Bug fix one",
      date: "May 2026",
      points: [
        "Fixed sending mechanics for all major cryptos",
        "Fixed critical security bugs and key isolation in the Service Worker itself",
        "Removed legacy HTML files totaling 50 million lines of code"
      ]
    }
  ];
</script>

<div class="bg-[#070b10] min-h-screen text-slate-300 font-sans selection:bg-amber-500/30 selection:text-white">
  <!-- Nav -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#070b10]/90 backdrop-blur-md border-b border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <button 
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        on:click={() => goto("/")}>
        <ArrowLeft size={16} />
        Back to Home
      </button>
      <div class="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
        <GitCommit size={14} class="text-amber-500" /> Release History
      </div>
    </div>
  </nav>

  <!-- Fullscreen Sections -->
  <main>
    {#each changelog as log, index}
      <section class="min-h-screen flex items-center justify-center border-b border-white/[0.05] relative py-24 px-6">
        
        <!-- Subtle background styling for the latest release -->
        {#if index === 0}
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/[0.03] via-[#070b10] to-[#070b10] pointer-events-none"></div>
        {/if}

        <div class="max-w-4xl w-full mx-auto relative z-10 flex flex-col items-center text-center">
          <!-- Release Date -->
          <div class="text-amber-500/80 font-mono text-sm tracking-widest uppercase mb-6">
            {log.date}
          </div>

          <!-- Version & Title -->
          <h1 class="text-7xl md:text-9xl font-black text-white tracking-tighter mb-4 opacity-90">
            {log.version}
          </h1>
          <h2 class="text-2xl md:text-4xl font-light text-slate-400 mb-12 tracking-tight">
            {log.title}
          </h2>

          <!-- Points -->
          <ul class="text-left space-y-4 md:space-y-6 max-w-2xl mx-auto w-full">
            {#each log.points as point}
              <li class="flex items-start gap-4 group">
                <span class="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors duration-300"></span>
                <span class="text-lg md:text-xl text-slate-300 leading-relaxed font-light">
                  {point}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </section>
    {/each}

    <section class="py-32 flex flex-col items-center justify-center text-center px-6">
      <div class="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-6">
        <span class="text-xl">⬢</span>
      </div>
      <p class="text-slate-500 text-sm font-medium tracking-wide uppercase">End of History</p>
    </section>
  </main>
</div>
