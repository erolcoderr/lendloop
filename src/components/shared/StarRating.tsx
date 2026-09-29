"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StarRating — dual-mode. `interactive` enables hover/click (review form);
 * display mode renders a compact read-only rating with an optional count.
 */
export function StarRating({
  value,
  onChange,
  size = 16,
  interactive = false,
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = interactive ? hover || value : value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rate 1 to 5 stars" : `Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            "transition-transform",
            interactive && "cursor-pointer hover:scale-110 focus-visible:scale-110",
            !interactive && "cursor-default"
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          aria-checked={interactive ? value === star : undefined}
          role={interactive ? "radio" : undefined}
          tabIndex={interactive ? 0 : undefined}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              star <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
