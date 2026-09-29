import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeReview } from "@/lib/serialize";

/**
 * GET /api/reviews — list reviews.
 * Query: itemId | toUserId | fromUserId
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const toUserId = searchParams.get("toUserId");
  const fromUserId = searchParams.get("fromUserId");
  const where: any = {};
  if (itemId) where.itemId = itemId;
  if (toUserId) where.toUserId = toUserId;
  if (fromUserId) where.fromUserId = fromUserId;
  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews: reviews.map(serializeReview) });
}

/** POST /api/reviews — submit a review (authenticated). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { toUserId, itemId, requestId, rating, comment } = body;
  if (!toUserId || !itemId || !rating || !comment) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (Number(rating) < 1 || Number(rating) > 5) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }
  if (toUserId === user.id) {
    return NextResponse.json({ error: "You can't review yourself." }, { status: 400 });
  }
  const review = await db.review.create({
    data: {
      fromUserId: user.id,
      toUserId: String(toUserId),
      itemId: String(itemId),
      requestId: requestId ? String(requestId) : null,
      rating: Number(rating),
      comment: String(comment),
    },
  });
  // Notify the reviewed party.
  await db.notification.create({
    data: {
      userId: String(toUserId),
      type: "review_received",
      title: `${user.name} left you a ${rating}-star review`,
      message: String(comment).slice(0, 120),
      link: { view: "profile" },
    },
  });
  return NextResponse.json({ review: serializeReview(review) }, { status: 201 });
}
