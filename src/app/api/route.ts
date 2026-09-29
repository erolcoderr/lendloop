import { NextResponse } from "next/server";

/** Health check for the API. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "LendLoop API" });
}
