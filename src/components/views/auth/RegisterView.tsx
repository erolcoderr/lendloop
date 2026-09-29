"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HeartHandshake,
  ImageIcon,
  Loader2,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAuth, useRouter } from "@/lib/store";
import { isEmail, passwordStrength } from "@/lib/helpers";
import { Logo } from "@/components/shared/Logo";
import { Captcha } from "@/components/shared/Captcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TRUST_BULLETS = [
  { icon: ShieldCheck, label: "Verified neighbors, not strangers" },
  { icon: HeartHandshake, label: "Trust scores built on real reviews" },
  { icon: Users, label: "1 barangay, growing every week" },
];

/** Max image size accepted client-side (matches the server's 5MB cap). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FieldKey = "name" | "email" | "password" | "confirm" | "barangay" | "city";

export default function RegisterView() {
  const navigate = useRouter((s) => s.navigate);
  const register = useAuth((s) => s.register);

  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    barangay: "",
    city: "",
  });
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
    barangay: false,
    city: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaSolved, setCaptchaSolved] = useState(false);

  // Verification photos stored as base64 data URLs.
  const [avatar, setAvatar] = useState("");
  const [faceImage, setFaceImage] = useState("");
  const [idImage, setIdImage] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);

  // "pending" success screen shown after registration (account created,
  // waiting for admin approval).
  const [submitted, setSubmitted] = useState(false);

  const pw = useMemo(() => passwordStrength(values.password), [values.password]);

  const errors: Record<FieldKey, string> = {
    name:
      touched.name && values.name.trim().length < 2
        ? "Tell us your name."
        : "",
    email:
      touched.email && values.email && !isEmail(values.email)
        ? "Enter a valid email address."
        : "",
    password:
      touched.password && values.password && values.password.length < 8
        ? "Use at least 8 characters."
        : "",
    confirm:
      touched.confirm && values.confirm && values.confirm !== values.password
        ? "Passwords don't match yet."
        : "",
    barangay: touched.barangay && !values.barangay.trim() ? "Required" : "",
    city: touched.city && !values.city.trim() ? "Required" : "",
  };

  const formValid =
    values.name.trim().length >= 2 &&
    isEmail(values.email) &&
    values.password.length >= 8 &&
    values.confirm === values.password &&
    !!values.barangay.trim() &&
    !!values.city.trim() &&
    !!avatar &&
    !!faceImage &&
    !!idImage &&
    captchaSolved;

  function setField(key: FieldKey, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }
  function blurField(key: FieldKey) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  /** Read a File as a base64 data URL via FileReader. */
  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress an image File to a JPEG data URL, max 800px wide, ~0.7 quality.
   * Keeps the base64 payload small (under ~500KB).
   */
  async function compressImage(file: File): Promise<string> {
    const dataUrl = await readAsDataURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Could not process that image."));
      img.src = dataUrl;
    });
  }

  async function handlePhotoSelect(
    file: File | undefined,
    setter: (v: string) => void = setAvatar,
  ) {
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(
        `"${file.name}" is ${Math.round(file.size / 1024 / 1024)}MB — please use a photo under 5MB.`,
      );
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setter(dataUrl);
    } catch {
      setImageError("Could not read that image. Try a different file.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirm: true,
      barangay: true,
      city: true,
    });
    if (!formValid) {
      toast.error(
        !avatar || !faceImage || !idImage
          ? "Please upload your profile picture, face photo, and ID photo."
          : !captchaSolved
            ? "Please complete the human verification."
            : "Please fix the highlighted fields.",
      );
      return;
    }
    setSubmitting(true);
    const res = await register({
      name: values.name,
      email: values.email,
      password: values.password,
      barangay: values.barangay,
      city: values.city,
      avatar,
      faceImage,
      idImage,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Could not create your account.");
      return;
    }
    // Registration succeeded but the user is NOT logged in — they need admin
    // approval first. Show the "pending" success screen.
    toast.success("Account created! Waiting for admin approval.");
    setSubmitted(true);
  }

  // ── PENDING SUCCESS SCREEN ──────────────────────────────────────
  if (submitted) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-bayanihan-weave lg:grid-cols-2">
        <PendingPanel />
        <div className="flex items-center justify-center px-4 py-10 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
              <Clock className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
              Account created!
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your registration has been sent to the barangay admin for review.
              Once approved, you&apos;ll be able to log in and start lending.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-card/60 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What happens next?
              </p>
              <ol className="mt-2 space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  An admin reviews your profile picture
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  You receive a notification when approved
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  You can log in and start borrowing
                </li>
              </ol>
            </div>
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={() => navigate("login")}
            >
              Go to login
            </Button>
            <button
              type="button"
              onClick={() => navigate("landing")}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Back to home
            </button>
          </motion.div>
        </div>
      </div>
    );
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
            Join the loop your barangay already shares.
          </h2>
          <p className="text-primary-foreground/85 text-balance">
            Borrow what you need, lend what you don&apos;t, and build trust with every kapitbahay exchange.
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It takes a minute. An admin will review your registration before you can log in.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {/* ── Verification photos ── */}
            <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Verification photos <span className="text-destructive">*</span>
                </h2>
              </div>

              {/* All three photos in a uniform 3-column grid */}
              <div className="grid gap-3 sm:grid-cols-3">
                <PhotoUpload
                  id="reg-avatar"
                  label="Profile picture"
                  hint="This becomes your avatar."
                  value={avatar}
                  onChange={(file) => handlePhotoSelect(file, setAvatar)}
                  onClear={() => setAvatar("")}
                />
                <PhotoUpload
                  id="reg-face"
                  label="Face photo"
                  hint="A clear selfie."
                  value={faceImage}
                  onChange={(file) => handlePhotoSelect(file, setFaceImage)}
                  onClear={() => setFaceImage("")}
                />
                <PhotoUpload
                  id="reg-id"
                  label="ID photo"
                  hint="Any government or school ID."
                  value={idImage}
                  onChange={(file) => handlePhotoSelect(file, setIdImage)}
                  onClear={() => setIdImage("")}
                />
              </div>

              {imageError && (
                <p className="text-xs text-destructive" role="alert">
                  {imageError}
                </p>
              )}

              <p className="flex items-start gap-2 rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  All three photos are sent to the barangay admin for verification.
                  You&apos;ll be able to log in once approved.
                </span>
              </p>
            </div>

            <Field
              id="reg-name"
              label="Full name"
              error={errors.name}
            >
              <Input
                id="reg-name"
                value={values.name}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => blurField("name")}
                placeholder="Maya Santos"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "reg-name-err" : undefined}
              />
            </Field>

            <Field id="reg-email" label="Email" error={errors.email}>
              <Input
                id="reg-email"
                type="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => blurField("email")}
                placeholder="maya@barangay.ph"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "reg-email-err" : undefined}
              />
            </Field>

            <div>
              <Field id="reg-pw" label="Password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="reg-pw"
                    type={showPw ? "text" : "password"}
                    value={values.password}
                    onChange={(e) => setField("password", e.target.value)}
                    onBlur={() => blurField("password")}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="pr-10"
                    aria-describedby="reg-pw-strength"
                    aria-invalid={!!errors.password}
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
              </Field>

              {values.password && (
                <div className="mt-2" id="reg-pw-strength" aria-live="polite">
                  <div className="flex gap-1.5" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i < pw.score ? pw.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Strength:{" "}
                    <span className="font-medium text-foreground">
                      {pw.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <Field id="reg-confirm" label="Confirm password" error={errors.confirm}>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={values.confirm}
                  onChange={(e) => setField("confirm", e.target.value)}
                  onBlur={() => blurField("confirm")}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={!!errors.confirm}
                  aria-describedby={
                    errors.confirm ? "reg-confirm-err" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="reg-barangay"
                label="Barangay"
                error={errors.barangay}
              >
                <Input
                  id="reg-barangay"
                  value={values.barangay}
                  onChange={(e) => setField("barangay", e.target.value)}
                  onBlur={() => blurField("barangay")}
                  placeholder="Mabini"
                  autoComplete="address-level3"
                  aria-invalid={!!errors.barangay}
                  aria-describedby={
                    errors.barangay ? "reg-barangay-err" : undefined
                  }
                />
              </Field>
              <Field id="reg-city" label="City" error={errors.city}>
                <Input
                  id="reg-city"
                  value={values.city}
                  onChange={(e) => setField("city", e.target.value)}
                  onBlur={() => blurField("city")}
                  placeholder="Quezon City"
                  autoComplete="address-level2"
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "reg-city-err" : undefined}
                />
              </Field>
            </div>

            <Captcha onSolvedChange={setCaptchaSolved} />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("login")}
              className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Log in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* PhotoUpload — uniform square tile upload for all verification photos */
/* ──────────────────────────────────────────────────────────────── */

function PhotoUpload({
  id,
  label,
  hint,
  value,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Square preview area (clickable) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          value
            ? "border-primary/40 bg-card"
            : "border-border bg-muted/40 hover:border-primary/60 hover:bg-accent",
        )}
        aria-label={value ? `Change ${label}` : `Upload ${label}`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
            <span
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label={`Remove ${label}`}
              role="button"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Click to upload
            </span>
          </div>
        )}
      </button>

      {/* Label + hint below the image */}
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && (
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            {hint}
          </p>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
        className="sr-only"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* PendingPanel — the brand panel reused for the success screen      */
/* ──────────────────────────────────────────────────────────────── */

function PendingPanel() {
  return (
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
          Almost there, kapitbahay!
        </h2>
        <p className="text-primary-foreground/85 text-balance">
          Your account has been created. A barangay admin will review your
          profile picture and approve you shortly.
        </p>
      </div>
      <div className="relative text-xs text-primary-foreground/70">
        LendLoop · A Digital Bayanihan Project
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------- Field */

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p
          id={`${id}-err`}
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
