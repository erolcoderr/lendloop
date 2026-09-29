"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  HandCoins,
  MapPin,
  MessageSquareQuote,
  Phone,
  Repeat,
  ShieldCheck,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useData, useRouter } from "@/lib/store";
import type { User } from "@/lib/types";
import { calculateTrustScore, formatDate, timeAgo } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function ViewProfileView() {
  const navigate = useRouter((s) => s.navigate);
  const params = useRouter((s) => s.params);
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);
  const reviews = useData((s) => s.reviews);
  const back = useRouter((s) => s.back);

  const userId = params.userId;
  const profileUser = users.find((u) => u.id === userId);

  const receivedReviews = useMemo(
    () =>
      userId
        ? reviews
            .filter((r) => r.toUserId === userId)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        : [],
    [reviews, userId],
  );
  const trustScore = calculateTrustScore(receivedReviews);
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

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState
          icon={ShieldCheck}
          title="Profile not found"
          description="This user may no longer be on LendLoop."
        />
      </div>
    );
  }

  const userById = (id: string): User | undefined =>
    users.find((u) => u.id === id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => back()}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar user={profileUser} size={64} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {profileUser.name}
            </h1>
            {profileUser.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {profileUser.barangay}, {profileUser.city}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* LEFT: items */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
              Items shared
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {itemsShared} item{itemsShared === 1 ? "" : "s"} listed on LendLoop
            </p>
          </Card>

          {itemsShared > 0 && (
            <div className="space-y-3">
              {items
                .filter((it) => it.ownerId === profileUser.id)
                .map((it) => (
                  <Card key={it.id} className="flex items-center gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HandCoins className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {it.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {it.category} · Up to {it.maxBorrowDays} days
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {it.status}
                    </Badge>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* RIGHT: trust + reviews */}
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
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
                Reviews
              </h2>
              <span className="text-xs text-muted-foreground">
                {receivedReviews.length} review{receivedReviews.length === 1 ? "" : "s"}
              </span>
            </div>
            {receivedReviews.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={MessageSquareQuote}
                  title="No reviews yet"
                  description="Reviews from kapitbahay will appear here and shape this member's trust score."
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
                value={profileUser.verified ? "Verified" : "Unverified"}
                tone={profileUser.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
              />
              <SummaryRow icon={MapPin} label="Barangay" value={profileUser.barangay} />
              <SummaryRow icon={CalendarDays} label="Joined" value={formatDate(profileUser.joinedAt)} />
              <SummaryRow icon={HandCoins} label="Items shared" value={`${itemsShared}`} />
              <SummaryRow icon={Repeat} label="Successful borrows" value={`${successfulBorrows}`} />
              <SummaryRow icon={Star} label="Reviews received" value={`${receivedReviews.length}`} />
            </dl>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={HandCoins} value={itemsShared} label="Items shared" accent="bg-primary/10 text-primary" />
            <StatTile icon={Repeat} value={successfulBorrows} label="Successful borrows" accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
            <StatTile icon={Star} value={receivedReviews.length} label="Reviews" accent="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone?: string;
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
        <dd className="truncate text-sm font-semibold text-foreground {tone}">
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
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-[var(--font-display)] text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}
