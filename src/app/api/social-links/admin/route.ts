import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeSocialLink } from "@/lib/serialize";

/**
 * GET /api/social-links/admin — admin only.
 * Returns ALL pending social links across all users, joined with the
 * owning user's name + email so the admin queue can render in one round trip.
 *
 * Returns: { links: (SocialLink & { userName, userEmail })[] }
 */
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const rows = await db.socialLink.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const links = rows.map((r) => ({
    ...serializeSocialLink(r),
    userName: r.user?.name ?? "Unknown",
    userEmail: r.user?.email ?? "",
  }));

  return NextResponse.json({ links });
}
