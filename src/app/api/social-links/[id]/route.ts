import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeSocialLink } from "@/lib/serialize";

/**
 * PATCH /api/social-links/[id] — admin approves or rejects a pending link.
 * Body: { action: "approve" | "reject", bonus?: number }
 *
 * approve: status="approved", bonus = bonus ?? 1 (cap 3, min 1), reviewedAt=now.
 *          Notifies the link owner with the bonus granted.
 * reject:  status="rejected", reviewedAt=now. Notifies the link owner.
 *
 * DELETE /api/social-links/[id] — the link owner can delete their own link.
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

  const link = await db.socialLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | undefined;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'." },
      { status: 400 },
    );
  }

  const now = new Date();

  if (action === "approve") {
    const requested = Number(body.bonus);
    const bonus =
      Number.isFinite(requested) && requested > 0
        ? Math.min(3, Math.max(1, Math.round(requested)))
        : 1;
    const updated = await db.socialLink.update({
      where: { id },
      data: { status: "approved", bonus, reviewedAt: now },
    });
    const owner = await db.user.findUnique({
      where: { id: link.userId },
      select: { name: true },
    });
    await db.notification.create({
      data: {
        userId: link.userId,
        type: "verification_approved",
        title: "Social link approved",
        message: `Your ${link.platform} link was approved and added +${bonus} to your trust score.`,
        link: { view: "profile" },
      },
    });
    void owner;
    return NextResponse.json({ link: serializeSocialLink(updated) });
  }

  // action === "reject"
  const updated = await db.socialLink.update({
    where: { id },
    data: { status: "rejected", reviewedAt: now },
  });
  await db.notification.create({
    data: {
      userId: link.userId,
      type: "verification_rejected",
      title: "Social link rejected",
      message: `Your ${link.platform} link couldn't be verified. You can try adding it again.`,
      link: { view: "profile" },
    },
  });
  return NextResponse.json({ link: serializeSocialLink(updated) });
}

/** DELETE /api/social-links/[id] — the link owner can delete their own link. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const link = await db.socialLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }
  if (link.userId !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own links." },
      { status: 403 },
    );
  }
  await db.socialLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
