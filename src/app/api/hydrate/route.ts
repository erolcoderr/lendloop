import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  serializeUser,
  serializeItem,
  serializeRequest,
  serializeReview,
  serializeNotification,
} from "@/lib/serialize";

/**
 * GET /api/hydrate — returns all data the SPA needs in a single round trip:
 * the current user (if any), plus all users/items/requests/reviews/notifications.
 * The Zustand store hydrates from this on app mount.
 *
 * Wrapped in try/catch so the client gets a helpful error message instead of
 * a generic 500 when MySQL is unreachable.
 */
export async function GET() {
  try {
    const me = await getCurrentUser();
    const [users, items, requests, reviews, notifications, trustAdjustments] = await Promise.all([
      db.user.findMany({ orderBy: { joinedAt: "asc" } }),
      db.item.findMany({ orderBy: { createdAt: "desc" } }),
      db.borrowRequest.findMany({ orderBy: { createdAt: "desc" } }),
      db.review.findMany({ orderBy: { createdAt: "desc" } }),
      me ? db.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }) : [],
      db.trustAdjustment.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // Build a map of userId → total adjustment amount.
    const trustMap: Record<string, number> = {};
    for (const ta of trustAdjustments) {
      trustMap[ta.userId] = (trustMap[ta.userId] ?? 0) + ta.amount;
    }

    return NextResponse.json({
      me: me ? serializeUser(me) : null,
      users: users.map(serializeUser),
      items: items.map(serializeItem),
      requests: requests.map(serializeRequest),
      reviews: reviews.map(serializeReview),
      notifications: notifications.map(serializeNotification),
      trustMap,
    });
  } catch (e: any) {
    // Surface the actual database error so the client (AppHydrator) can show
    // exactly what went wrong — e.g. P1001 "Can't reach database server".
    const message = e?.message || String(e);
    const code = e?.code || "UNKNOWN";
    return NextResponse.json(
      { error: `Database error [${code}]: ${message}` },
      { status: 500 },
    );
  }
}
