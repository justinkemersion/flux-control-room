"use server";

import { signOut } from "@/auth";

/** Clears Auth.js session cookies (use after rotating AUTH_SECRET or stale JWT errors). */
export async function clearStaleSessionAction() {
  await signOut({ redirectTo: "/" });
}
