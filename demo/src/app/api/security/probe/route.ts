import { NextResponse } from "next/server";
import { handleSlackCommand } from "@/logic/handlers";
import { signForTesting } from "@/logic/slack_verify";
import { DEMO_SIGNING_SECRET, outboundLog } from "@/lib/outbound";

const MODES = new Set(["valid", "tampered", "stale"]);

// POST /api/security/probe  { mode: "valid" | "tampered" | "stale" }
// Drives the real signature gate (handleSlackCommand -> verifySlackSignature)
// and returns the handler's own status over the wire: 200 for a valid
// request, 401 with { error: "signature <reason>" } otherwise.
// The request/response anatomy is echoed back for the playground display.
export async function POST(req: Request) {
  let mode: unknown;
  try {
    mode = ((await req.json()) as { mode?: unknown }).mode;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof mode !== "string" || !MODES.has(mode)) {
    return NextResponse.json({ error: "unknown probe mode" }, { status: 400 });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  // "stale" pushes the timestamp outside the 300s replay window.
  const timestamp = String(mode === "stale" ? nowSeconds - 600 : nowSeconds);
  const rawBody = new URLSearchParams({
    command: "/oncall",
    text: "probe",
  }).toString();
  let signature = signForTesting(DEMO_SIGNING_SECRET, timestamp, rawBody);
  if (mode === "tampered") {
    // Flip the final hex chars: same length, wrong digest -> "mismatch".
    signature = signature.slice(0, -2) + (signature.endsWith("00") ? "ff" : "00");
  }

  const result = handleSlackCommand(
    { rawBody, timestamp, signature },
    { signingSecret: DEMO_SIGNING_SECRET, outboundLog, nowSeconds },
  );

  return NextResponse.json(
    {
      mode,
      status: result.status,
      body: result.body,
      request: {
        timestamp,
        signature,
        rawBody,
        baseString: `v0:${timestamp}:${rawBody}`,
      },
    },
    { status: result.status },
  );
}
