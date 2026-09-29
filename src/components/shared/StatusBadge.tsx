"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ITEM_STATUS_META,
  REQUEST_STATUS_META,
  RESERVATION_STATUS_META,
} from "@/lib/helpers";
import type { ItemStatus, RequestStatus, ReservationStatus } from "@/lib/types";

type AnyStatus = ItemStatus | RequestStatus | ReservationStatus;

function isItem(s: AnyStatus): s is ItemStatus {
  return s in ITEM_STATUS_META;
}
function isRequest(s: AnyStatus): s is RequestStatus {
  return s in REQUEST_STATUS_META;
}

/**
 * StatusBadge — single rendering point for every status chip in the app so the
 * UI state machines (brief) stay visually consistent (Context Engineering).
 */
export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  let meta: { label: string; classes: string; dot: string };
  if (isItem(status)) meta = ITEM_STATUS_META[status];
  else if (isRequest(status)) meta = REQUEST_STATUS_META[status];
  else meta = RESERVATION_STATUS_META[status];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium", meta.classes, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}
