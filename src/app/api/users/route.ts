import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/**
 * GET /api/users — list all members (admin only).
 * Query: q (search), status (active|suspended|admin)
 */
export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }
  if (status === "active") where.status = "active";
  if (status === "suspended") where.status = "suspended";
  if (status === "admin") where.role = "admin";
  const users = await db.user.findMany({ where, orderBy: { joinedAt: "desc" } });
  return NextResponse.json({ users: users.map(serializeUser) });
}
