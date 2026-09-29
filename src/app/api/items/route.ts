import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeItem } from "@/lib/serialize";
import type { ItemCategory, ItemCondition, ItemStatus } from "@/lib/types";

/**
 * GET /api/items — list items, optionally filtered.
 * Query params: category, condition, q (search), sort (newest|popular|deposit)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "newest";

  const where: any = {};
  if (category && category !== "All") where.category = category;
  if (condition && condition !== "All") where.condition = condition;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const orderBy: any =
    sort === "popular"
      ? { views: "desc" }
      : sort === "deposit"
        ? { deposit: "asc" }
        : { createdAt: "desc" };

  const items = await db.item.findMany({ where, orderBy });
  return NextResponse.json({ items: items.map(serializeItem) });
}

/** POST /api/items — create a new item (authenticated). */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const { title, description, category, condition, images, primaryImageIndex, maxBorrowDays, deposit, location } = body;
    if (!title || !description || !category || !condition || !location) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    // Normalize "Like New" → "LikeNew" (the Prisma enum value has no space).
    // Same fix as in prisma/seed.ts.
    const normalizedCondition = String(condition).replace(/\s+/g, "") as any;
    const item = await db.item.create({
      data: {
        title: String(title),
        description: String(description),
        category: category as any,
        condition: normalizedCondition,
        images: Array.isArray(images) ? images : [],
        primaryImageIndex: Number(primaryImageIndex) || 0,
        maxBorrowDays: Number(maxBorrowDays) || 3,
        deposit: Number(deposit) || 0,
        bookedDates: [],
        status: "available" as any,
        location: String(location),
        ownerId: user.id,
      },
    });
    return NextResponse.json({ item: serializeItem(item) }, { status: 201 });
  } catch (e: any) {
    console.error("Create item error:", e);
    const message = e?.message || String(e);
    return NextResponse.json(
      { error: `Could not create item: ${message}` },
      { status: 500 },
    );
  }
}
