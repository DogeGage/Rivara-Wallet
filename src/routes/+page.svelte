<!-- 
  Rivara Wallet
  Copyright (c) 2024-2026 DogeGage
  Licensed under DogeGage Source Available License
-->
<script lang="ts">
  import { afterNavigate, goto } from "$app/navigation";
  import {
    BookOpen,
    HelpCircle,
    Info,
    Github,
    FileText,
    Shield,
    Menu,
    X,
    Clock,
  } from "lucide-svelte";
  import { browser } from "$app/environment";

  let mobileMenuOpen = false;

  let hasWallet  = browser ? localStorage.getItem("isWalletAlive") === "true" : false;
  let isUnlocked = browser ? sessionStorage.getItem("walletUnlocked") === "true" : false;

  afterNavigate(() => {
    hasWallet  = localStorage.getItem("isWalletAlive") === "true";
    isUnlocked = sessionStorage.getItem("walletUnlocked") === "true";
  });

  const features = [
    { title: "Your keys, for real",         desc: "Standard BIP39. Import to any other wallet whenever. No lock-in." },
    { title: "Everything actually works",   desc: "Send, receive, swap — all of it. Not \"coming soon\". Working." },
    { title: "Built-in swaps",              desc: "Swap between chains without leaving the app. Powered by ChangeNow." },
    { title: "Zero tracking",               desc: "No analytics, no telemetry. I don't know who uses this." },
    { title: "Tuffbackup",                  desc: "One encrypted file. Download it, keep it safe, restore anytime." },
    { title: "Duress mode",                 desc: "A second password that opens a convincing decoy wallet." },
  ];
</script>

<div class="landing-page">
  <!-- Background -->
  <div class="fixed inset-0 -z-10" style="clip-path: inset(0)">
    <div class="absolute inset-0" style="background: radial-gradient(ellipse at 65% 0%, rgba(120,80,20,0.11) 0%, rgba(80,40,120,0.07) 45%, #070b10 68%)"></div>
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
  </div>

  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-[#070b10]/95 backdrop-blur-lg border-b border-white/[0.08]">
    <div class="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="text-2xl leading-none">⬢</span>
          <span class="text-[15px] font-semibold text-white tracking-tight">Rivara</span>
        </div>
        <span class="px-1.5 py-0.5 bg-amber-600/70 text-white text-[10px] font-bold rounded tracking-wide">BETA</span>
      </div>

      <div class="hidden md:flex items-center gap-1">
        <button class="nav-link" on:click={() => goto("/changelog")}><Clock size={14}/> Changelog</button>
        <button class="nav-link" on:click={() => goto("/docs")}><BookOpen size={14}/> Docs</button>
        <button class="nav-link" on:click={() => goto("/support")}><HelpCircle size={14}/> Support</button>
        <button class="nav-link" on:click={() => goto("/about")}><Info size={14}/> About</button>
      </div>

      <div class="hidden md:flex items-center gap-2">
        {#if isUnlocked}
          <button class="cta-primary" on:click={() => goto("/wallet")}>Open Wallet</button>
        {:else if hasWallet}
          <button class="cta-primary" on:click={() => goto("/unlock")}>Unlock Wallet</button>
        {:else}
          <button class="cta-ghost" on:click={() => goto("/import")}>Import</button>
          <button class="cta-primary" on:click={() => goto("/create")}>Get started</button>
        {/if}
      </div>

      <button class="md:hidden p-1.5 text-slate-400" on:click={() => (mobileMenuOpen = !mobileMenuOpen)}>
        {#if mobileMenuOpen}<X size={20}/>{:else}<Menu size={20}/>{/if}
      </button>
    </div>

    {#if mobileMenuOpen}
      <div class="md:hidden border-t border-white/[0.08] bg-[#070b10] px-5 py-3 flex flex-col gap-1">
        <button class="mobile-nav-item" on:click={() => { goto("/changelog"); mobileMenuOpen = false; }}><Clock size={14}/> Changelog</button>
        <button class="mobile-nav-item" on:click={() => { goto("/docs"); mobileMenuOpen = false; }}><BookOpen size={14}/> Docs</button>
        <button class="mobile-nav-item" on:click={() => { goto("/support"); mobileMenuOpen = false; }}><HelpCircle size={14}/> Support</button>
        <button class="mobile-nav-item" on:click={() => { goto("/about"); mobileMenuOpen = false; }}><Info size={14}/> About</button>
        <div class="border-t border-white/[0.08] mt-2 pt-2 flex flex-col gap-2">
          {#if isUnlocked}
            <button class="cta-primary w-full" on:click={() => { goto("/wallet"); mobileMenuOpen = false; }}>Open Wallet</button>
          {:else if hasWallet}
            <button class="cta-primary w-full" on:click={() => { goto("/unlock"); mobileMenuOpen = false; }}>Unlock Wallet</button>
          {:else}
            <button class="cta-ghost w-full" on:click={() => { goto("/import"); mobileMenuOpen = false; }}>Import Existing</button>
            <button class="cta-primary w-full" on:click={() => { goto("/create"); mobileMenuOpen = false; }}>Get Started</button>
          {/if}
        </div>
      </div>
    {/if}
  </nav>

  <!-- Hero -->
  <section class="pt-28 pb-10 px-5 md:px-8">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
      <div>
        <h1 class="text-[2.6rem] md:text-6xl font-bold leading-[1.1] tracking-tight mb-5 text-white">
          A crypto wallet<br/>that doesn't <span class="text-amber-400">suck.</span>
        </h1>
        <p class="text-slate-400 text-[15px] leading-relaxed mb-6 max-w-md">
          Most wallets support 40 chains and half are broken. Rivara does 8 chains and all of them work.
          Standard BIP39 seeds. Built-in exchange. No accounts, no tracking, no cloud.
        </p>

        <div class="flex flex-wrap gap-2.5 mb-8">
          {#if isUnlocked}
            <button class="cta-primary px-6 py-2.5 text-sm" on:click={() => goto("/wallet")}>Open Wallet →</button>
          {:else if hasWallet}
            <button class="cta-primary px-6 py-2.5 text-sm" on:click={() => goto("/unlock")}>Unlock Wallet →</button>
          {:else}
            <button class="cta-primary px-6 py-2.5 text-sm" on:click={() => goto("/create")}>Create a wallet →</button>
            <button class="cta-ghost px-6 py-2.5 text-sm" on:click={() => goto("/import")}>Already have a seed phrase</button>
          {/if}
        </div>
      </div>

      <div class="relative">
        <div class="absolute -inset-3 bg-amber-500/5 rounded-2xl blur-2xl pointer-events-none"></div>
        <img src="/assets/image/gui.png" alt="Rivara Wallet UI" class="relative w-full rounded-xl shadow-2xl border border-white/[0.08]"/>
      </div>
    </div>
  </section>

  <!-- Features + Comparison side by side -->
  <section class="py-10 px-5 md:px-8">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-start">

      <!-- Features list -->
      <div>
        <p class="text-[11px] uppercase tracking-widest text-slate-600 mb-6 font-medium">What it does</p>
        <div class="divide-y divide-white/[0.05]">
          {#each features as f, i}
            <div class="feature-row">
              <span class="feature-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div class="text-[14px] font-medium text-white mb-0.5">{f.title}</div>
                <div class="text-[13px] text-slate-500 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Comparison table -->
      <div>
        <p class="text-[11px] uppercase tracking-widest text-slate-600 mb-6 font-medium">vs everyone else</p>
        <div class="rounded-lg border border-white/[0.08] overflow-hidden text-[13px]">
          <div class="grid grid-cols-3 bg-white/[0.03] px-4 py-2.5 text-[10px] uppercase tracking-wider text-slate-600 border-b border-white/[0.06]">
            <span></span>
            <span class="text-amber-500 font-semibold">Rivara</span>
            <span>Others</span>
          </div>
          {#each [
            ["Works reliably",    "yes",          "mostly"],
            ["BIP39 standard",    "yes",          "sometimes"],
            ["Built-in swap",     "yes",          "sort of"],
            ["No tracking",       "none",         "always tracking"],
            ["Duress wallet",     "built-in",     "rarely"],
            ["Source code",       "on GitHub",    "closed"],
          ] as [label, ours, theirs]}
            <div class="grid grid-cols-3 px-4 py-2.5 border-t border-white/[0.04]">
              <span class="text-slate-400">{label}</span>
              <span class="text-emerald-400">{ours}</span>
              <span class="text-slate-600">{theirs}</span>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </section>

  <!-- CTA — tight, inline feel -->
  <section class="py-12 px-5 md:px-8">
    <div class="max-w-6xl mx-auto border-t border-white/[0.07] pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p class="text-white font-semibold text-lg mb-1">Ready to try it?</p>
        <p class="text-slate-500 text-sm">30 seconds to set up. No account. Nothing to install.</p>
      </div>
      <div class="flex gap-2.5 shrink-0">
        {#if isUnlocked}
          <button class="cta-primary px-5 py-2.5 text-sm" on:click={() => goto("/wallet")}>Open Wallet</button>
        {:else if hasWallet}
          <button class="cta-primary px-5 py-2.5 text-sm" on:click={() => goto("/unlock")}>Unlock Wallet</button>
        {:else}
          <button class="cta-ghost px-5 py-2.5 text-sm" on:click={() => goto("/import")}>Import seed</button>
          <button class="cta-primary px-5 py-2.5 text-sm" on:click={() => goto("/create")}>Create wallet</button>
        {/if}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="max-w-6xl mx-auto px-5 md:px-8 py-7 border-t border-white/[0.06]">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
      <p class="text-slate-700 text-xs">© 2024–2026 Rivara Wallet</p>
      <div class="flex gap-5">
        <a href="https://github.com/DogeGage/Rivara-Wallet" target="_blank" class="footer-link"><Github size={13}/> GitHub</a>
        <a href="/terms"   class="footer-link"><FileText size={13}/> Terms</a>
        <a href="/privacy" class="footer-link"><Shield size={13}/> Privacy</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    color: #64748b;
    font-size: 0.8125rem;
    border-radius: 0.4rem;
    transition: color 0.15s, background 0.15s;
  }
  .nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }

  .cta-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1.1rem;
    background: #b45309;
    color: white;
    font-weight: 600;
    font-size: 0.8125rem;
    border-radius: 0.5rem;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .cta-primary:hover { background: #92400e; }

  .cta-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1.1rem;
    background: transparent;
    color: #94a3b8;
    font-weight: 500;
    font-size: 0.8125rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.15s;
    white-space: nowrap;
  }
  .cta-ghost:hover { background: rgba(255,255,255,0.05); color: white; }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    color: #64748b;
    font-size: 0.875rem;
    border-radius: 0.4rem;
    transition: all 0.15s;
    width: 100%;
  }
  .mobile-nav-item:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }

  .feature-row {
    display: flex;
    align-items: baseline;
    gap: 1.5rem;
    padding: 1rem 0;
  }
  .feature-num {
    font-size: 0.65rem;
    font-family: monospace;
    color: #334155;
    min-width: 1.25rem;
    flex-shrink: 0;
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #475569;
    font-size: 0.8rem;
    transition: color 0.15s;
  }
  .footer-link:hover { color: #f59e0b; }

  .shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.08;
    background: linear-gradient(135deg, #92400e, #7c3aed);
    animation: float 32s infinite ease-in-out;
  }
  .shape-1 { width: 500px; height: 500px; top: -180px; left: -100px; }
  .shape-2 { width: 280px; height: 280px; top: 55%; right: -60px; animation-delay: -12s; }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-30px); }
  }
</style>
