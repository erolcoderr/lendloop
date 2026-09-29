import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { serializeUser } from "@/lib/serialize";

/**
 * POST /api/auth/register — create a new member account.
 *
 * Requires THREE photos for verification:
 *  - avatar:     Profile picture (shown on the user's profile/dashboard)
 *  - faceImage:  A clear selfie (for identity verification)
 *  - idImage:    A photo of any government or school ID
 *
 * The account is created with verificationStatus = "pending" — the user
 * CANNOT log in until an admin approves them. No session cookie is set.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, barangay, city, avatar, faceImage, idImage } =
      await req.json().catch(() => ({}));

    // Validate required text fields.
    if (!name || !email || !password || !barangay || !city) {
      return NextResponse.json(
        { error: "All profile fields are required." },
        { status: 400 },
      );
    }
    // Validate all three photos are present.
    if (!avatar || !faceImage || !idImage) {
      return NextResponse.json(
        { error: "Profile picture, face photo, and ID photo are all required for verification." },
        { status: 400 },
      );
    }

    // Validate image sizes (base64 — keep under ~5MB each).
    const MAX_IMG = 5 * 1024 * 1024;
    if (
      avatar.length > MAX_IMG ||
      faceImage.length > MAX_IMG ||
      idImage.length > MAX_IMG
    ) {
      return NextResponse.json(
        { error: "Each image must be under 5MB. Try smaller photos." },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashPassword(String(password)),
        avatar: String(avatar),
        barangay: String(barangay).trim(),
        city: String(city).trim(),
        role: "user",
        status: "active",
        verified: false,
        // Verification: store all three photos, mark as pending review.
        verificationStatus: "pending",
        faceImage: String(faceImage),
        idImage: String(idImage),
        verificationSubmittedAt: new Date(),
      },
    });

    // Notify all admins that a new verification is waiting.
    const admins = await db.user.findMany({ where: { role: "admin" } });
    await Promise.all(
      admins.map((a) =>
        db.notification.create({
          data: {
            userId: a.id,
            type: "system",
            title: "New verification request",
            message: `${user.name} submitted a profile picture, face photo, and ID for review.`,
            link: { view: "admin-verify" },
          },
        }),
      ),
    );

    // IMPORTANT: do NOT set a session cookie. The user must wait for admin
    // approval before they can log in. Return a "pending" status instead.
    return NextResponse.json({
      pending: true,
      message:
        "Account created! An admin will review your photos shortly. You can log in once approved.",
    });
  } catch (e: any) {
    console.error("Register error:", e);
    const message = e?.message || String(e);
    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 },
    );
  }
}
