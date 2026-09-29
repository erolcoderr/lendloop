import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/verification — admin only.
 *
 * Returns the queue of users awaiting verification
 * (verificationStatus === "pending"). Includes the user's avatar, faceImage,
 * and idImage so the admin can review them.
 */
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const pending = await db.user.findMany({
    where: { verificationStatus: "pending" },
    orderBy: { verificationSubmittedAt: "asc" },
  });

  const queue = pending.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    barangay: u.barangay,
    city: u.city,
    avatar: u.avatar,
    joinedAt: u.joinedAt instanceof Date ? u.joinedAt.toISOString() : String(u.joinedAt),
    verificationSubmittedAt:
      u.verificationSubmittedAt instanceof Date
        ? u.verificationSubmittedAt.toISOString()
        : u.verificationSubmittedAt
          ? String(u.verificationSubmittedAt)
          : null,
    // Sensitive: face + ID photos. Only returned on this admin-only endpoint.
    faceImage: u.faceImage ?? null,
    idImage: u.idImage ?? null,
  }));

  return NextResponse.json({ queue });
}
