import { NextResponse } from "next/server";
import { outboundLog } from "@/lib/outbound";

// Must run per request (see /api/health): the log grows as decisions land.
export const dynamic = "force-dynamic";

// GET /api/outbound — demo-only read model (not part of the ported source).
// Surfaces the in-memory entries the handlers appended, newest first, so the
// Outbound log tab can render them. Nothing here leaves the machine.
export async function GET() {
  return NextResponse.json({
    entries: [...outboundLog].reverse(),
    count: outboundLog.length,
  });
}
