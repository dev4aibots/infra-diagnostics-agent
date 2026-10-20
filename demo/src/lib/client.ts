// Typed client for the demo API routes. All data comes from the ported
// backend logic via the routes — the UI never reimplements agent, signing,
// or handler behavior.
import type { AgentReport } from "@/logic/types";

export type TriageResult = {
  slack: { status: number; body: { response_type?: string; text?: string } };
  report: AgentReport;
};

export type DecisionAction = "approve" | "escalate" | "dismiss";

export type DecisionResult = {
  status: number;
  body: { response_type?: string; replace_original?: boolean; text?: string };
};

export type ProbeMode = "valid" | "tampered" | "stale";

export type ProbeResult = {
  mode: ProbeMode;
  status: number;
  body: { error?: string; response_type?: string; text?: string };
  request: { timestamp: string; signature: string; rawBody: string; baseString: string };
};

export type HealthResult = { ok: boolean; outboundCount: number };

export type OutboundEntry = { url: string; body: unknown };
export type OutboundResult = { entries: OutboundEntry[]; count: number };

export type DecisionRecord = {
  id: string;
  at: string;
  incidentId: string;
  action: DecisionAction;
  replyText: string;
  remediation: string;
};

async function postJson<T>(path: string, payload: unknown): Promise<{ httpStatus: number; json: T }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as T;
  return { httpStatus: res.status, json };
}

export async function triageAlert(text: string): Promise<TriageResult> {
  const { httpStatus, json } = await postJson<TriageResult>("/api/alerts/triage", { text });
  // A network failure already rejects out of fetch(); an HTTP error status
  // must also surface as a failure so the UI can show an inline error
  // instead of silently reverting (QA defect D8).
  if (httpStatus < 200 || httpStatus >= 300) {
    throw new Error(`triage request failed with HTTP ${httpStatus}`);
  }
  return json;
}

export async function recordDecision(
  action: DecisionAction,
  incidentId: string,
): Promise<DecisionResult> {
  const { json } = await postJson<DecisionResult>("/api/decisions", { action, incidentId });
  return json;
}

export async function runProbe(mode: ProbeMode): Promise<{ httpStatus: number; result: ProbeResult }> {
  const { httpStatus, json } = await postJson<ProbeResult>("/api/security/probe", { mode });
  return { httpStatus, result: json };
}

export async function fetchHealth(): Promise<HealthResult> {
  const res = await fetch("/api/health");
  return (await res.json()) as HealthResult;
}

export async function fetchOutbound(): Promise<OutboundResult> {
  const res = await fetch("/api/outbound");
  return (await res.json()) as OutboundResult;
}
