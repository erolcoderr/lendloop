import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from "@/lib/email";

/**
 * PATCH /api/verification/[id] — admin approves or rejects a pending verification.
 *
 * On approve: updates status, sends in-app notification + EMAIL to the user.
 * On reject: updates status, sends in-app notification + EMAIL to the user.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { error: "User not found." },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | undefined;
  const note =
    typeof body.note === "string" && body.note.trim()
      ? body.note.trim()
      : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'." },
      { status: 400 },
    );
  }

  const now = new Date();

  if (action === "approve") {
    const updated = await db.user.update({
      where: { id },
      data: {
        verificationStatus: "approved",
        verified: true,
        verificationReviewedAt: now,
        verificationNote: note,
      },
    });
    // In-app notification
    await db.notification.create({
      data: {
        userId: id,
        type: "verification_approved",
        title: "Your verification was approved",
        message: "You can now log in and start lending.",
        link: { view: "login" },
      },
    });
    // Email notification
    await sendVerificationApprovedEmail(target.email, target.name);

    return NextResponse.json({ user: serializeUser(updated) });
  }

  // action === "reject"
  const updated = await db.user.update({
    where: { id },
    data: {
      verificationStatus: "rejected",
      verificationReviewedAt: now,
      verificationNote: note,
    },
  });
  // In-app notification
  await db.notification.create({
    data: {
      userId: id,
      type: "verification_rejected",
      title: "Your verification was rejected",
      message: note || "Please re-register with clearer photos.",
    },
  });
  // Email notification
  await sendVerificationRejectedEmail(target.email, target.name, note ?? undefined);

  return NextResponse.json({ user: serializeUser(updated) });
}
