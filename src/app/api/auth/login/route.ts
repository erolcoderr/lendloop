import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/** POST /api/auth/login — log in with email + password, sets session cookie. */
export async function POST(req: NextRequest) {
  const { email, password, remember } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const user = await db.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  }
  if (!verifyPassword(String(password), user.password)) {
    return NextResponse.json({ error: "Incorrect password. Try again." }, { status: 401 });
  }
  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "This account is suspended. Contact your barangay admin." },
      { status: 403 },
    );
  }
  // Verification gate: members with pending/rejected verification can't log in.
  // Admins bypass this (they're trusted barangay stewards).
  if (user.role !== "admin") {
    if (user.verificationStatus === "pending") {
      return NextResponse.json(
        {
          error:
            "Your account is awaiting verification. An admin will review your face photo and ID shortly. Please try again later.",
        },
        { status: 403 },
      );
    }
    if (user.verificationStatus === "rejected") {
      return NextResponse.json(
        {
          error:
            "Your verification was rejected. Please contact your barangay admin or register again with clearer photos.",
        },
        { status: 403 },
      );
    }
    if (user.verificationStatus === "unverified") {
      return NextResponse.json(
        {
          error:
            "Your account hasn't submitted verification yet. Please register again with a face photo and ID.",
        },
        { status: 403 },
      );
    }
  }
  await setSession(user.id, Boolean(remember));
  return NextResponse.json({ user: serializeUser(user) });
}
