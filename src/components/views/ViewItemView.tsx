"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Info,
  MapPin,
  PackageOpen,
  Pencil,
  PhilippinePeso,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser, useData, useRouter } from "@/lib/store";
import type { Item } from "@/lib/types";
import {
  avgRating,
  calculateTrustScore,
  formatPeso,
  timeAgo,
} from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/shared/ItemCard";
import { SmartImage } from "@/components/shared/SmartImage";
import { StarRating } from "@/components/shared/StarRating";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { CategoryIcon } from "@/components/shared/CategoryArt";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

/* ============================================================ ViewItemView */

export default function ViewItemView() {
  const navigate = useRouter((s) => s.navigate);
  const back = useRouter((s) => s.back);
  const itemId = useRouter((s) => s.params.itemId);
  const user = useCurrentUser();
  const items = useData((s) => s.items);
  const users = useData((s) => s.users);
  const reviews = useData((s) => s.reviews);

  const item = useMemo(() => items.find((it) => it.id === itemId), [items, itemId]);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <EmptyState
          icon={PackageOpen}
          title="We couldn't find that item"
          description="It may have been removed from the loop, or the link is off. Head back to browse and pick another from the barangay."
          actionLabel="Back to browse"
          onAction={() => navigate("browse")}
        />
      </div>
    );
  }

  const owner = users.find((u) => u.id === item.ownerId);
  const itemReviews = reviews.filter((r) => r.itemId === item.id);
  const ownerReviews = owner ? reviews.filter((r) => r.toUserId === owner.id) : [];
  const ownerTrust = calculateTrustScore(ownerReviews);
  const ratingAvg = avgRating(itemReviews.map((r) => r.rating));
  const isOwner = !!user && user.id === item.ownerId;

  const related = items
    .filter((it) => it.category === item.category && it.id !== item.id)
    .slice(0, 3);

  const bookedDateObjs = item.bookedDates
    .map((s) => new Date(s + "T00:00:00"))
    .filter((d) => !Number.isNaN(d.getTime()));

  // Disable past dates, dates beyond ~60 days, and any already-booked dates.
  // Using a predicate matcher (vs. {before: new Date()}) keeps "today" selectable.
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const sixtyOut = new Date(todayMidnight);
  sixtyOut.setDate(sixtyOut.getDate() + 60);

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < todayMidnight) return true;
    if (d > sixtyOut) return true;
    return bookedDateObjs.some((bd) => {
      const b = new Date(bd);
      b.setHours(0, 0, 0, 0);
      return b.getTime() === d.getTime();
    });
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb + back */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer"
                >
                  <button type="button" onClick={() => navigate("browse")}>
                    Browse
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="cursor-pointer"
                >
                  <button type="button" onClick={() => navigate("browse")}>
                    {item.category}
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 max-w-[60vw] sm:max-w-xs">
                  {item.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => back()}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main 2-col grid */}
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* =============================================== LEFT / MAIN */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.3 }}
            className="space-y-8 lg:col-span-2"
          >
            <ItemGallery key={item.id} item={item} />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                  <CategoryIcon category={item.category} className="h-3.5 w-3.5 text-primary" />
                  {item.category}
                </span>
                <StatusBadge status={item.status} />
                <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {item.condition}
                </span>
              </div>

              <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {item.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {item.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Up to {item.maxBorrowDays} days
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PhilippinePeso className="h-4 w-4 text-primary" />
                  {formatPeso(item.deposit)} refundable deposit
                </span>
              </div>

              <Separator />

              <div>
                <h2 className="font-[var(--font-display)] text-base font-semibold text-foreground">
                  About this item
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Availability calendar */}
            <Card className="gap-0 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-[var(--font-display)] text-base font-semibold text-foreground">
                    Availability
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Next 60 days. Booked dates are disabled.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Already booked
                </span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-center">
                <Calendar
                  disabled={isDateDisabled}
                  modifiers={{ booked: bookedDateObjs }}
                  modifiersClassNames={{
                    booked:
                      "line-through text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
                  }}
                  className="p-0"
                  aria-label="Availability calendar"
                />
              </div>
            </Card>

            {/* Reviews */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-[var(--font-display)] text-lg font-semibold text-foreground">
                    Neighbor reviews
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Real feedback from people who borrowed this item.
                  </p>
                </div>
                {itemReviews.length > 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
                    <span className="font-[var(--font-display)] text-2xl font-bold text-foreground">
                      {ratingAvg.toFixed(1)}
                    </span>
                    <div className="space-y-0.5">
                      <StarRating value={ratingAvg} size={14} />
                      <p className="text-xs text-muted-foreground">
                        {itemReviews.length} review{itemReviews.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {itemReviews.length === 0 ? (
                <EmptyState
                  icon={Info}
                  title="No reviews yet"
                  description="Be the first to borrow this item and leave a review to help your kapitbahay build trust in the loop."
                  className="mt-4"
                />
              ) : (
                <ul className="mt-4 space-y-3">
                  {itemReviews.map((rev, i) => {
                    const reviewer = users.find((u) => u.id === rev.fromUserId);
                    return (
                      <motion.li
                        key={rev.id}
                        {...fadeUp}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
                      >
                        <Card className="gap-3 p-4">
                          <div className="flex items-start gap-3">
                            {reviewer && <Avatar user={reviewer} size={40} />}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-foreground">
                                    {reviewer?.name ?? "Neighbor"}
                                  </span>
                                  {reviewer?.verified && (
                                    <BadgeCheck className="h-4 w-4 text-emerald-500" />
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {timeAgo(rev.createdAt)}
                                </span>
                              </div>
                              <StarRating value={rev.rating} size={13} className="mt-1" />
                              <p className="mt-2 text-sm text-muted-foreground">
                                {rev.comment}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>

          {/* =============================================== RIGHT / SIDEBAR */}
          <motion.aside
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="lg:sticky lg:top-24">
              <Card className="gap-5 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Borrow this
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-[var(--font-display)] text-3xl font-bold text-foreground">
                      {formatPeso(item.deposit)}
                    </span>
                    <span className="text-sm text-muted-foreground">refundable deposit</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Returned in full when the item comes back on time and in good condition.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">Max borrow</p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {item.maxBorrowDays} days
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/50 p-3">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="mt-0.5 line-clamp-1 font-semibold text-foreground">
                      {item.location}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Owner mini-card */}
                {owner && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lender
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar user={owner} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {owner.name}
                          </span>
                          {owner.verified && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                        </div>
                        <p className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {owner.barangay}, {owner.city}
                        </p>
                      </div>
                    </div>
                    <TrustBadge
                      score={ownerTrust}
                      reviewCount={ownerReviews.length}
                      variant="compact"
                      className="w-full justify-center"
                    />
                  </div>
                )}

                {/* Action button */}
                <div className="space-y-2">
                  {isOwner ? (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => navigate("edit-item", { itemId: item.id })}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit this item
                      </Button>
                      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        This is your item — neighbors see it in the loop.
                      </p>
                    </>
                  ) : !user ? (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          toast.info("Log in to borrow", {
                            description: "Sign in to send a borrow request to your kapitbahay.",
                          });
                          navigate("login");
                        }}
                      >
                        Log in to borrow
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        You&apos;ll sign a quick digital agreement next.
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => navigate("borrow-flow", { itemId: item.id })}
                      >
                        Request to borrow
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Pick your dates and sign the agreement in the next step.
                      </p>
                    </>
                  )}
                </div>
              </Card>

              {/* Trust note */}
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-bayanihan-weave p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  LendLoop holds deposits in trust. If something goes sideways,
                  your barangay captain can step in to help resolve it.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* =============================================== RELATED ITEMS */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-[var(--font-display)] text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  More in {item.category}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Other neighbors are sharing these too.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("browse")}>
                See all
              </Button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel, i) => {
                const relOwner = users.find((u) => u.id === rel.ownerId);
                const relReviews = reviews.filter((r) => r.itemId === rel.id);
                return (
                  <motion.div
                    key={rel.id}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <ItemCard item={rel} owner={relOwner} reviews={relReviews} />
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ ItemGallery */

function ItemGallery({ item }: { item: Item }) {
  // Keyed by item.id (parent passes key=) so the gallery resets to the primary
  // image whenever the user navigates between items — no setState-in-effect.
  const [idx, setIdx] = useState<number>(item.primaryImageIndex);
  const safeIdx =
    item.images.length === 0 ? 0 : Math.min(idx, item.images.length - 1);
  const hasMultiple = item.images.length > 1;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[4/3] w-full sm:aspect-[16/10]">
          <SmartImage
            src={item.images[safeIdx]}
            alt={item.title}
            category={item.category}
            seed={item.title.length + safeIdx}
            className="h-full w-full"
          />
        </div>
      </div>
      {hasMultiple && (
        <div className="grid grid-cols-5 gap-2">
          {item.images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`View image ${i + 1} of ${item.images.length}`}
              aria-pressed={i === safeIdx}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                i === safeIdx
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-primary/40",
              )}
            >
              <SmartImage
                src={src}
                alt={`${item.title} — image ${i + 1}`}
                category={item.category}
                seed={item.title.length + i}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
