import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/**
 * GET /api/trust?userId=X — list trust adjustments for a user.
 * Admin only (to review adjustment history).
 */
export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const adjustments = await db.trustAdjustment.findMany({
    where: { userId: String(userId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    adjustments: adjustments.map((a) => ({
      ...a,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    })),
  });
}

/**
 * POST /api/trust — admin adjusts a user's trust score.
 * Body: { userId, amount (int, can be negative), reason (string) }
 */
export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { userId, amount, reason } = body;
  if (!userId || amount === undefined || !reason) {
    return NextResponse.json({ error: "userId, amount, and reason are required." }, { status: 400 });
  }
  const amt = Math.round(Number(amount));
  if (!Number.isFinite(amt) || amt === 0 || Math.abs(amt) > 50) {
    return NextResponse.json({ error: "Amount must be a non-zero integer between -50 and +50." }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { id: String(userId) } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Cannot adjust an admin's trust score." }, { status: 400 });
  }

  const adjustment = await db.trustAdjustment.create({
    data: {
      userId: target.id,
      adminId: admin.id,
      amount: amt,
      reason: String(reason).trim(),
    },
  });

  // Notify the user.
  await db.notification.create({
    data: {
      userId: target.id,
      type: "system",
      title: amt > 0 ? `Trust score +${amt}` : `Trust score ${amt}`,
      message: `Admin ${admin.name}: ${String(reason).trim()}`,
      link: { view: "profile" },
    },
  });

  return NextResponse.json({
    adjustment: {
      ...adjustment,
      createdAt: adjustment.createdAt instanceof Date ? adjustment.createdAt.toISOString() : String(adjustment.createdAt),
    },
  }, { status: 201 });
}
