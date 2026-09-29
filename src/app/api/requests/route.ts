import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeRequest } from "@/lib/serialize";
import { dateRangeToDays } from "@/lib/helpers";
import type { RequestStatus } from "@/lib/types";

/**
 * GET /api/requests — list requests involving the current user.
 * Query: scope=mine (borrower) | owned | all (defaults to both).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "all";
  const where: any =
    scope === "mine"
      ? { borrowerId: user.id }
      : scope === "owned"
        ? { ownerId: user.id }
        : { OR: [{ borrowerId: user.id }, { ownerId: user.id }] };
  const requests = await db.borrowRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests: requests.map(serializeRequest) });
}

/** POST /api/requests — create a new borrow request (authenticated borrower). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { itemId, startDate, endDate, message, agreementSigned, signatureName, agreementText, wantsCopy } = body;
  if (!itemId || !startDate || !endDate || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  const item = await db.item.findUnique({ where: { id: String(itemId) } });
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  if (item.ownerId === user.id) {
    return NextResponse.json({ error: "You can't borrow your own item." }, { status: 400 });
  }
  // Check for date conflicts against already-booked dates.
  const requestedDays = dateRangeToDays(String(startDate), String(endDate));
  const conflicts = requestedDays.filter((d) => item.bookedDates.includes(d));
  if (conflicts.length > 0) {
    return NextResponse.json(
      { error: "Some of your selected dates are already booked." },
      { status: 409 },
    );
  }

  const request = await db.borrowRequest.create({
    data: {
      itemId: item.id,
      borrowerId: user.id,
      ownerId: item.ownerId,
      startDate: new Date(String(startDate)),
      endDate: new Date(String(endDate)),
      message: String(message),
      status: "pending" as RequestStatus,
      agreementSigned: Boolean(agreementSigned),
      signatureName: String(signatureName ?? ""),
      agreementText: agreementText ? String(agreementText) : null,
      wantsCopy: Boolean(wantsCopy),
    },
  });

  // Notify the owner.
  await db.notification.create({
    data: {
      userId: item.ownerId,
      type: "request_received",
      title: "New borrow request",
      message: `${user.name} requested to borrow your "${item.title}".`,
      link: { view: "dashboard" },
    },
  });

  return NextResponse.json({ request: serializeRequest(request) }, { status: 201 });
}
