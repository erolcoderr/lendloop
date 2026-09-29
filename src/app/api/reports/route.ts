import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/reports — admin only. Returns all reports, optionally filtered.
 * Query params: status, type
 */
export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (type && type !== "all") where.type = type;
  const reports = await db.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      reviewedAt: r.reviewedAt instanceof Date ? r.reviewedAt.toISOString() : null,
    })),
  });
}

/** POST /api/reports — any logged-in user can file a report. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { type, subject, description, targetItemId, targetUserId } = body;
  if (!type || !subject || !description) {
    return NextResponse.json({ error: "Type, subject, and description are required." }, { status: 400 });
  }
  const report = await db.report.create({
    data: {
      reporterId: user.id,
      type: String(type),
      subject: String(subject).trim(),
      description: String(description).trim(),
      targetItemId: targetItemId || null,
      targetUserId: targetUserId || null,
      status: "open",
    },
  });
  // Notify all admins.
  const admins = await db.user.findMany({ where: { role: "admin" } });
  await Promise.all(
    admins.map((a) =>
      db.notification.create({
        data: {
          userId: a.id,
          type: "system",
          title: "New report filed",
          message: `${user.name} reported: ${String(subject).trim().slice(0, 60)}`,
          link: { view: "admin-flagged" },
        },
      }),
    ),
  );
  return NextResponse.json({ report: { ...report, createdAt: report.createdAt.toISOString(), reviewedAt: null } }, { status: 201 });
}
