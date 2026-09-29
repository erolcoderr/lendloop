"use client";

import { cn } from "@/lib/utils";

/**
 * LendLoop logomark — two interlocking arcs forming a loop, suggesting the
 * circular give-and-take of bayanihan. Rendered as SVG so it stays crisp at
 * any size and recolors with the theme.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ll-grad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="oklch(0.62 0.18 38)" />
            <stop offset="100%" stopColor="oklch(0.74 0.17 60)" />
          </linearGradient>
        </defs>
        {/* outer loop */}
        <path
          d="M20 3.5a16.5 16.5 0 1 0 0 33 16.5 16.5 0 0 0 0-33Zm0 6a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21Z"
          fill="url(#ll-grad)"
        />
        {/* handshake-ish arrows suggesting lend + return */}
        <path
          d="M14.5 18.5h8m0 0-2.2-2.2m2.2 2.2-2.2 2.2"
          stroke="oklch(0.98 0.01 70)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M25.5 21.5h-8m0 0 2.2 2.2m-2.2-2.2 2.2-2.2"
          stroke="oklch(0.98 0.01 70)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
      {showWordmark && (
        <span className="font-[var(--font-display)] text-xl font-bold tracking-tight text-foreground">
          Lend<span className="text-primary">Loop</span>
        </span>
      )}
    </span>
  );
}
