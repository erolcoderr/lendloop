"use client";

import { MapPin, CalendarDays, PhilippinePeso, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item, User, Review } from "@/lib/types";
import { formatPeso, avgRating, ITEM_STATUS_META } from "@/lib/helpers";
import { useRouter } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "./SmartImage";
import { CategoryIcon } from "./CategoryArt";
import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";

/**
 * ItemCard — the atomic unit of every list/grid across LendLoop. Reused on the
 * landing featured strip, browse grid, dashboard "my items", and admin tables.
 * Clicking the card navigates to the item detail view (Context Engineering).
 */
export function ItemCard({
  item,
  owner,
  reviews = [],
  className,
  compact = false,
}: {
  item: Item;
  owner?: User;
  reviews?: Review[];
  className?: string;
  compact?: boolean;
}) {
  const navigate = useRouter((s) => s.navigate);
  const rating = avgRating(reviews.map((r) => r.rating));
  const status = ITEM_STATUS_META[item.status];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate("view-item", { itemId: item.id })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate("view-item", { itemId: item.id });
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={item.images[item.primaryImageIndex]}
          alt={item.title}
          category={item.category}
          seed={item.title.length}
          className="h-full w-full"
          imgClassName="group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="gap-1 border-0 bg-card/90 text-foreground shadow-sm backdrop-blur">
            <CategoryIcon category={item.category} className="h-3.5 w-3.5" />
            {item.category}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <StatusBadge status={item.status} className="bg-card/90 backdrop-blur" />
        </div>
        {rating > 0 && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold shadow-sm backdrop-blur">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* body */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-[var(--font-display)] text-base font-semibold text-foreground group-hover:text-primary">
            {item.title}
          </h3>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Up to {item.maxBorrowDays} days
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <PhilippinePeso className="h-3.5 w-3.5 text-primary" />
            {formatPeso(item.deposit)} deposit
          </span>
        </div>

        {owner && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("view-profile", { userId: owner.id });
              }}
              className="flex min-w-0 items-center gap-2 text-left hover:opacity-80"
            >
              <Avatar user={owner} size={28} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground hover:text-primary">
                  {owner.name}
                </p>
                <p className="inline-flex items-center gap-0.5 truncate text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {owner.barangay}
                </p>
              </div>
            </button>
            <TrustBadgeCompact owner={owner} />
          </div>
        )}
      </div>
    </Card>
  );
}

// Local compact trust pill keeps the card layout tight.
function TrustBadgeCompact({ owner }: { owner: User }) {
  // TrustBadge needs a score; compute lazily via a tiny inline read is avoided
  // here to keep ItemCard self-contained. We show the verified check instead.
  return owner.verified ? (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    >
      Verified
    </Badge>
  ) : null;
}
