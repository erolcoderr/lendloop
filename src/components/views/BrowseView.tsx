"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PackageOpen, Search, X } from "lucide-react";
import { useData } from "@/lib/store";
import type { Item, ItemCondition, ItemCategory, Review, User } from "@/lib/types";
import { ALL_CATEGORIES, CategoryIcon } from "@/components/shared/CategoryArt";
import { EmptyState, SectionHeading } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/shared/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------- constants */

const CONDITIONS: (ItemCondition | "All")[] = ["All", "Like New", "Good", "Fair"];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "deposit-asc", label: "Deposit: low to high" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

const PER_PAGE = 8;
const STAGGER_CAP = 0.35;

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

type CategoryFilter = "All" | ItemCategory;
type ConditionFilter = ItemCondition | "All";

/* ============================================================ BrowseView */

export default function BrowseView() {
  const items = useData((s) => s.items);
  const users = useData((s) => s.users);
  const reviews = useData((s) => s.reviews);

  // First-mount skeleton — async setState (setTimeout), compliant with lint rule.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Filter state lives in the parent.
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [condition, setCondition] = useState<ConditionFilter>("All");
  const [sort, setSort] = useState<SortValue>("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = items.filter((it) => {
      if (category !== "All" && it.category !== category) return false;
      if (condition !== "All" && it.condition !== condition) return false;
      if (q) {
        const hay = `${it.title} ${it.description} ${it.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...out];
    if (sort === "newest") {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sort === "popular") {
      sorted.sort((a, b) => b.views - a.views);
    } else if (sort === "deposit-asc") {
      sorted.sort((a, b) => a.deposit - b.deposit);
    }
    return sorted;
  }, [items, query, category, condition, sort]);

  // Stable hash of the active filters — used as a key on the results child so
  // the page state resets to 1 whenever any filter changes (keyed-remount
  // pattern, no synchronous setState-in-effect).
  const filterKey = `${query}~${category}~${condition}~${sort}`;

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setCondition("All");
    setSort("newest");
  };

  const hasActiveFilters =
    query.trim() !== "" || category !== "All" || condition !== "All" || sort !== "newest";

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-bayanihan-weave">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <SectionHeading
            eyebrow="The barangay loop"
            title="Browse what neighbors are sharing"
            description="Drills, tents, speakers, kaldero — find what you need, then send a request with your dates. No new purchases required."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ===================================================== FILTER BAR */}
        <div className="space-y-4">
          {/* Search + selects */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items, descriptions, or areas..."
                className="pl-9"
                aria-label="Search items"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={condition} onValueChange={(v) => setCondition(v as ConditionFilter)}>
                <SelectTrigger className="w-[150px]" aria-label="Filter by condition">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "All" ? "All conditions" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
                <SelectTrigger className="w-[180px]" aria-label="Sort items">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category pills */}
          <div
            className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1"
            role="group"
            aria-label="Filter by category"
          >
            <CategoryPill
              active={category === "All"}
              onClick={() => setCategory("All")}
              label="All"
            />
            {ALL_CATEGORIES.map((c) => (
              <CategoryPill
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
                label={c}
                icon={<CategoryIcon category={c} className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </div>

        {/* ===================================================== RESULTS COUNT */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? (
              "Loading items..."
            ) : (
              <>
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "item" : "items"} in the loop
                {hasActiveFilters && " matching your filters"}
              </>
            )}
          </p>
          {hasActiveFilters && !loading && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {/* ===================================================== GRID / EMPTY */}
        <div className="mt-5">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <BrowseResults
              key={filterKey}
              items={filtered}
              users={users}
              reviews={reviews}
              onClear={clearFilters}
            />
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------ CategoryPill */

function CategoryPill({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ------------------------------------------------------ SkeletonGrid */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------ BrowseResults */

function BrowseResults({
  items,
  users,
  reviews,
  onClear,
}: {
  items: Item[];
  users: User[];
  reviews: Review[];
  onClear: () => void;
}) {
  // The child owns page state. The parent keys us by the filter hash so any
  // filter change remounts us → page resets to 1 (no setState-in-effect).
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PER_PAGE;
  const endIdx = Math.min(startIdx + PER_PAGE, items.length);
  const pageItems = items.slice(startIdx, endIdx);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No items match your filters"
        description="Try widening your search, picking a different category, or clearing filters to see the whole barangay loop again."
        actionLabel="Clear filters"
        onAction={onClear}
        className="py-16"
      />
    );
  }

  const userById = (id: string) => users.find((u) => u.id === id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageItems.map((item, i) => (
          <motion.div
            key={item.id}
            {...fadeUp}
            transition={{ duration: 0.28, delay: Math.min(i * 0.05, STAGGER_CAP), ease: [0.22, 1, 0.36, 1] }}
          >
            <ItemCard
              item={item}
              owner={userById(item.ownerId)}
              reviews={reviews.filter((r) => r.itemId === item.id)}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="space-y-2">
          <p className="text-center text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startIdx + 1}–{endIdx}</span> of{" "}
            <span className="font-semibold text-foreground">{items.length}</span> items
          </p>
          <Pagination className="justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  aria-disabled={safePage === 1}
                  className={cn(safePage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === safePage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  aria-disabled={safePage === totalPages}
                  className={cn(safePage === totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
