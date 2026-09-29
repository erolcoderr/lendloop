"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials as toInitials } from "@/lib/helpers";
import type { User } from "@/lib/types";

/**
 * Avatar — shows a real avatar image with an initials-on-gradient fallback
 * (deterministic color from name hash so the same person always looks the same).
 */
const AVATAR_GRADIENTS = [
  "from-[oklch(0.62_0.18_38)] to-[oklch(0.74_0.17_60)]",
  "from-[oklch(0.55_0.16_150)] to-[oklch(0.6_0.13_165)]",
  "from-[oklch(0.72_0.16_60)] to-[oklch(0.66_0.18_45)]",
  "from-[oklch(0.66_0.19_22)] to-[oklch(0.72_0.17_55)]",
  "from-[oklch(0.58_0.16_145)] to-[oklch(0.7_0.17_85)]",
  "from-[oklch(0.6_0.13_165)] to-[oklch(0.62_0.14_185)]",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  user,
  className,
  size = 40,
  onClick,
}: {
  user: Pick<User, "name" | "avatar"> & { id?: string };
  className?: string;
  size?: number;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const gradient = AVATAR_GRADIENTS[hashName(user.name) % AVATAR_GRADIENTS.length];

  const wrapperClass = cn(
    "rounded-full object-cover ring-2 ring-card",
    onClick && "cursor-pointer hover:ring-primary/50 transition-all",
    className
  );

  if (user.avatar && !failed) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        onClick={onClick}
        className={wrapperClass}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-card",
        gradient,
        wrapperClass
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      onClick={onClick}
      aria-label={user.name}
    >
      {toInitials(user.name)}
    </span>
  );
}
