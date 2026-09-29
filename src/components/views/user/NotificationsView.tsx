"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  HandCoins,
  MessageSquare,
  PackageCheck,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { actions, useCurrentUser, useData, useRouter } from "@/lib/store";
import type { AppNotification, NotificationType, ViewName } from "@/lib/types";
import { timeAgo } from "@/lib/helpers";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const NOTIFICATION_META: Record<
  NotificationType,
  { icon: LucideIcon; accent: string }
> = {
  request_received: {
    icon: MessageSquare,
    accent: "bg-primary/10 text-primary",
  },
  request_approved: {
    icon: CheckCircle2,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  request_rejected: {
    icon: XCircle,
    accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  borrow_started: {
    icon: HandCoins,
    accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  return_reminder: {
    icon: Clock,
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  item_returned: {
    icon: PackageCheck,
    accent: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  review_received: {
    icon: Star,
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  system: {
    icon: Bell,
    accent: "bg-muted text-muted-foreground",
  },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function NotificationsView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const notifications = useData((s) => s.notifications);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const userId = user?.id;
  const mine = useMemo(
    () =>
      userId
        ? notifications
            .filter((n) => n.userId === userId)
            .sort(
              (a, b) =>
                +new Date(b.createdAt) - +new Date(a.createdAt),
            )
        : [],
    [notifications, userId],
  );
  const unread = useMemo(
    () => mine.filter((n) => !n.read),
    [mine],
  );
  const visible = tab === "unread" ? unread : mine;

  if (!user) return null;

  const handleClick = (n: AppNotification) => {
    if (!n.read) actions.markNotificationRead(n.id);
    if (n.link?.view) {
      navigate(n.link.view as ViewName, n.link.params);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates on your borrows, requests, and the trust you&rsquo;re
            building in {user.barangay}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => actions.markAllRead(user.id)}
          disabled={unread.length === 0}
        >
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </Button>
      </header>

      <div className="mt-6 flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <span className="ml-1.5 text-xs text-muted-foreground">
                {mine.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <span className="ml-1.5 text-xs text-muted-foreground">
                {unread.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              tab === "unread"
                ? "You're all caught up"
                : "No notifications yet"
            }
            description={
              tab === "unread"
                ? "Every borrow, request, and review has been seen. Kudos to you, kapitbahay."
                : "When neighbors request your items or leave reviews, you'll see it here first."
            }
            actionLabel={tab === "all" ? "Browse items" : undefined}
            onAction={tab === "all" ? () => navigate("browse") : undefined}
          />
        ) : (
          <motion.ul
            key={tab}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {visible.map((n) => {
              const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.system;
              const Icon = meta.icon;
              return (
                <motion.li key={n.id} variants={rowVariants}>
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => handleClick(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick(n);
                      }
                    }}
                    className={cn(
                      "cursor-pointer gap-0 p-4 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          meta.accent,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </Card>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
