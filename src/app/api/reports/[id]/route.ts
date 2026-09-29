import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * PATCH /api/reports/[id] — admin updates a report's status + note.
 * Body: { status: "reviewing" | "resolved" | "dismissed", adminNote?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const report = await db.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const status = body.status as "reviewing" | "resolved" | "dismissed" | undefined;
  if (!status) {
    return NextResponse.json({ error: "status is required." }, { status: 400 });
  }
  const updated = await db.report.update({
    where: { id },
    data: {
      status,
      adminNote: body.adminNote !== undefined ? String(body.adminNote) : report.adminNote,
      reviewedAt: new Date(),
    },
  });
  // Notify the reporter.
  await db.notification.create({
    data: {
      userId: report.reporterId,
      type: "system",
      title: `Your report was ${status}`,
      message: `Report "${report.subject}" was marked as ${status}.`,
      link: { view: "dashboard" },
    },
  });
  return NextResponse.json({
    report: {
      ...updated,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
      reviewedAt: updated.reviewedAt instanceof Date ? updated.reviewedAt.toISOString() : null,
    },
  });
}
