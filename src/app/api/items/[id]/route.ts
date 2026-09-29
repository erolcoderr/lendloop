import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeItem } from "@/lib/serialize";
import type { ItemCategory, ItemCondition, ItemStatus } from "@/lib/types";

/** GET /api/items/[id] — single item. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await db.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  // Increment views (fire-and-forget, non-blocking).
  db.item.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ item: serializeItem(item) });
}

/** PATCH /api/items/[id] — update an item (owner only). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const item = await db.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  if (item.ownerId !== user.id) {
    return NextResponse.json({ error: "You can only edit your own items." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.category !== undefined) patch.category = body.category as ItemCategory;
  if (body.condition !== undefined) patch.condition = String(body.condition).replace(/\s+/g, "") as any;
  if (body.images !== undefined) patch.images = body.images;
  if (body.primaryImageIndex !== undefined) patch.primaryImageIndex = Number(body.primaryImageIndex);
  if (body.maxBorrowDays !== undefined) patch.maxBorrowDays = Number(body.maxBorrowDays);
  if (body.deposit !== undefined) patch.deposit = Number(body.deposit);
  if (body.location !== undefined) patch.location = String(body.location);
  if (body.status !== undefined) patch.status = body.status as ItemStatus;
  if (body.bookedDates !== undefined) patch.bookedDates = body.bookedDates;

  const updated = await db.item.update({ where: { id }, data: patch });
  return NextResponse.json({ item: serializeItem(updated) });
}

/** DELETE /api/items/[id] — delete an item (owner only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const item = await db.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  if (item.ownerId !== user.id) {
    return NextResponse.json({ error: "You can only delete your own items." }, { status: 403 });
  }
  await db.item.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
