import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/** GET /api/auth/me — return the currently logged-in user, or null. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: serializeUser(user) });
}
