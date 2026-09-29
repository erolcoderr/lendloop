import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeRequest } from "@/lib/serialize";
import { dateRangeToDays } from "@/lib/helpers";
import type { ItemStatus, RequestStatus } from "@/lib/types";

/**
 * PATCH /api/requests/[id] — advance the request state machine.
 * Body: { status: "approved" | "rejected" | "borrowed" | "returned" }
 *
 * Side effects per transition:
 *  - approved  → item status = reserved, notify borrower
 *  - rejected  → notify borrower
 *  - borrowed  → item status = borrowed, add booked dates, notify borrower
 *  - returned  → item status = available, remove booked dates, notify borrower
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const request = await db.borrowRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  // Only the owner can advance pending→approved/borrowed/returned; borrower can cancel.
  const isOwner = request.ownerId === user.id;
  const isBorrower = request.borrowerId === user.id;
  if (!isOwner && !isBorrower) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatus = body.status as RequestStatus | undefined;
  if (!nextStatus) {
    return NextResponse.json({ error: "status is required." }, { status: 400 });
  }

  const patch: any = {};
  const itemUpdates: { itemId: string; data: any } | null = { itemId: request.itemId, data: {} };
  const notifications: { userId: string; type: any; title: string; message: string; link?: any }[] = [];

  const item = await db.item.findUnique({ where: { id: request.itemId } });
  const borrower = await db.user.findUnique({ where: { id: request.borrowerId } });
  const owner = await db.user.findUnique({ where: { id: request.ownerId } });

  switch (nextStatus) {
    case "approved":
      if (!isOwner) return NextResponse.json({ error: "Only the owner can approve." }, { status: 403 });
      patch.status = "approved";
      itemUpdates!.data.status = "reserved" as ItemStatus;
      if (borrower) notifications.push({
        userId: borrower.id,
        type: "request_approved",
        title: "Your borrow request was approved",
        message: `${owner?.name ?? "The owner"} approved your request.`,
        link: { view: "dashboard" },
      });
      break;
    case "rejected":
      if (!isOwner) return NextResponse.json({ error: "Only the owner can reject." }, { status: 403 });
      patch.status = "rejected";
      if (borrower) notifications.push({
        userId: borrower.id,
        type: "request_rejected",
        title: "Your borrow request was declined",
        message: `${owner?.name ?? "The owner"} declined your request.`,
        link: { view: "dashboard" },
      });
      break;
    case "borrowed":
      if (!isOwner) return NextResponse.json({ error: "Only the owner can mark as borrowed." }, { status: 403 });
      patch.status = "borrowed";
      patch.borrowedAt = new Date();
      itemUpdates!.data.status = "borrowed" as ItemStatus;
      // Add the borrow window to the item's booked dates.
      if (item) {
        const days = dateRangeToDays(
          request.startDate instanceof Date ? request.startDate.toISOString().slice(0, 10) : String(request.startDate),
          request.endDate instanceof Date ? request.endDate.toISOString().slice(0, 10) : String(request.endDate),
        );
        const existing = Array.isArray(item.bookedDates) ? item.bookedDates : [];
        itemUpdates!.data.bookedDates = [...new Set([...existing, ...days])];
      }
      break;
    case "returned":
      if (!isOwner) return NextResponse.json({ error: "Only the owner can mark as returned." }, { status: 403 });
      patch.status = "returned";
      patch.returnedAt = new Date();
      itemUpdates!.data.status = "available" as ItemStatus;
      // Remove the borrow window from booked dates.
      if (item) {
        const days = dateRangeToDays(
          request.startDate instanceof Date ? request.startDate.toISOString().slice(0, 10) : String(request.startDate),
          request.endDate instanceof Date ? request.endDate.toISOString().slice(0, 10) : String(request.endDate),
        );
        const existing = Array.isArray(item.bookedDates) ? item.bookedDates : [];
        itemUpdates!.data.bookedDates = existing.filter((d: string) => !days.includes(d));
      }
      break;
    case "cancelled":
      if (!isBorrower) return NextResponse.json({ error: "Only the borrower can cancel." }, { status: 403 });
      patch.status = "cancelled";
      break;
    default:
      return NextResponse.json({ error: "Invalid status transition." }, { status: 400 });
  }

  const updated = await db.borrowRequest.update({ where: { id }, data: patch });

  // Apply item updates if any.
  if (itemUpdates && Object.keys(itemUpdates.data).length > 0) {
    await db.item.update({ where: { id: itemUpdates.itemId }, data: itemUpdates.data });
  }
  // Fire notifications.
  for (const n of notifications) {
    await db.notification.create({ data: { ...n } });
  }

  return NextResponse.json({ request: serializeRequest(updated) });
}
