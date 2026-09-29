"use client";

import { ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { trustTier } from "@/lib/helpers";
import { Progress } from "@/components/ui/progress";

/**
 * TrustBadge — surfaces the lender/borrower trust score prominently (UI/UX
 * skill: "trust signals visible"). Shows the score, a tiered label, a progress
 * bar, and an optional review count for context.
 */
export function TrustBadge({
  score,
  reviewCount,
  variant = "compact",
  className,
}: {
  score: number;
  reviewCount?: number;
  variant?: "compact" | "full";
  className?: string;
}) {
  const tier = trustTier(score);
  const tone =
    tier.tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-amber-600 dark:text-amber-400";

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold",
          className
        )}
        title={`Trust score ${score}/100 · ${tier.label}`}
      >
        <ShieldCheck className={cn("h-3.5 w-3.5", tone)} />
        <span className={tone}>{score}</span>
        <span className="text-muted-foreground font-normal">{tier.label}</span>
      </span>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className={cn("h-4 w-4", tone)} />
          Trust Score
        </span>
        <span className={cn("text-2xl font-bold tabular-nums", tone)}>{score}</span>
      </div>
      <Progress value={score} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn("font-medium", tone)}>{tier.label}</span>
        {typeof reviewCount === "number" && (
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
