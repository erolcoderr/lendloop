"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  ExternalLink,
  HandCoins,
  Link2,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Phone,
  Plus,
  Repeat,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useData } from "@/lib/store";
import type { SocialLink, SocialPlatform, User } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { calculateTrustScore, formatDate, timeAgo } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const reviewsListVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const reviewItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function ProfileView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);
  const reviews = useData((s) => s.reviews);

  // Local-only social links cache — kept here (not in the shared Zustand
  // store) because they're per-user and we only need them on this view.
  // The .then() callback keeps setState out of the synchronous effect body
  // (per the project lint rule).
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const userId = user?.id;
  const receivedReviews = useMemo(
    () =>
      userId
        ? reviews
            .filter((r) => r.toUserId === userId)
            .sort(
              (a, b) =>
                +new Date(b.createdAt) - +new Date(a.createdAt),
            )
        : [],
    [reviews, userId],
  );

  const fetchSocialLinks = () => {
    apiGet<{ links: SocialLink[] }>("/api/social-links")
      .then((res) => setSocialLinks(res.links))
      .catch(() => {
        // Silent fail — the card just shows empty.
      });
  };

  // Initial load of the current user's social links.
  useEffect(() => {
    apiGet<{ links: SocialLink[] }>("/api/social-links")
      .then((res) => setSocialLinks(res.links))
      .catch(() => {
        // Silent fail — the card just shows empty.
      });
  }, [userId]);

  const approvedBonus = useMemo(
    () =>
      socialLinks
        .filter((l) => l.status === "approved")
        .reduce((sum, l) => sum + l.bonus, 0),
    [socialLinks],
  );
  const trustScore = calculateTrustScore(receivedReviews, approvedBonus);
  const itemsShared = useMemo(
    () => (userId ? items.filter((it) => it.ownerId === userId).length : 0),
    [items, userId],
  );
  const successfulBorrows = useMemo(
    () =>
      userId
        ? requests.filter(
            (r) => r.borrowerId === userId && r.status === "returned",
          ).length
        : 0,
    [requests, userId],
  );

  if (!user) return null;

  const userById = (id: string): User | undefined =>
    users.find((u) => u.id === id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {user.name}
              </h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {user.barangay}, {user.city}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* LEFT: edit form */}
        <EditProfileCard user={user} />

        {/* RIGHT: trust + account + stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
                Trust & reputation
              </h2>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4">
              <TrustBadge
                score={trustScore}
                reviewCount={receivedReviews.length}
                variant="full"
              />
            </div>
            {approvedBonus > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Link2 className="h-3.5 w-3.5" />
                +{approvedBonus} from {socialLinks.filter((l) => l.status === "approved").length} verified social link{socialLinks.filter((l) => l.status === "approved").length === 1 ? "" : "s"}
              </p>
            )}
          </Card>

          <SocialLinksCard
            links={socialLinks}
            onChange={fetchSocialLinks}
          />

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
                Reviews about you
              </h2>
              <span className="text-xs text-muted-foreground">
                {receivedReviews.length} review
                {receivedReviews.length === 1 ? "" : "s"}
              </span>
            </div>
            {receivedReviews.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={MessageSquareQuote}
                  title="No reviews yet"
                  description="Lend or borrow a few times — reviews from your kapitbahay will appear here and shape your trust score."
                />
              </div>
            ) : (
              <motion.ul
                variants={reviewsListVariants}
                initial="hidden"
                animate="show"
                className="mt-4 max-h-96 space-y-3 overflow-y-auto scroll-warm pr-1"
              >
                {receivedReviews.map((r) => {
                  const from = userById(r.fromUserId);
                  return (
                    <motion.li
                      key={r.id}
                      variants={reviewItemVariants}
                      className="rounded-lg border border-border bg-card/60 p-3"
                    >
                      <div className="flex items-start gap-3">
                        {from && <Avatar user={from} size={32} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {from?.name ?? "Anonymous"}
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {timeAgo(r.createdAt)}
                            </span>
                          </div>
                          <StarRating value={r.rating} size={14} />
                          {r.comment && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              &ldquo;{r.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
              Account summary
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryRow
                icon={BadgeCheck}
                label="Verification"
                value={
                  user.verified ? "Verified member" : "Unverified"
                }
                tone={
                  user.verified
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }
              />
              <SummaryRow
                icon={ShieldCheck}
                label="Role"
                value={user.role === "admin" ? "Barangay admin" : "Community member"}
                className="capitalize"
              />
              <SummaryRow
                icon={MapPin}
                label="Barangay"
                value={user.barangay}
              />
              <SummaryRow
                icon={CalendarDays}
                label="Joined"
                value={formatDate(user.joinedAt)}
              />
              {user.phone && (
                <SummaryRow
                  icon={Phone}
                  label="Phone"
                  value={user.phone}
                />
              )}
            </dl>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              icon={HandCoins}
              value={itemsShared}
              label="Items shared"
              accent="bg-primary/10 text-primary"
            />
            <StatTile
              icon={Repeat}
              value={successfulBorrows}
              label="Successful borrows"
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              icon={Star}
              value={receivedReviews.length}
              label="Reviews received"
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileCard({ user }: { user: User }) {
  const [avatar, setAvatar] = useState(user.avatar);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [barangay, setBarangay] = useState(user.barangay);
  const [city, setCity] = useState(user.city);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const trimmedName = name.trim();
  const trimmedBarangay = barangay.trim();
  const trimmedCity = city.trim();
  const nameError = !trimmedName
    ? "Your display name can't be empty."
    : null;
  const barangayError = !trimmedBarangay
    ? "Add your barangay so neighbors can find you."
    : null;
  const cityError = !trimmedCity ? "Add your city." : null;
  const hasErrors = !!(nameError || barangayError || cityError);

  // Live preview avatar.
  const previewUser = { name: trimmedName || user.name, avatar };

  /** Read a File as a base64 data URL. */
  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  /** Compress an image to max 400px, JPEG 0.7 quality (keeps payload small). */
  async function compressImage(file: File): Promise<string> {
    const dataUrl = await readAsDataURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 400;
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
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Could not process that image."));
      img.src = dataUrl;
    });
  }

  async function handleAvatarSelect(file: File | undefined) {
    if (!file) return;
    setAvatarError(null);
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB. Try a smaller photo.");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setAvatar(dataUrl);
    } catch {
      setAvatarError("Could not read that image. Try a different file.");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    try {
      await actions.updateProfile(user.id, {
        name: trimmedName,
        avatar,
        bio: bio.trim(),
        phone: phone.trim(),
        barangay: trimmedBarangay,
        city: trimmedCity,
      });
      toast.success("Profile updated — salamat for keeping your details fresh.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            Edit profile
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Neighbors see this when they consider borrowing from you.
          </p>
        </div>
        <Avatar user={user} size={44} />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
        {/* Avatar editor: circular file upload */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative">
              <Avatar user={previewUser} size={80} />
              {avatar && avatar !== user.avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar(user.avatar)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                  aria-label="Reset avatar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Label>Profile photo</Label>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {avatar && avatar !== user.avatar ? "Change photo" : "Upload photo"}
            </Button>
            {avatarError && (
              <p className="text-xs text-destructive" role="alert">
                {avatarError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload a photo from your device. It will be compressed automatically.
            </p>
          </div>
        </div>

        <Field id="profile-name" label="Display name" required error={touched ? nameError : null}>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-invalid={!!(touched && nameError)}
          />
        </Field>

        <Field
          id="profile-bio"
          label="Short bio"
          hint={`${bio.length} characters · a sentence or two about you`}
        >
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Weekend DIY-er and plantita. Happy to lend my tools so neighbors don't have to buy new."
            rows={3}
            maxLength={240}
          />
        </Field>

        <Field id="profile-phone" label="Phone" hint="Optional — only shown to your borrowing partners">
          <Input
            id="profile-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+63 917 555 0000"
            inputMode="tel"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="profile-barangay"
            label="Barangay"
            required
            error={touched ? barangayError : null}
          >
            <Input
              id="profile-barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              aria-invalid={!!(touched && barangayError)}
            />
          </Field>
          <Field
            id="profile-city"
            label="City"
            required
            error={touched ? cityError : null}
          >
            <Input
              id="profile-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-invalid={!!(touched && cityError)}
            />
          </Field>
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  tone,
  className,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd
          className={cn(
            "truncate text-sm font-semibold text-foreground",
            tone,
            className,
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof ShieldCheck;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <Card className="gap-0 p-4">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          accent,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-[var(--font-display)] text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}

/* ----------------------------------------------- social links card */

const PLATFORM_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Personal website" },
];

function platformLabel(platform: SocialPlatform): string {
  return PLATFORM_OPTIONS.find((p) => p.value === platform)?.label ?? platform;
}

const LINK_STATUS_META: Record<
  SocialLink["status"],
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    classes:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    classes:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    classes:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
};

function SocialLinksCard({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: () => void;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedLinks = [...links].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Paste the link to your profile.");
      return;
    }
    setSaving(true);
    try {
      await actions.addSocialLink({ platform, url: trimmed });
      toast.success(`${platformLabel(platform)} link added — pending review.`);
      setUrl("");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not add that link.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await actions.deleteSocialLink(id);
      toast.success("Link removed.");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not remove that link.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
            Social media links
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each approved link adds +5 to your trust score. The admin reviews each link before it counts.
          </p>
        </div>
        <Link2 className="h-5 w-5 text-primary" />
      </div>

      {/* Add-link form */}
      <form
        onSubmit={handleAdd}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="social-platform">Platform</Label>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as SocialPlatform)}
          >
            <SelectTrigger id="social-platform" className="w-full">
              <SelectValue placeholder="Pick a platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-[2] space-y-1.5">
          <Label htmlFor="social-url">Profile URL</Label>
          <Input
            id="social-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://facebook.com/your.name"
            inputMode="url"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={saving} className="shrink-0">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add link
            </>
          )}
        </Button>
      </form>

      {/* Existing links */}
      {sortedLinks.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No social links yet. Add one above to boost your trust score.
        </p>
      ) : (
        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto scroll-warm pr-1">
          {sortedLinks.map((link) => {
            const meta = LINK_STATUS_META[link.status];
            return (
              <li
                key={link.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Link2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {platformLabel(link.platform)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        meta.classes,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                    {link.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        +{link.bonus} trust
                      </span>
                    )}
                  </div>
                  <a
                    href={
                      /^https?:\/\//.test(link.url)
                        ? link.url
                        : `https://${link.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                  >
                    <span className="truncate">{link.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  {link.reviewedAt && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                      Reviewed {timeAgo(link.reviewedAt)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === link.id}
                  onClick={() => handleDelete(link.id)}
                  aria-label={`Remove ${platformLabel(link.platform)} link`}
                >
                  {deletingId === link.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
