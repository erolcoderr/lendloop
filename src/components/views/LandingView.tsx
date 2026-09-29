"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Sparkles,
  PackageSearch,
  Handshake,
  FileSignature,
  PackageCheck,
  ShieldCheck,
  BadgeCheck,
  HeartHandshake,
  Users,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useData, useRouter, useCurrentUser } from "@/lib/store";
import { calculateTrustScore } from "@/lib/helpers";
import { ItemCard } from "@/components/shared/ItemCard";
import { CategoryArt, ALL_CATEGORIES } from "@/components/shared/CategoryArt";
import { Avatar } from "@/components/shared/Avatar";
import { SectionHeading } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Item, Review, User } from "@/lib/types";

/* --------------------------------------------------------- animation kit */

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

/* ---------------------------------------------------------------- content */

// Hero stats are now computed dynamically from the database (see below).

const HOW_IT_WORKS: {
  step: number;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    step: 1,
    icon: PackageSearch,
    title: "List your item",
    body: "Snap a photo, set your deposit and borrow window, and your item joins the barangay loop in minutes.",
  },
  {
    step: 2,
    icon: Handshake,
    title: "Request to borrow",
    body: "Found what you need? Send a request with your dates and a short message. Lenders see your trust score first.",
  },
  {
    step: 3,
    icon: FileSignature,
    title: "Agree & borrow",
    body: "Sign a light digital agreement, arrange pickup, and the item is yours — no awkward texts required.",
  },
  {
    step: 4,
    icon: PackageCheck,
    title: "Return & review",
    body: "Bring it back on time, leave an honest review, and watch both your trust scores climb together.",
  },
];

const WHY_LENDLOOP: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Trust scores that earn",
    body: "Every borrow and review shapes a 0–100 score. Good neighbors rise; the loop stays safe for everyone.",
  },
  {
    icon: BadgeCheck,
    title: "Verified kapitbahay",
    body: "Members are vouched for within a real barangay, so the lender on the other end is a neighbor, not a stranger.",
  },
  {
    icon: FileSignature,
    title: "Digital agreements",
    body: "A short, signed agreement replaces awkward IOUs — clear dates, clear deposits, no surprises.",
  },
  {
    icon: HeartHandshake,
    title: "Community first",
    body: "LendLoop is bayanihan, updated. Less buying, more borrowing. Less waste, more kapitbahay.",
  },
];

/* ============================================================ LandingView */

export default function LandingView() {
  const navigate = useRouter((s) => s.navigate);
  const user = useCurrentUser();
  const items = useData((s) => s.items);
  const users = useData((s) => s.users);
  const reviews = useData((s) => s.reviews);

  // Dynamic hero stats — computed from real database data.
  const memberCount = users.filter((u) => u.role === "user").length;
  const HERO_STATS: { icon: LucideIcon; value: string; label: string }[] = [
    {
      icon: PackageSearch,
      value: items.length > 0 ? `${items.length}` : "Be the first!",
      label: "Items shared",
    },
    {
      icon: Users,
      value: memberCount > 0 ? `${memberCount}` : "Join now!",
      label: "Community members",
    },
    {
      icon: MapPin,
      value: "1",
      label: "Barangay, growing",
    },
  ];

  // Featured = the four most-viewed items in the loop right now.
  const featured: Item[] = [...items]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  return (
    <div className="bg-background">
      {/* ============================================================ HERO */}
      <section className="bg-bayanihan-hero relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            {/* Copy + CTAs */}
            <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                A Digital Bayanihan
              </span>

              <h1 className="mt-5 font-[var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
                Borrow what you need.{" "}
                <span className="text-primary">Lend what you don&apos;t.</span>{" "}
                Together, kapitbahay.
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg text-balance">
                LendLoop turns your barangay into a shared closet, garage, and tool shed. Skip the buy, find a neighbor, and keep the bayanihan loop going.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate(user ? "browse" : "register")}
                >
                  {user ? "Browse items" : "Get started"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("browse")}
                >
                  <Search className="h-4 w-4" />
                  Browse items
                </Button>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {HERO_STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <s.icon className="h-3.5 w-3.5 text-primary" />
                      {s.label}
                    </dt>
                    <dd className="mt-1 font-[var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>

            {/* Mosaic visual */}
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              <HeroMosaic
                featured={featured.slice(0, 1)}
                users={users}
                reviews={reviews}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====================================================== FEATURED ITEMS */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Straight from the barangay"
              title="What neighbors are sharing right now"
              description="A living slice of what's circulating in the loop today — from power drills to party speakers."
            />
            <Button
              variant="outline"
              onClick={() => navigate("browse")}
              className="shrink-0"
            >
              See all items
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item, i) => {
              const owner = users.find((u) => u.id === item.ownerId);
              const itemReviews = reviews.filter((r) => r.itemId === item.id);
              return (
                <motion.div
                  key={item.id}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <ItemCard item={item} owner={owner} reviews={itemReviews} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================= HOW IT WORKS */}
      <section className="border-y border-border bg-secondary/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="How the loop works"
            title="Four small steps. One big bayanihan."
            description="From listing to return, LendLoop keeps every borrow clear, fair, and friendly."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <Card className="h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span
                      className="font-[var(--font-display)] text-3xl font-bold text-primary"
                      aria-hidden
                    >
                      0{step.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= WHY LENDLOOP */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Why LendLoop"
            title="Built on trust, not transactions"
            description="We borrowed the best of bayanihan — accountability, kinship, salamat — and gave it a layer of software."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_LENDLOOP.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <Card className="h-full p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-[var(--font-display)] text-base font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {f.body}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= CTA BAND */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 16px)",
              }}
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Ready to bring bayanihan back?
              </h2>
              <p className="mt-3 text-primary-foreground/85 text-balance">
                Join your barangay&apos;s lending loop today. It&apos;s free to start, and your first neighbor is already here.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate(user ? "browse" : "register")}
                >
                  {user ? "Browse items" : "Create your account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  onClick={() => navigate("browse")}
                >
                  Explore the loop
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------- HeroMosaic */

function HeroMosaic({
  featured,
  users,
  reviews,
}: {
  featured: Item[];
  users: User[];
  reviews: Review[];
}) {
  // Pick a verified neighbor for the floating trust pill.
  const verifiedUser =
    users.find((u) => u.verified && u.id !== "u_admin") ?? null;
  const verifiedScore = verifiedUser
    ? calculateTrustScore(reviews.filter((r) => r.toUserId === verifiedUser.id))
    : 0;

  return (
    <div className="relative">
      {/* decorative blurs */}
      <div
        className="pointer-events-none absolute -right-10 -top-8 h-44 w-44 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-12 h-48 w-48 rounded-full bg-accent/60 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-3">
        {/* Featured item card */}
        {featured[0] && (
          <ItemCard
            item={featured[0]}
            owner={users.find((u) => u.id === featured[0].ownerId)}
            reviews={reviews.filter((r) => r.itemId === featured[0].id)}
          />
        )}

        {/* Category tile row */}
        <div className="grid grid-cols-4 gap-3">
          {ALL_CATEGORIES.slice(0, 4).map((c, i) => (
            <div
              key={c}
              className="aspect-square overflow-hidden rounded-xl shadow-sm"
            >
              <CategoryArt
                category={c}
                className="h-full w-full"
                seed={i + 1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
