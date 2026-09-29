import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeMessage } from "@/lib/serialize";

/**
 * GET /api/messages?requestId=X — list messages in a borrow request thread.
 * Only the borrower or the owner of the request can read.
 * Marks the other party's messages as read (read-receipt side effect).
 *
 * POST /api/messages — send a message. Body: { requestId, content }.
 * Only the borrower or owner of the request can send. Returns { message }.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json(
      { error: "requestId query param is required." },
      { status: 400 },
    );
  }

  const request = await db.borrowRequest.findUnique({
    where: { id: requestId },
    select: { borrowerId: true, ownerId: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (request.borrowerId !== user.id && request.ownerId !== user.id) {
    return NextResponse.json(
      { error: "You can only view messages on your own requests." },
      { status: 403 },
    );
  }

  const messages = await db.message.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });

  // Mark messages from the OTHER party as read so the unread badge stays
  // accurate for the polling chat view.
  await db.message
    .updateMany({
      where: {
        requestId,
        senderId: { not: user.id },
        read: false,
      },
      data: { read: true },
    })
    .catch(() => {
      // Non-fatal — the listing still works even if the read-receipt update
      // fails for some reason.
    });

  return NextResponse.json({ messages: messages.map(serializeMessage) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const requestId = String(body.requestId ?? "");
  const content = String(body.content ?? "").trim();
  if (!requestId) {
    return NextResponse.json(
      { error: "requestId is required." },
      { status: 400 },
    );
  }
  if (!content) {
    return NextResponse.json(
      { error: "Message can't be empty." },
      { status: 400 },
    );
  }
  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Message is too long (max 2000 chars)." },
      { status: 400 },
    );
  }

  const request = await db.borrowRequest.findUnique({
    where: { id: requestId },
    select: { borrowerId: true, ownerId: true, itemId: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (request.borrowerId !== user.id && request.ownerId !== user.id) {
    return NextResponse.json(
      { error: "You can only message on your own requests." },
      { status: 403 },
    );
  }

  const message = await db.message.create({
    data: {
      requestId,
      senderId: user.id,
      content,
    },
  });

  return NextResponse.json({ message: serializeMessage(message) }, { status: 201 });
}
