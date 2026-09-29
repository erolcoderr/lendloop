"use client";

import { AppShell } from "@/components/app/AppShell";

/**
 * LendLoop — a single-route SPA. All "pages" are views switched client-side by
 * the router store (see src/lib/store.ts) and rendered inside AppShell.
 */
export default function Home() {
  return <AppShell />;
}
