"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/lib/store";
import type { SocialLink, SocialPlatform } from "@/lib/types";
import { apiGet, apiPatch } from "@/lib/api-client";
import { formatDate, timeAgo } from "@/lib/helpers";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AdminLink = SocialLink & { userName: string; userEmail: string };

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  github: "GitHub",
  youtube: "YouTube",
  website: "Personal website",
};

const gridVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};
const cardVar = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

/**
 * AdminSocialLinksView — the admin approval queue for social links.
 *
 * Lists every pending link across all users with Approve/Reject buttons.
 * Approving grants a +1 (default), +2, or +3 bonus to the owner's trust score.
 *
 * All setState calls live inside Promise callbacks (not synchronously in
 * effect bodies) to satisfy the project lint rule.
 */
export default function AdminSocialLinksView() {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<AdminLink[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchLinks = () => {
    apiGet<{ links: AdminLink[] }>("/api/social-links/admin")
      .then((res) => setLinks(res.links))
      .catch(() => {
        // Empty queue on error — the empty state still renders fine.
        setLinks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  if (!user || user.role !== "admin") return null;

  const dismiss = (id: string) =>
    setLinks((prev) => prev.filter((l) => l.id !== id));

  const handleApprove = async (link: AdminLink, bonus: number) => {
    setBusyId(link.id);
    try {
      await apiPatch(`/api/social-links/${link.id}`, {
        action: "approve",
        bonus,
      });
      toast.success(
        `Approved ${link.userName}'s ${PLATFORM_LABELS[link.platform]} link (+${bonus} trust).`,
      );
      dismiss(link.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not approve that link.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (link: AdminLink) => {
    setBusyId(link.id);
    try {
      await apiPatch(`/api/social-links/${link.id}`, { action: "reject" });
      toast.info(`Rejected ${link.userName}'s ${PLATFORM_LABELS[link.platform]} link.`);
      dismiss(link.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reject that link.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Social link queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify social media links members add to their profiles. Each approved
          link grants a +1 trust bonus (+2 or +3 for high-trust platforms like LinkedIn).
          {links.length > 0 && (
            <span className="ml-1 font-semibold text-foreground">
              {links.length} waiting
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending social links"
          description="When a member adds a Facebook, Instagram, LinkedIn, or other profile to their account, it'll show up here for verification."
        />
      ) : (
        <motion.div
          variants={gridVar}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {links.map((link) => (
            <motion.div key={link.id} variants={cardVar}>
              <LinkReviewCard
                link={link}
                busy={busyId === link.id}
                onApprove={(bonus) => handleApprove(link, bonus)}
                onReject={() => handleReject(link)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- review card */

function LinkReviewCard({
  link,
  busy,
  onApprove,
  onReject,
}: {
  link: AdminLink;
  busy: boolean;
  onApprove: (bonus: number) => void;
  onReject: () => void;
}) {
  const [bonus, setBonus] = useState("1");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header: avatar + name + email + submitted date */}
        <div className="flex items-start gap-3 border-b border-border bg-card/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-[var(--font-display)] text-base font-bold tracking-tight text-foreground">
                {link.userName}
              </h2>
              <Badge className="border-transparent bg-amber-100 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                {PLATFORM_LABELS[link.platform] ?? link.platform}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {link.userEmail}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              Submitted {formatDate(link.createdAt)} · {timeAgo(link.createdAt)}
            </p>
          </div>
        </div>

        {/* Link preview */}
        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile URL
          </p>
          <a
            href={
              /^https?:\/\//.test(link.url)
                ? link.url
                : `https://${link.url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground hover:bg-muted"
          >
            <span className="truncate">{link.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-primary" />
          </a>

          {/* Bonus selector */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label
              htmlFor={`bonus-${link.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Trust bonus
            </label>
            <Select value={bonus} onValueChange={setBonus}>
              <SelectTrigger id={`bonus-${link.id}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">+1 (standard)</SelectItem>
                <SelectItem value="2">+2 (verified account)</SelectItem>
                <SelectItem value="3">+3 (high-trust platform)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-col gap-2 border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            disabled={busy}
            className={cn(
              "border-rose-300 text-rose-700 hover:bg-rose-50",
              "dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10",
            )}
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button
            type="button"
            onClick={() => onApprove(Number(bonus))}
            disabled={busy}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Working…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Approve (+{bonus})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
