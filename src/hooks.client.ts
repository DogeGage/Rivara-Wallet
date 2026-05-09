/*
 * Rivara Wallet
 * Copyright (c) 2024-2026 DogeGage
 * Licensed under DogeGage Source Available License
 */
// Client hooks - services are now loaded via ES module imports where needed
// SECURITY FIX 3 & 4: Removed window.* global assignments and polling loops.
// All chain services are imported directly via ES modules in wallet-service.ts and send/*.js

import type { HandleClientError } from "@sveltejs/kit";

export const handleError: HandleClientError = ({ error, event }) => {
  console.error("Client error:", error);
  return {
    message: "An error occurred",
  };
};
