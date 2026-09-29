"use client";

import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/lib/types";
import {
  Wrench,
  Tent,
  Monitor,
  CookingPot,
  PartyPopper,
  Bike,
  BookOpen,
  Car,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";

/**
 * CategoryArt — on-brand gradient + icon placeholder used whenever an item
 * image is missing or fails to load. Keeps the gallery intentional rather than
 * showing broken images. Warm-leaning gradients per category (no blue/indigo).
 */
export const CATEGORY_META: Record<
  ItemCategory,
  { icon: LucideIcon; gradient: string; soft: string }
> = {
  Tools: {
    icon: Wrench,
    gradient: "from-[oklch(0.62_0.18_38)] to-[oklch(0.74_0.17_60)]",
    soft: "bg-[oklch(0.62_0.18_38/0.12)] text-[oklch(0.5_0.16_40)]",
  },
  Outdoor: {
    icon: Tent,
    gradient: "from-[oklch(0.55_0.16_150)] to-[oklch(0.6_0.13_165)]",
    soft: "bg-[oklch(0.55_0.16_150/0.12)] text-[oklch(0.42_0.13_155)]",
  },
  Electronics: {
    icon: Monitor,
    gradient: "from-[oklch(0.6_0.13_165)] to-[oklch(0.62_0.14_185)]",
    soft: "bg-[oklch(0.6_0.13_165/0.12)] text-[oklch(0.45_0.12_170)]",
  },
  Kitchen: {
    icon: CookingPot,
    gradient: "from-[oklch(0.72_0.16_60)] to-[oklch(0.66_0.18_45)]",
    soft: "bg-[oklch(0.72_0.16_60/0.14)] text-[oklch(0.52_0.16_55)]",
  },
  Party: {
    icon: PartyPopper,
    gradient: "from-[oklch(0.66_0.19_22)] to-[oklch(0.72_0.17_55)]",
    soft: "bg-[oklch(0.66_0.19_22/0.12)] text-[oklch(0.52_0.18_25)]",
  },
  Sports: {
    icon: Bike,
    gradient: "from-[oklch(0.58_0.16_145)] to-[oklch(0.7_0.17_85)]",
    soft: "bg-[oklch(0.58_0.16_145/0.12)] text-[oklch(0.44_0.14_150)]",
  },
  Books: {
    icon: BookOpen,
    gradient: "from-[oklch(0.62_0.18_38)] to-[oklch(0.7_0.16_65)]",
    soft: "bg-[oklch(0.62_0.18_38/0.12)] text-[oklch(0.5_0.16_45)]",
  },
  Vehicles: {
    icon: Car,
    gradient: "from-[oklch(0.66_0.18_45)] to-[oklch(0.6_0.13_165)]",
    soft: "bg-[oklch(0.66_0.18_45/0.12)] text-[oklch(0.5_0.16_50)]",
  },
};

export const ALL_CATEGORIES: ItemCategory[] = [
  "Tools",
  "Outdoor",
  "Electronics",
  "Kitchen",
  "Party",
  "Sports",
  "Books",
  "Vehicles",
];

export function CategoryArt({
  category,
  className,
  iconClassName,
  variant = "gradient",
  seed = 0,
}: {
  category: ItemCategory;
  className?: string;
  iconClassName?: string;
  variant?: "gradient" | "soft";
  seed?: number;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  // Slight hue rotation per seed so a gallery of identical categories still
  // feels like distinct "photos."
  const rotate = (seed % 5) * 6 - 12;
  if (variant === "soft") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl",
          meta.soft,
          className
        )}
      >
        <Icon className={cn("h-2/3 w-2/3", iconClassName)} />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        meta.gradient,
        className
      )}
      style={{ transform: `rotate(${rotate * 0.05}deg)` }}
    >
      {/* subtle weave texture */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 14px)",
        }}
      />
      <Icon
        className={cn("relative h-1/2 w-1/2 text-white/90", iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}

export function CategoryIcon({
  category,
  className,
}: {
  category: ItemCategory;
  className?: string;
}) {
  const Icon = CATEGORY_META[category].icon;
  return <Icon className={className} />;
}

export { PackageOpen };
