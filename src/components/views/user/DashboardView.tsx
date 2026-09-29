"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  FileText,
  HandCoins,
  Loader2,
  MessageSquare,
  Plus,
  Pencil,
  Repeat,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useData, useRouter } from "@/lib/store";
import type { BorrowRequest, Item, User } from "@/lib/types";
import { calculateTrustScore, formatDate } from "@/lib/helpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/shared/ItemCard";
import { StarRating } from "@/components/shared/StarRating";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const ACTIVE_STATUSES = ["pending", "approved", "borrowed"] as const;
function isActiveStatus(status: BorrowRequest["status"]) {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

export default function DashboardView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);
  const reviews = useData((s) => s.reviews);
  const users = useData((s) => s.users);

  const [reviewTarget, setReviewTarget] = useState<BorrowRequest | null>(null);

  const userId = user?.id;
  const myItems = useMemo(
    () => (userId ? items.filter((it) => it.ownerId === userId) : []),
    [items, userId],
  );
  const myLoans = useMemo(
    () => (userId ? requests.filter((r) => r.ownerId === userId) : []),
    [requests, userId],
  );
  const myBorrows = useMemo(
    () => (userId ? requests.filter((r) => r.borrowerId === userId) : []),
    [requests, userId],
  );
  const receivedReviews = useMemo(
    () => (userId ? reviews.filter((r) => r.toUserId === userId) : []),
    [reviews, userId],
  );
  const trustScore = calculateTrustScore(receivedReviews);
  const activeBorrowsCount = myBorrows.filter((r) =>
    isActiveStatus(r.status),
  ).length;
  const activeLoansCount = myLoans.filter((r) =>
    isActiveStatus(r.status),
  ).length;

  if (!user) return null;

  const userById = (id: string): User | undefined =>
    users.find((u) => u.id === id);
  const itemById = (id: string): Item | undefined =>
    items.find((it) => it.id === id);

  const firstName = user.name.split(" ")[0];

  // --- request state machine handlers --------------------------------------
  // The server-side API for updateRequestStatus sets the request status,
  // syncs the related item status, AND creates the appropriate notification
  // to the borrower. We just await the action and toast.
  const handleApprove = async (req: BorrowRequest) => {
    const borrower = userById(req.borrowerId);
    try {
      await actions.updateRequestStatus(req.id, "approved");
      toast.success(`Approved ${borrower?.name ?? "borrower"}'s request.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not approve the request.");
    }
  };

  const handleReject = async (req: BorrowRequest) => {
    try {
      await actions.updateRequestStatus(req.id, "rejected");
      toast.info("Request declined — borrower notified.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not decline the request.");
    }
  };

  const handleMarkBorrowed = async (req: BorrowRequest) => {
    const it = itemById(req.itemId);
    try {
      await actions.updateRequestStatus(req.id, "borrowed");
      toast.success("Marked as borrowed — item is in their hands.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not mark as borrowed.");
      void it;
    }
  };

  const handleMarkReturned = async (req: BorrowRequest) => {
    try {
      await actions.updateRequestStatus(req.id, "returned");
      toast.success("Return recorded — item is available again.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not mark as returned.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await actions.deleteItem(itemId);
      toast.success("Item removed from the loop.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete the item.");
    }
  };

  const handleReviewSubmit = async (payload: {
    toUserId: string;
    itemId: string;
    requestId: string;
    rating: number;
    comment: string;
  }) => {
    try {
      await actions.createReview(payload);
      toast.success("Review submitted — salamat for keeping the loop honest!");
      setReviewTarget(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit the review.");
    }
  };

  // --- render --------------------------------------------------------------
  const stats = [
    {
      icon: HandCoins,
      label: "Items I'm lending",
      value: myItems.length,
      accent: "bg-primary/10 text-primary",
    },
    {
      icon: ArrowRightLeft,
      label: "Active borrows",
      value: activeBorrowsCount,
      accent: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      icon: Repeat,
      label: "Active loans",
      value: activeLoansCount,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      icon: ShieldCheck,
      label: "My trust score",
      value: trustScore,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {user.barangay} · {user.city}
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Mabuhay, {firstName}!
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Here&rsquo;s your lending loop at a glance — requests to act on,
            items you&rsquo;re sharing, and the trust you&rsquo;ve built.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={itemVariants}>
            <Card className="gap-0 p-4 sm:p-5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  s.accent,
                )}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-[var(--font-display)] text-3xl font-bold tabular-nums text-foreground">
                {s.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                {s.label}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column lists */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <header>
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
              Borrow requests on your items
            </h2>
            <p className="text-sm text-muted-foreground">
              Approve, hand off, and close the loop with your neighbors.
            </p>
          </header>
          {myLoans.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No requests on your items yet"
              description="When a neighbor asks to borrow something you've listed, you'll act on it here."
              actionLabel="Lend your first item"
              onAction={() => navigate("add-item")}
            />
          ) : (
            <ul className="space-y-3">
              {myLoans
                .slice()
                .sort(
                  (a, b) =>
                    +new Date(b.createdAt) - +new Date(a.createdAt),
                )
                .map((req) => (
                  <OwnerRequestRow
                    key={req.id}
                    request={req}
                    item={itemById(req.itemId)}
                    borrower={userById(req.borrowerId)}
                    onNavigateItem={(id) =>
                      navigate("view-item", { itemId: id })
                    }
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onMarkBorrowed={handleMarkBorrowed}
                    onMarkReturned={handleMarkReturned}
                    onReview={() => setReviewTarget(req)}
                    onChat={() =>
                      navigate("chat", { requestId: req.id })
                    }
                  />
                ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <header>
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight text-foreground">
              My active borrows
            </h2>
            <p className="text-sm text-muted-foreground">
              Track the items you&rsquo;ve requested and review when you return
              them.
            </p>
          </header>
          {myBorrows.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="You haven't borrowed anything yet"
              description="Browse the loop and request the gear you need for your next project or trip."
              actionLabel="Browse items"
              onAction={() => navigate("browse")}
            />
          ) : (
            <ul className="space-y-3">
              {myBorrows
                .slice()
                .sort(
                  (a, b) =>
                    +new Date(b.createdAt) - +new Date(a.createdAt),
                )
                .map((req) => (
                  <BorrowerRequestRow
                    key={req.id}
                    request={req}
                    item={itemById(req.itemId)}
                    owner={userById(req.ownerId)}
                    onNavigateItem={(id) =>
                      navigate("view-item", { itemId: id })
                    }
                    onReview={() => setReviewTarget(req)}
                    onChat={() =>
                      navigate("chat", { requestId: req.id })
                    }
                  />
                ))}
            </ul>
          )}
        </section>
      </div>

      {/* My items grid */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              My items
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Edit details or remove something you no longer share.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("add-item")}
            className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>

        {myItems.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={HandCoins}
              title="No items listed yet"
              description="When you list items to lend, they'll appear here."
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myItems.map((it) => {
              const itemReviews = reviews.filter((r) => r.itemId === it.id);
              return (
                <div key={it.id} className="space-y-2">
                  <ItemCard item={it} owner={user} reviews={itemReviews} compact />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        navigate("edit-item", { itemId: it.id })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:border-destructive hover:bg-destructive hover:text-white"
                          aria-label={`Delete ${it.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete &ldquo;{it.title}&rdquo;?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the item from the loop. Active
                            requests on it will stay in your dashboard so you
                            can follow up. This can&rsquo;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => handleDeleteItem(it.id)}
                          >
                            Delete item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review dialog */}
      <ReviewDialog
        target={reviewTarget}
        getOtherParty={(r) =>
          userById(r.ownerId === user.id ? r.borrowerId : r.ownerId)
        }
        getItem={(r) => itemById(r.itemId)}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- request rows */

function DateRange({ start, end }: { start: string; end: string }) {
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      {formatDate(start)} → {formatDate(end)}
    </span>
  );
}

function OwnerRequestRow({
  request,
  item,
  borrower,
  onNavigateItem,
  onApprove,
  onReject,
  onMarkBorrowed,
  onMarkReturned,
  onReview,
  onChat,
}: {
  request: BorrowRequest;
  item?: Item;
  borrower?: User;
  onNavigateItem: (id: string) => void;
  onApprove: (r: BorrowRequest) => void;
  onReject: (r: BorrowRequest) => void;
  onMarkBorrowed: (r: BorrowRequest) => void;
  onMarkReturned: (r: BorrowRequest) => void;
  onReview: () => void;
  onChat: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);

  return (
    <Card className="gap-3 p-4">
      <AgreementDialog
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        request={request}
        otherParty={borrower}
        item={item}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => item && onNavigateItem(item.id)}
            className="text-left"
            disabled={!item}
          >
            <h3 className="line-clamp-1 font-[var(--font-display)] text-sm font-semibold text-foreground hover:text-primary">
              {item?.title ?? "Item removed"}
            </h3>
          </button>
          {borrower && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar user={borrower} size={24} />
              <span className="text-xs font-medium text-foreground">
                {borrower.name}
              </span>
              <span className="text-xs text-muted-foreground">
                · {borrower.barangay}
              </span>
            </div>
          )}
          <div className="mt-2">
            <DateRange start={request.startDate} end={request.endDate} />
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {request.message && (
        <p className="line-clamp-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          &ldquo;{request.message}&rdquo;
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {request.status === "pending" && (
          <>
            <Button size="sm" onClick={() => onApprove(request)}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request)}
            >
              Reject
            </Button>
          </>
        )}
        {request.status === "approved" && (
          <Button size="sm" onClick={() => onMarkBorrowed(request)}>
            Mark as borrowed
          </Button>
        )}
        {request.status === "borrowed" && (
          <Button size="sm" onClick={() => onMarkReturned(request)}>
            Mark as returned
          </Button>
        )}
        {request.status === "returned" && (
          <Button size="sm" variant="outline" onClick={onReview}>
            Leave review
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onChat}>
          <MessageSquare className="h-3.5 w-3.5" /> Chat
        </Button>
        {request.agreementText && (
          <Button size="sm" variant="ghost" onClick={() => setAgreementOpen(true)}>
            <FileText className="h-3.5 w-3.5" /> Agreement
          </Button>
        )}
        {(request.status === "rejected" ||
          request.status === "cancelled") && (
          <span className="text-xs text-muted-foreground">
            Closed · {formatDate(request.createdAt)}
          </span>
        )}
      </div>
    </Card>
  );
}

function BorrowerRequestRow({
  request,
  item,
  owner,
  onNavigateItem,
  onReview,
  onChat,
}: {
  request: BorrowRequest;
  item?: Item;
  owner?: User;
  onNavigateItem: (id: string) => void;
  onReview: () => void;
  onChat: () => void;
}) {
  const [agreementOpen, setAgreementOpen] = useState(false);

  return (
    <Card className="gap-3 p-4">
      <AgreementDialog
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        request={request}
        otherParty={owner}
        item={item}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => item && onNavigateItem(item.id)}
            className="text-left"
            disabled={!item}
          >
            <h3 className="line-clamp-1 font-[var(--font-display)] text-sm font-semibold text-foreground hover:text-primary">
              {item?.title ?? "Item removed"}
            </h3>
          </button>
          {owner && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar user={owner} size={24} />
              <span className="text-xs font-medium text-foreground">
                {owner.name}
              </span>
              <span className="text-xs text-muted-foreground">
                · {owner.barangay}
              </span>
            </div>
          )}
          <div className="mt-2">
            <DateRange start={request.startDate} end={request.endDate} />
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        {request.status === "returned" && (
          <Button size="sm" variant="outline" onClick={onReview}>
            Leave review
          </Button>
        )}
        {request.status === "pending" && (
          <span className="text-xs text-muted-foreground">
            Awaiting {owner?.name ?? "owner"}&rsquo;s response
          </span>
        )}
        {request.status === "approved" && (
          <span className="text-xs text-muted-foreground">
            Coordinate pickup with {owner?.name ?? "the owner"}
          </span>
        )}
        {request.status === "borrowed" && (
          <span className="text-xs text-muted-foreground">
            Due back {formatDate(request.endDate)}
          </span>
        )}
        <Button size="sm" variant="outline" onClick={onChat}>
          <MessageSquare className="h-3.5 w-3.5" /> Chat
        </Button>
        {request.agreementText && (
          <Button size="sm" variant="ghost" onClick={() => setAgreementOpen(true)}>
            <FileText className="h-3.5 w-3.5" /> Agreement
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ============================================================ AgreementDialog */

function AgreementDialog({
  open,
  onOpenChange,
  request,
  otherParty,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: BorrowRequest;
  otherParty?: User;
  item?: Item;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Borrower&rsquo;s Agreement
          </DialogTitle>
          <DialogDescription>
            {item ? `"${item.title}"` : "Item"} ·{" "}
            {otherParty ? `with ${otherParty.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-muted px-2 py-1">
              Dates: {formatDate(request.startDate)} → {formatDate(request.endDate)}
            </span>
            {item && (
              <span className="rounded-md bg-muted px-2 py-1">
                Deposit: {item.deposit > 0 ? `₱${item.deposit}` : "None"}
              </span>
            )}
            {request.wantsCopy && (
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                ✅ Copy requested
              </span>
            )}
          </div>
          {request.agreementText ? (
            <ScrollArea className="max-h-80 rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
{request.agreementText}
              </pre>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              No agreement text was stored with this request.
            </p>
          )}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {request.agreementSigned ? "✅ Signed" : "⚠️ Not signed"} by{" "}
              <strong>{request.signatureName || "—"}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (request.agreementText) {
                  navigator.clipboard.writeText(request.agreementText);
                  toast.success("Agreement copied to clipboard!");
                }
              }}
            >
              Copy text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- review dialog */

function ReviewDialog({
  target,
  getOtherParty,
  getItem,
  onClose,
  onSubmit,
}: {
  target: BorrowRequest | null;
  getOtherParty: (r: BorrowRequest) => User | undefined;
  getItem: (r: BorrowRequest) => Item | undefined;
  onClose: () => void;
  onSubmit: (payload: {
    toUserId: string;
    itemId: string;
    requestId: string;
    rating: number;
    comment: string;
  }) => Promise<void> | void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Keyed-remount pattern: when target changes, reset local state cleanly
  // without any synchronous setState-in-effect (lint rule).
  const targetKey = target?.id ?? "closed";

  const otherParty = target ? getOtherParty(target) : undefined;
  const item = target ? getItem(target) : undefined;
  const open = target !== null;

  const close = () => {
    onClose();
    // Defer reset so the closing transition isn't visually janky.
    setTimeout(() => {
      setRating(0);
      setComment("");
    }, 200);
  };

  const canSubmit = rating > 0 && comment.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!target || !otherParty || !canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        toUserId: otherParty.id,
        itemId: target.itemId,
        requestId: target.id,
        rating,
        comment: comment.trim(),
      });
      setRating(0);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent key={targetKey} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
          <DialogDescription>
            {otherParty && item
              ? `How was lending "${item.title}" to ${otherParty.name}? Your honest review shapes their trust score.`
              : "Share how this borrow went. Your honest review shapes the community's trust."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <StarRating
              value={rating}
              onChange={setRating}
              interactive
              size={28}
            />
            <p className="text-xs text-muted-foreground">
              {rating === 0
                ? "Tap a star to rate"
                : rating === 5
                  ? "Outstanding — five stars"
                  : rating >= 4
                    ? "Great experience"
                    : rating === 3
                      ? "It went okay"
                      : "Could have gone better"}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="review-comment"
              className="text-sm font-medium text-foreground"
            >
              Your review
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked well? Would you lend to (or borrow from) them again?"
              disabled={rating === 0}
              rows={4}
              aria-label="Review comment"
            />
            <p className="text-xs text-muted-foreground">
              {rating === 0
                ? "Pick a star first to unlock the comment box."
                : `${comment.trim().length} characters`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
