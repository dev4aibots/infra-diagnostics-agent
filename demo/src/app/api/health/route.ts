import { NextResponse } from "next/server";
import { handleHealth } from "@/logic/handlers";
import { outboundLog } from "@/lib/outbound";

// This route must run on every request: the outbound log grows as decisions
// are recorded. Without this, Next.js statically caches GET handlers at
// build time and the count would freeze at its build-time value.
export const dynamic = "force-dynamic";

// GET /api/health -> the exact shape of the source's GET /health:
// 200 { ok: true, outboundCount: outboundLog.length }
export async function GET() {
  const result = handleHealth(outboundLog);
  return NextResponse.json(result.body, { status: result.status });
}
