"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";
import { CategoryArt } from "./CategoryArt";

/**
 * SmartImage — renders a real <img> and gracefully falls back to a
 * CategoryArt gradient+icon tile if the URL is empty or fails to load.
 * Guarantees no broken-image icons anywhere in the prototype.
 *
 * Implementation: the parent keys the inner component on `src`, so when the
 * src changes React remounts the inner component and its load/failed state
 * resets naturally — no effects, no render-phase ref mutations.
 */
export function SmartImage({
  src,
  alt,
  category,
  seed = 0,
  className,
  imgClassName,
  fallbackClassName,
}: {
  src?: string;
  alt: string;
  category: ItemCategory;
  seed?: number;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}) {
  return (
    <SmartImageInner
      key={src ?? "__fallback__"}
      src={src}
      alt={alt}
      category={category}
      seed={seed}
      className={className}
      imgClassName={imgClassName}
      fallbackClassName={fallbackClassName}
    />
  );
}

function SmartImageInner({
  src,
  alt,
  category,
  seed,
  className,
  imgClassName,
  fallbackClassName,
}: {
  src?: string;
  alt: string;
  category: ItemCategory;
  seed: number;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn("relative", className)}>
        <CategoryArt
          category={category}
          seed={seed}
          className={cn("h-full w-full", fallbackClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "h-full w-full object-cover transition-[opacity,transform] duration-500",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          imgClassName
        )}
      />
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
    </div>
  );
}
