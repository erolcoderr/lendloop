"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/store";
import { Logo } from "@/components/shared/Logo";

/**
 * AppHydrator — on mount, fetches the current session + all data from the API
 * (/api/hydrate) and populates the Zustand stores. Shows a branded splash
 * while loading so the app never flashes empty states.
 */
export function AppHydrator({ children }: { children: ReactNode }) {
  const hydrated = useAuth((s) => s.hydrated);
  const hydrate = useAuth((s) => s.hydrate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate().catch((e) => {
      const msg = e?.message || String(e);
      setError(msg);
    });
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bayanihan-weave">
        <div className="animate-pop">
          <Logo />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Connecting to the barangay…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo />
        <div className="max-w-lg space-y-2">
          <h1 className="font-[var(--font-display)] text-xl font-semibold">
            Can&apos;t reach the database
          </h1>
          <p className="text-sm text-muted-foreground">
            Make sure MySQL is running and the database is set up. Run these commands in your project folder:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-left text-xs">
{`bun run db:push    # create tables
bun run db:seed     # load demo data
bun run dev         # restart the server`}
          </pre>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              Show error details
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-destructive/10 p-3 text-left text-xs text-destructive">
{error}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
