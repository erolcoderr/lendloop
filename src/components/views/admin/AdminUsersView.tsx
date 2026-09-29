"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Users2,
  ShieldCheck,
  ShieldMinus,
} from "lucide-react";

import { actions, useCurrentUser, useData } from "@/lib/store";
import { calculateTrustScore, formatDate } from "@/lib/helpers";
import { Avatar } from "@/components/shared/Avatar";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import type { User } from "@/lib/types";

/* ----------------------------------------------------------- motion */

const rowVar = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};
const tbodyVar = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/* ----------------------------------------------------------- types */

type SortKey = "name" | "trust" | "joinedAt" | "itemsShared";
type SortDir = "asc" | "desc";
type FilterKey = "all" | "active" | "suspended" | "admins";

interface MemberRow extends User {
  trust: number;
  itemsShared: number;
  reviewCount: number;
}

const PAGE_SIZE = 8;

/* ============================================================ component */

export default function AdminUsersView() {
  const user = useCurrentUser();
  const users = useData((s) => s.users);
  const items = useData((s) => s.items);
  const reviews = useData((s) => s.reviews);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const trustMap = useData((s) => s.trustMap);

  const rows = useMemo<MemberRow[]>(() => {
    return users.map((u) => {
      const userReviews = reviews.filter((r) => r.toUserId === u.id);
      const ta = trustMap[u.id] ?? 0;
      return {
        ...u,
        trust: calculateTrustScore(userReviews, 0, ta),
        reviewCount: userReviews.length,
        itemsShared: items.filter((i) => i.ownerId === u.id).length,
      };
    });
  }, [users, reviews, items, trustMap]);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter === "active") out = out.filter((u) => u.status === "active");
    else if (filter === "suspended")
      out = out.filter((u) => u.status === "suspended");
    else if (filter === "admins") out = out.filter((u) => u.role === "admin");

    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return [...out].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "trust") cmp = a.trust - b.trust;
      else if (sortKey === "joinedAt")
        cmp = +new Date(a.joinedAt) - +new Date(b.joinedAt);
      else if (sortKey === "itemsShared") cmp = a.itemsShared - b.itemsShared;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, filter, search, sortKey, sortDir]);

  if (!user || user.role !== "admin") return null;
  if (loading) return <UsersSkeleton />;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="h-px w-6 bg-primary/50" />
          Steward Console
        </span>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Member Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Keep the loop fair — manage who can lend and borrow across{" "}
          {user.barangay}.
        </p>
      </header>

      {/* Toolbar */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
              aria-label="Search members"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as FilterKey)}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter members">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="admins">Admins</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table — keyed by filter so the page resets when the filter changes */}
      <MembersTable
        key={filter}
        rows={filtered}
        setUserStatus={actions.setUserStatus}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
      />
    </div>
  );
}

/* ----------------------------------------------------------- table */

function MembersTable({
  rows,
  setUserStatus,
  sortKey,
  sortDir,
  onToggleSort,
}: {
  rows: MemberRow[];
  setUserStatus: (id: string, status: "active" | "suspended") => Promise<void> | void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
}) {
  const [page, setPage] = useState(1);
  const [trustTarget, setTrustTarget] = useState<MemberRow | null>(null);
  const [trustAmount, setTrustAmount] = useState("");
  const [trustReason, setTrustReason] = useState("");
  const [trustSubmitting, setTrustSubmitting] = useState(false);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users2}
        title="No members match"
        description="Try a different search term or filter to find the kapitbahay you're looking for."
      />
    );
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key)
      return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  // Build a compact page-number list (current ±1 + edges)
  const pageNumbers: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= safePage - 1 && p <= safePage + 1)
    ) {
      pageNumbers.push(p);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%]">
                  <button
                    type="button"
                    onClick={() => onToggleSort("name")}
                    className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Member {sortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Barangay</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => onToggleSort("trust")}
                    className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Trust {sortIcon("trust")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => onToggleSort("itemsShared")}
                    className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Items {sortIcon("itemsShared")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    type="button"
                    onClick={() => onToggleSort("joinedAt")}
                    className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Joined {sortIcon("joinedAt")}
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody
              key={safePage}
              variants={tbodyVar}
              initial="hidden"
              animate="show"
              className="[&>tr]:border-b"
            >
              {pageRows.map((m) => {
                const isAdmin = m.role === "admin";
                return (
                  <motion.tr
                    key={m.id}
                    variants={rowVar}
                    className="transition-colors hover:bg-accent/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar user={m} size={38} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-foreground">
                              {m.name}
                            </span>
                            {m.verified && (
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {m.barangay}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={isAdmin ? "default" : "secondary"}
                        className="font-medium"
                      >
                        {isAdmin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.status === "active" ? (
                        <Badge className="border-transparent bg-emerald-100 font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-rose-100 font-medium text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                          Suspended
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <TrustBadge score={m.trust} reviewCount={m.reviewCount} />
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-foreground sm:table-cell">
                      {m.itemsShared}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(m.joinedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setTrustTarget(m)}
                          >
                            <ShieldMinus className="h-3 w-3" /> Trust
                          </Button>
                        )}
                        <Switch
                          checked={m.status === "active"}
                          disabled={isAdmin}
                          aria-label={
                            isAdmin
                              ? `${m.name} is an admin`
                              : `${m.status === "active" ? "Suspend" : "Reactivate"} ${m.name}`
                          }
                          onCheckedChange={(checked) => {
                            const next = checked ? "active" : "suspended";
                            void setUserStatus(m.id, next);
                            toast.success(
                              `${next === "suspended" ? "Suspended" : "Reactivated"} ${m.name}`
                            );
                          }}
                        />
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </Table>
        </div>
      </CardContent>
      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, rows.length)}
          </span>{" "}
          of <span className="font-medium text-foreground">{rows.length}</span>{" "}
          members
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goTo(safePage - 1);
                }}
                aria-disabled={safePage <= 1}
                className={
                  safePage <= 1 ? "pointer-events-none opacity-40" : ""
                }
              />
            </PaginationItem>
            {pageNumbers.map((p, idx) => {
              const prev = pageNumbers[idx - 1];
              return (
                <span key={p} className="flex items-center">
                  {prev && p - prev > 1 && (
                    <PaginationItem className="pointer-events-none">
                      <PaginationLink href="#">…</PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={p === safePage}
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                </span>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goTo(safePage + 1);
                }}
                aria-disabled={safePage >= totalPages}
                className={
                  safePage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <Dialog open={!!trustTarget} onOpenChange={(open) => { if (!open) setTrustTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust trust score</DialogTitle>
            <DialogDescription>
              {trustTarget ? `${trustTarget.name} (current: ${trustTarget.trust})` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="trust-amount">Amount (use negative for deduction)</Label>
              <Input
                id="trust-amount"
                type="number"
                value={trustAmount}
                onChange={(e) => setTrustAmount(e.target.value)}
                placeholder="-5"
              />
              <p className="text-xs text-muted-foreground">
                Positive = bonus, negative = deduction. Range: -50 to +50.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trust-reason">Reason</Label>
              <Textarea
                id="trust-reason"
                value={trustReason}
                onChange={(e) => setTrustReason(e.target.value)}
                placeholder="e.g. Late return without communication."
                rows={3}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrustTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={trustSubmitting || !trustAmount || !trustReason.trim()}
              onClick={async () => {
                if (!trustTarget) return;
                setTrustSubmitting(true);
                try {
                  await actions.adjustTrust(
                    trustTarget.id,
                    Number(trustAmount),
                    trustReason.trim(),
                  );
                  toast.success(
                    `${Number(trustAmount) > 0 ? "+" : ""}${trustAmount} trust for ${trustTarget.name}`,
                  );
                  setTrustTarget(null);
                  setTrustAmount("");
                  setTrustReason("");
                } catch (e: any) {
                  toast.error(e?.message ?? "Could not adjust trust.");
                } finally {
                  setTrustSubmitting(false);
                }
              }}
            >
              {trustSubmitting ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ----------------------------------------------------------- skeleton */

function UsersSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Card className="mb-4">
        <CardContent className="flex gap-3 p-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-44" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="m-2 h-14 w-[calc(100%-1rem)]" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
