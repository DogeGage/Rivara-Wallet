/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
/**
 * Dev Mode Service
 * Activated by sending any amount of BTC to the magic address "676767".
 * State is persisted in localStorage so it survives page reloads.
 * Toggle off by clicking "Disable Dev Mode" in Settings → Dev Mode.
 */

import { writable, get } from "svelte/store";

const STORAGE_KEY = "rivara_devmode";
const MAGIC_ADDRESS = "676767";

// --- Store ------------------------------------------------------------
function createDevModeStore() {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false;

  const { subscribe, set } = writable<boolean>(stored);

  return {
    subscribe,
    enable() {
      localStorage.setItem(STORAGE_KEY, "true");
      set(true);
    },
    disable() {
      localStorage.setItem(STORAGE_KEY, "false");
      set(false);
    },
    toggle() {
      const current = get({ subscribe });
      current ? this.disable() : this.enable();
    },
    get isEnabled() {
      return get({ subscribe });
    },
  };
}

export const devMode = createDevModeStore();

// --- Magic send interceptor -------------------------------------------
/**
 * Call this in confirmSend() BEFORE the real send logic.
 * Returns true if the send was intercepted (dev mode toggle), false otherwise.
 *
 * @param chain  - e.g. 'bitcoin'
 * @param toAddress - the destination address entered by the user
 */
export function interceptDevModeSend(
  chain: string,
  toAddress: string,
): boolean {
  if (chain === "bitcoin" && toAddress.trim() === MAGIC_ADDRESS) {
    if (devMode.isEnabled) {
      devMode.disable();
      console.log(
        "%c🔒 Dev Mode DISABLED",
        "color:#ef4444;font-weight:bold;font-size:14px",
      );
    } else {
      devMode.enable();
      console.log(
        "%c🛠️ Dev Mode ENABLED",
        "color:#22d3ee;font-weight:bold;font-size:14px",
      );
    }
    return true; // intercepted — do NOT send a real transaction
  }
  return false;
}
