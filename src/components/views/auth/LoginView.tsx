"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth, useData, useRouter } from "@/lib/store";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const REMEMBER_KEY = "lendloop-remembered-email";

const TRUST_BULLETS = [
  { icon: ShieldCheck, label: "Verified neighbors, not strangers" },
  { icon: HeartHandshake, label: "Trust scores built on real reviews" },
  { icon: Users, label: "1 barangay, growing every week" },
];

export default function LoginView() {
  const navigate = useRouter((s) => s.navigate);
  const login = useAuth((s) => s.login);
  const users = useData((s) => s.users);

  // Lazy init from localStorage — avoids setState-in-effect lint.
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(REMEMBER_KEY) || "";
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(REMEMBER_KEY);
  });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await login(email, password, remember);
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error || "Could not log you in.");
      // Trigger a short horizontal shake on the form for tactile feedback.
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }

    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);

    const matched = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    const firstName = matched?.name.split(" ")[0] ?? "kapitbahay";
    toast.success(`Mabuhay back, ${firstName}!`);
    navigate(matched?.role === "admin" ? "admin-dashboard" : "dashboard");
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-bayanihan-weave lg:grid-cols-2">
      {/* ============================================ Brand panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 14px)",
          }}
          aria-hidden
        />
        <div className="relative">
          <Logo className="[&_span]:text-primary-foreground" />
        </div>
        <div className="relative space-y-6">
          <h2 className="font-[var(--font-display)] text-3xl font-bold leading-tight text-balance">
            Welcome back, kapitbahay.
          </h2>
          <p className="text-primary-foreground/85 text-balance">
            Your barangay loop is one login away. Pick up where you left off — items to borrow, requests to answer, trust to grow.
          </p>
          <ul className="space-y-3">
            {TRUST_BULLETS.map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <b.icon className="h-4 w-4" />
                </span>
                {b.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-primary-foreground/70">
          LendLoop · A Digital Bayanihan Project
        </div>
      </aside>

      {/* ===================================================== Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <motion.div
            animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground"
              onClick={() => navigate("landing")}
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Button>

            <div className="mb-6 lg:hidden">
              <Logo />
            </div>

            <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
              Log in to LendLoop
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Salamat for coming back. The loop is waiting.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@lendloop.ph"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-pw">Password</Label>
                <div className="relative">
                  <Input
                    id="login-pw"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="login-remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <Label
                    htmlFor="login-remember"
                    className="cursor-pointer text-sm text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  onClick={() =>
                    toast.info(
                      "Password recovery is not available in this prototype. Please contact your barangay admin."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing you in…
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to LendLoop?{" "}
              <button
                type="button"
                onClick={() => navigate("register")}
                className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Get started
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
