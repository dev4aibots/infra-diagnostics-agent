import { NextResponse } from "next/server";
import { handleSlackCommand } from "@/logic/handlers";
import { mockAgent } from "@/logic/agent";
import { signForTesting } from "@/logic/slack_verify";
import { DEMO_SIGNING_SECRET, outboundLog } from "@/lib/outbound";

// POST /api/alerts/triage  { text: string }
// Runs the real handleSlackCommand (self-signed with the demo secret, so the
// HMAC verification path is genuinely exercised), then produces the ranked
// hypotheses for the console via mockAgent — the same function the handler
// uses internally. response_url is empty, so nothing is appended to the
// outbound log by the triage path (decisions are what get logged).
export async function POST(req: Request) {
  let text = "";
  try {
    const json = (await req.json()) as { text?: unknown };
    if (typeof json.text === "string") text = json.text;
  } catch {
    text = "";
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestamp = String(nowSeconds);
  const rawBody = new URLSearchParams({ text, response_url: "" }).toString();
  const signature = signForTesting(DEMO_SIGNING_SECRET, timestamp, rawBody);

  const result = handleSlackCommand(
    { rawBody, timestamp, signature },
    { signingSecret: DEMO_SIGNING_SECRET, outboundLog, nowSeconds },
  );

  // Separate mockAgent call for display. The handler's internal report stays
  // internal (no response_url => never pushed to the outbound log), so the
  // incident id shown on the cards is the single visible one.
  const report = mockAgent(text);

  return NextResponse.json({
    slack: { status: result.status, body: result.body },
    report,
  });
}
