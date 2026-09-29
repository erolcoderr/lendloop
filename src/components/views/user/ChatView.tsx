"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MessagesSquare,
  Package,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { actions, useCurrentUser, useData, useRouter } from "@/lib/store";
import type { Item, User } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { formatDate, timeAgo } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;

/**
 * ChatView — a per-borrow-request chat thread between the borrower and the
 * item owner. Reads `requestId` from the router store.
 *
 * Polls for new messages every 3 seconds with setInterval; the interval is
 * cleared in the effect cleanup function. All setState calls live inside
 * Promise .then() callbacks — never synchronously in the effect body — to
 * satisfy the project lint rule.
 */
export default function ChatView() {
  const user = useCurrentUser();
  const navigate = useRouter((s) => s.navigate);
  const requestId = useRouter((s) => s.params.requestId);

  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const requests = useData((s) => s.requests);

  const [messages, setMessages] = useState<
    { id: string; senderId: string; content: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  const request = useMemo(
    () => requests.find((r) => r.id === requestId),
    [requests, requestId],
  );
  const item: Item | undefined = useMemo(
    () => (request ? items.find((i) => i.id === request.itemId) : undefined),
    [items, request],
  );
  const otherParty: User | undefined = useMemo(() => {
    if (!request || !user) return undefined;
    return users.find(
      (u) =>
        u.id ===
        (request.borrowerId === user.id ? request.ownerId : request.borrowerId),
    );
  }, [request, users, user]);

  // Initial fetch + polling for new messages.
  useEffect(() => {
    if (!requestId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchMessages = () => {
      apiGet<{ messages: typeof messages }>(
        `/api/messages?requestId=${encodeURIComponent(requestId)}`,
      )
        .then((res) => {
          if (cancelled) return;
          setMessages(res.messages);
        })
        .catch(() => {
          // 403/404 means this thread doesn't belong to the user, or it was
          // deleted. Show the not-found state once, then stop polling.
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [requestId]);

  // Auto-scroll to the latest message when the list grows.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (!user) return null;

  if (loading && messages.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Loading conversation…</p>
        </div>
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
        <EmptyState
          icon={MessagesSquare}
          title="This conversation isn't available"
          description="The borrow request may have been removed, or you don't have access to this chat thread."
          actionLabel="Back to dashboard"
          onAction={() => navigate("dashboard")}
        />
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending || !requestId) return;
    setSending(true);
    const prevDraft = trimmed;
    setDraft("");
    try {
      await actions.sendMessage(requestId, prevDraft);
      // Trigger an immediate refresh instead of waiting for the next poll tick.
      apiGet<{ messages: typeof messages }>(
        `/api/messages?requestId=${encodeURIComponent(requestId)}`,
      )
        .then((res) => setMessages(res.messages))
        .catch(() => {
          /* polling will pick it up */
        });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send the message.");
      setDraft(prevDraft);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Button>

      <Card className="flex h-[70vh] flex-col gap-0 overflow-hidden p-0">
        {/* Header: other party + item being discussed */}
        <header className="flex items-start gap-3 border-b border-border bg-card/60 p-4">
          {otherParty ? (
            <Avatar user={otherParty} size={44} />
          ) : (
            <div className="h-11 w-11 rounded-full bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[var(--font-display)] text-base font-bold tracking-tight text-foreground">
                {otherParty?.name ?? "Neighbor"}
              </h1>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {request.borrowerId === user.id ? "Lender" : "Borrower"}
              </span>
            </div>
            {item && (
              <button
                onClick={() => navigate("view-item", { itemId: item.id })}
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
              >
                <Package className="h-3 w-3" />
                <span className="truncate">{item.title}</span>
                <span className="text-muted-foreground/70">·</span>
                <CalendarDays className="h-3 w-3" />
                {formatDate(request.startDate)} → {formatDate(request.endDate)}
              </button>
            )}
          </div>
          <StatusBadge status={request.status} />
        </header>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto scroll-warm bg-background p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={MessagesSquare}
                title="No messages yet — say hello!"
                description={
                  otherParty
                    ? `Coordinate pickup, return, or anything else with ${otherParty.name}.`
                    : "Coordinate pickup, return, or anything else with your lending partner."
                }
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m, i) => {
                const mine = m.senderId === user.id;
                const sender = users.find((u) => u.id === m.senderId);
                const prev = messages[i - 1];
                const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);
                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "flex items-end gap-2",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    {!mine && (
                      <div className="w-7 shrink-0">
                        {showAvatar && sender && <Avatar user={sender} size={28} />}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm border border-border bg-card text-foreground",
                      )}
                    >
                      {!mine && showAvatar && (
                        <p className="mb-0.5 text-[11px] font-semibold text-primary">
                          {sender?.name ?? "Neighbor"}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          mine
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
          <div ref={listEndRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border bg-card/60 p-3"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${otherParty?.name?.split(" ")[0] ?? "your neighbor"}…`}
            maxLength={2000}
            disabled={sending}
            autoComplete="off"
            aria-label="Type a message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
