"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Captcha — a self-contained "human verification" challenge for the register
 * form. Generates a random 5-character alphanumeric code and renders it as
 * distorted SVG text (rotated, colored, with background noise) so it's hard
 * for simple bots to read. The user must type the code into the input field.
 *
 * No external services or API keys required — everything runs client-side,
 * which is perfect for a capstone demo. (For production you'd use a service
 * like Cloudflare Turnstile or hCaptcha that does server-side verification.)
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
const CODE_LENGTH = 5;

/** Warm palette for per-character colors. */
const CHAR_COLORS = [
  "#C85A3B", // terracotta
  "#A04528", // dark terracotta
  "#D99441", // amber
  "#B5823F", // dark amber
  "#4A8E8A", // teal
  "#5B9268", // emerald
  "#7C4FBE", // purple
];

interface CaptchaProps {
  /** Called whenever the captcha's solved state changes. */
  onSolvedChange?: (solved: boolean) => void;
  /** Optional id for the input (for label association). */
  id?: string;
  className?: string;
}

export function Captcha({ onSolvedChange, id = "reg-captcha", className }: CaptchaProps) {
  // Lazy initializer generates the first code once, on mount — no effect needed.
  const [code, setCode] = useState<string>(() => generateCode());
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /** Generate a new captcha code + reset the input. */
  const regenerate = useCallback(() => {
    setCode(generateCode());
    setInput("");
    setTouched(false);
    setRefreshKey((k) => k + 1);
  }, []);

  // Notify parent when solved state changes — using useEffect (not render-phase)
  // to avoid the "Cannot update a component while rendering a different component"
  // React warning. The ref tracks the last reported value without triggering
  // a re-render.
  const solved = input.trim().toUpperCase() === code;
  const lastReported = useRef(false);
  useEffect(() => {
    if (lastReported.current !== solved) {
      lastReported.current = solved;
      onSolvedChange?.(solved);
    }
  }, [solved, onSolvedChange]);

  const showError = touched && !solved;
  const errorId = `${id}-err`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Human verification
        </label>
        {solved && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* ── The distorted captcha image (SVG) ── */}
        <div
          className="relative overflow-hidden rounded-lg border border-border bg-card"
          style={{ width: 140, height: 56 }}
          role="img"
          aria-label="Type the characters you see in this image"
        >
          <CaptchaSvg key={refreshKey} code={code} />
        </div>

        {/* ── Refresh button ── */}
        <button
          type="button"
          onClick={regenerate}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Get a new captcha code"
          title="Get a new code"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* ── Text input ── */}
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={CODE_LENGTH}
          placeholder="Type code"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={cn(
            "flex h-10 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] ring-offset-background transition-colors placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            showError && "border-destructive focus-visible:ring-destructive",
            solved && "border-emerald-500 text-emerald-700 dark:text-emerald-400",
          )}
        />
      </div>

      {showError && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          The code doesn&apos;t match. Click refresh for a new one.
        </p>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────── */

/**
 * CaptchaSvg — renders the code as distorted, colorful SVG text with a noisy
 * background. Each character gets a random rotation, vertical offset, and
 * color. Background squiggly lines + dots make OCR harder.
 */
function CaptchaSvg({ code }: { code: string }) {
  const chars = code.split("");
  const width = 140;
  const height = 56;
  // Deterministic noise based on the code so re-renders look consistent.
  const seed = hashCode(code);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <defs>
        {/* subtle warm gradient background */}
        <linearGradient id={`captcha-bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBF6EE" />
          <stop offset="100%" stopColor="#FCE8CD" />
        </linearGradient>
      </defs>

      {/* background */}
      <rect width={width} height={height} fill={`url(#captcha-bg-${seed})`} />

      {/* noise: squiggly lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = 10 + ((seed + i * 7) % 40);
        return (
          <path
            key={`line-${i}`}
            d={`M -5 ${y} Q ${width / 4} ${y - 8} ${width / 2} ${y} T ${width + 5} ${y}`}
            stroke="#D9C5AE"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
        );
      })}

      {/* noise: scattered dots */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (seed * (i + 1) * 13) % width;
        const y = (seed * (i + 1) * 7) % height;
        const r = 0.8 + ((seed + i) % 3) * 0.3;
        return <circle key={`dot-${i}`} cx={x} cy={y} r={r} fill="#C8B89E" opacity="0.4" />;
      })}

      {/* characters */}
      {chars.map((ch, i) => {
        const x = 16 + i * 24;
        const rotation = (((seed + i * 11) % 30) - 15); // -15 to +15 deg
        const yOffset = ((seed + i * 17) % 14) - 7; // -7 to +7
        const color = CHAR_COLORS[(seed + i * 3) % CHAR_COLORS.length];
        const fontSize = 24 + ((seed + i * 5) % 4);
        return (
          <text
            key={`char-${i}`}
            x={x}
            y={height / 2 + yOffset + 8}
            fontFamily="Georgia, serif"
            fontSize={fontSize}
            fontWeight="700"
            fill={color}
            transform={`rotate(${rotation} ${x} ${height / 2 + yOffset})`}
            style={{ userSelect: "none" }}
          >
            {ch}
          </text>
        );
      })}
    </svg>
  );
}

/** Simple string hash → number (for deterministic noise). */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Generate a random alphanumeric captcha code (excludes confusing chars). */
function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
