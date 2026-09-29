import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeNotification } from "@/lib/serialize";

/** PATCH /api/notifications/[id] — mark a single notification as read. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const updated = await db.notification.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ notification: serializeNotification(updated) });
}
