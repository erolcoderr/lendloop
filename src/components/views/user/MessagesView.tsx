"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, MessageSquare, Package } from "lucide-react";

import { useCurrentUser, useData, useRouter } from "@/lib/store";
import type { BorrowRequest, Item, User } from "@/lib/types";
import { formatDate } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const containerVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVar = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/**
 * MessagesView — list of the current user's borrow-request chat threads.
 *
 * Each row is a borrow request the user is part of (as borrower or owner),
 * showing the other party + item + dates + a "Open chat" button that
 * navigates to the `chat` view with `{ requestId }`.
 */
export default function MessagesView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const requests = useData((s) => s.requests);
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);

  const userId = user?.id;
  const threads = useMemo(() => {
    if (!userId) return [];
    return requests
      .filter((r) => r.borrowerId === userId || r.ownerId === userId)
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [requests, userId]);

  if (!user) return null;

  const userById = (id: string): User | undefined =>
    users.find((u) => u.id === id);
  const itemById = (id: string): Item | undefined =>
    items.find((i) => i.id === id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a borrow to start or continue a conversation with your lending
          partner — coordinate pickup, return, or anything in between.
        </p>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="When you send or receive a borrow request, you'll be able to chat with the other party right here."
          actionLabel="Browse items"
          onAction={() => navigate("browse")}
        />
      ) : (
        <motion.ul
          variants={containerVar}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {threads.map((req) => {
            const isBorrower = req.borrowerId === user.id;
            const other = userById(isBorrower ? req.ownerId : req.borrowerId);
            const item = itemById(req.itemId);
            return (
              <motion.li key={req.id} variants={itemVar}>
                <Card className="flex items-center gap-3 p-4">
                  {other ? (
                    <Avatar user={other} size={40} />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {other?.name ?? "Neighbor"}
                      </p>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {isBorrower ? "Lender" : "Borrower"}
                      </span>
                    </div>
                    {item && (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <Package className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </p>
                    )}
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(req.startDate)} → {formatDate(req.endDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={req.status} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate("chat", { requestId: req.id })
                      }
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Open chat
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
