/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */

/**
 * DevTools Detector
 *
 * Detects when browser DevTools is opened and triggers auto-lock.
 *
 * REMOVED: The `debugger` statement detection method. A `debugger` inside
 * setInterval fires in production for ALL users any time the JS engine
 * happens to pause, causing false positives and a terrible UX. It also
 * doesn't actually prevent key theft — DevTools can already be open before
 * the interval fires. Window-size heuristics are sufficient and safe.
 *
 * REMOVED: The console.dir(Image) trick. It calls console.dir on every
 * tick, spamming the console and triggering false positives in some browsers.
 */

import { writable } from 'svelte/store';

export const devToolsOpen = writable(false);

class DevToolsDetector {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: Array<(isOpen: boolean) => void> = [];
  private isOpen = false;
  private readonly THRESHOLD = 160; // px — reliable heuristic for docked DevTools

  start(onDetect?: (isOpen: boolean) => void) {
    if (onDetect) this.callbacks.push(onDetect);
    if (this.checkInterval) return; // already running

    this.checkInterval = setInterval(() => this.check(), 1_000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.callbacks = [];
    this.isOpen = false;
    devToolsOpen.set(false);
  }

  isDevToolsOpen(): boolean {
    return this.isOpen;
  }

  private check() {
    const widthDiff  = window.outerWidth  - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const detected   = widthDiff > this.THRESHOLD || heightDiff > this.THRESHOLD;

    if (detected && !this.isOpen) {
      this.isOpen = true;
      devToolsOpen.set(true);
      this.callbacks.forEach(cb => cb(true));
    } else if (!detected && this.isOpen) {
      this.isOpen = false;
      devToolsOpen.set(false);
      this.callbacks.forEach(cb => cb(false));
    }
  }
}

export const devToolsDetector = new DevToolsDetector();
