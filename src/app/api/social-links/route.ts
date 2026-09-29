import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeSocialLink } from "@/lib/serialize";
import type { SocialPlatform } from "@/lib/types";

/**
 * GET /api/social-links — list the current user's social links.
 * Returns { links: SocialLink[] } ordered oldest-first.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const links = await db.socialLink.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ links: links.map(serializeSocialLink) });
}

/**
 * POST /api/social-links — add a new social link for the current user.
 * Body: { platform, url }
 * New links start with status="pending", bonus=5. Notifies every admin so
 * they know there's something in the review queue.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform ?? "") as SocialPlatform;
  const url = String(body.url ?? "").trim();

  const VALID_PLATFORMS: SocialPlatform[] = [
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "tiktok",
    "github",
    "youtube",
    "website",
  ];
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Pick a supported platform." }, { status: 400 });
  }
  if (!url || url.length < 3) {
    return NextResponse.json({ error: "Add a valid profile URL." }, { status: 400 });
  }
  // Basic URL-ish check (allow URLs without scheme, e.g. "facebook.com/me").
  if (!/\./.test(url)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid URL." },
      { status: 400 },
    );
  }

  // Reject duplicates (same platform + url) so the queue doesn't fill up.
  const existing = await db.socialLink.findFirst({
    where: { userId: user.id, platform, url },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already added that link." },
      { status: 409 },
    );
  }

  const link = await db.socialLink.create({
    data: {
      userId: user.id,
      platform,
      url,
      status: "pending",
      bonus: 1,
    },
  });

  // Notify every admin so the approval queue isn't silently ignored.
  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  if (admins.length > 0) {
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "system",
        title: "New social link to review",
        message: `${user.name} added a ${platform} link for trust verification.`,
        link: { view: "admin-social" },
      })),
    });
  }

  return NextResponse.json({ link: serializeSocialLink(link) }, { status: 201 });
}
