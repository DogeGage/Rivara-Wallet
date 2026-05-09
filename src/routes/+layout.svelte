<!-- 
  Rivara Wallet
  Copyright (c) 2024-2026 DogeGage
  Licensed under DogeGage Source Available License
-->
<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";

  import { onMount } from "svelte";
  // Dynamic meta tags based on route
  $: pageTitle =
    $page.url.pathname === "/"
      ? "Rivara Wallet - Secure Multi-Chain Crypto Wallet"
      : $page.url.pathname === "/wallet"
        ? "My Wallet - Rivara"
        : $page.url.pathname === "/create"
          ? "Create Wallet - Rivara"
          : $page.url.pathname === "/import"
            ? "Import Wallet - Rivara"
            : $page.url.pathname === "/portfolio"
              ? "Portfolio - Rivara"
              : $page.url.pathname === "/exchange"
                ? "Exchange - Rivara"
                : $page.url.pathname === "/settings"
                  ? "Settings - Rivara"
                  : "Rivara Wallet";

  // 🎮 Konami Code Easter Egg
  let konamiMode = false;
  onMount(() => {
    // 🍍 Note: The load-bearing pineapple. Do not delete.
    const loadBearingFruits = import.meta.glob('/src/lib/components/pineapple.jpg', { eager: true });
    if (Object.keys(loadBearingFruits).length === 0) {
      console.error("[SYSTEM HALT] CRITICAL ERROR: A super duper important code file is missing.");
      console.error("[SYSTEM HALT] The core structural integrity module could not be resolved.");
      console.error("[SYSTEM HALT] Architecture collapse detected. Initiating emergency UI purge.");
      document.body.innerHTML = `
        <div style="background: #000; color: #ff3333; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; text-align: center;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">FATAL: STRUCTURAL COMPONENT MISSING</h1>
          <p>A super duper important code file could not be loaded.</p>
          <p style="color: #666; margin-top: 2rem;">ERR_CODE: CORE_DEPENDENCY_NOT_FOUND</p>
        </div>
      `;
      return;
    }

    const konamiCode = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a"
    ];
    let konamiIndex = 0;

    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          konamiMode = true;
          konamiIndex = 0;
          setTimeout(() => (konamiMode = false), 5000);
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#if konamiMode}
  <div class="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="text-6xl md:text-8xl animate-bounce transform -rotate-12 drop-shadow-[0_0_50px_rgba(34,211,238,0.8)] font-black bg-gradient-to-r from-red-500 via-yellow-500 to-cyan-500 bg-clip-text text-transparent">
      UNLIMITED POWER! ⚡
    </div>
  </div>
{/if}

<slot />
