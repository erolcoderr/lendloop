import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";
import type { UserStatus } from "@/lib/types";

/**
 * PATCH /api/users/[id] — update a user.
 * Admins can suspend/reactivate (status). Users can edit their own profile.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));

  // Admin suspend/activate.
  if (body.status !== undefined) {
    if (current.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }
    if (target.role === "admin") {
      return NextResponse.json({ error: "Cannot suspend an admin." }, { status: 400 });
    }
    const updated = await db.user.update({
      where: { id },
      data: { status: body.status as UserStatus },
    });
    return NextResponse.json({ user: serializeUser(updated) });
  }

  // Self-edit profile.
  if (current.id !== id) {
    return NextResponse.json({ error: "You can only edit your own profile." }, { status: 403 });
  }
  const patch: any = {};
  if (body.name !== undefined) patch.name = String(body.name);
  if (body.avatar !== undefined) patch.avatar = String(body.avatar);
  if (body.bio !== undefined) patch.bio = String(body.bio);
  if (body.phone !== undefined) patch.phone = String(body.phone);
  if (body.barangay !== undefined) patch.barangay = String(body.barangay);
  if (body.city !== undefined) patch.city = String(body.city);
  const updated = await db.user.update({ where: { id }, data: patch });
  return NextResponse.json({ user: serializeUser(updated) });
}
