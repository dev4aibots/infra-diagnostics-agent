import { NextResponse } from "next/server";
import { handleSlackInteractivity } from "@/logic/handlers";
import { signForTesting } from "@/logic/slack_verify";
import { DEMO_SIGNING_SECRET, outboundLog } from "@/lib/outbound";

const ACTIONS = new Set(["approve", "escalate", "dismiss"]);

// POST /api/decisions  { action: "approve" | "escalate" | "dismiss", incidentId: string }
// Replicates the Slack interactivity flow: builds the exact payload shape the
// source validates, self-signs it, and runs it through handleSlackInteractivity.
// The handler appends { url, body: { text } } to the outbound log — the same
// entry a real Slack response_url post would produce (simulated, never sent).
export async function POST(req: Request) {
  let action: unknown;
  let incidentId: unknown;
  try {
    const json = (await req.json()) as { action?: unknown; incidentId?: unknown };
    action = json.action;
    incidentId = json.incidentId;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof action !== "string" || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  if (typeof incidentId !== "string" || incidentId.length === 0) {
    return NextResponse.json({ error: "incidentId required" }, { status: 400 });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestamp = String(nowSeconds);
  const payload = JSON.stringify({
    actions: [{ action_id: action, value: incidentId }],
    response_url: "https://hooks.slack.com/demo/sentinel (simulated — never sent)",
  });
  const rawBody = new URLSearchParams({ payload }).toString();
  const signature = signForTesting(DEMO_SIGNING_SECRET, timestamp, rawBody);

  const result = handleSlackInteractivity(
    { rawBody, timestamp, signature },
    { signingSecret: DEMO_SIGNING_SECRET, outboundLog, nowSeconds },
  );

  return NextResponse.json(
    { status: result.status, body: result.body },
    { status: result.status },
  );
}
