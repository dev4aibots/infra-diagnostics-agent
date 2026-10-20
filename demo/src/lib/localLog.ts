// Per-visitor local log for the demo.
//
// Why this exists: the API routes keep their outbound log in
// per-serverless-instance memory, so on Vercel consecutive requests land
// on different instances holding different (or empty) logs — a visitor's
// "Sent messages" view could vanish on refresh or, worse, show another
// session's entries. A demo visitor's own record belongs to that visitor,
// so decisions and the outbound entries they produce are persisted in the
// visitor's own browser (localStorage) and rendered from there. Refresh
// and instance-hopping can no longer corrupt or leak the log, and one
// visitor can never see another visitor's entries.
//
// The entries stored here are exactly the ones the client itself
// recorded: POST /api/decisions returns the agent's reply text, and the
// server handler appends { url: response_url, body: { text } } for it —
// the client mirrors that same entry locally (simulated, never sent).

import type { DecisionRecord, OutboundEntry } from "./client";

/** The simulated Slack response_url the decisions route records against. */
export const OUTBOUND_URL =
  "https://hooks.slack.com/demo/sentinel (simulated — never sent)";

const DECISIONS_KEY = "sentinel:decisions:v1";
const OUTBOUND_KEY = "sentinel:outbound:v1";

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / unavailable (private mode): the in-memory state in
    // page.tsx still covers the current session.
  }
}

export function loadDecisions(): DecisionRecord[] {
  const parsed = readJson(DECISIONS_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (d): d is DecisionRecord =>
      typeof d === "object" &&
      d !== null &&
      typeof (d as DecisionRecord).id === "string" &&
      typeof (d as DecisionRecord).incidentId === "string" &&
      typeof (d as DecisionRecord).replyText === "string" &&
      typeof (d as DecisionRecord).remediation === "string",
  );
}

export function saveDecisions(decisions: DecisionRecord[]): void {
  writeJson(DECISIONS_KEY, decisions);
}

export function loadOutbound(): OutboundEntry[] {
  const parsed = readJson(OUTBOUND_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (e): e is OutboundEntry =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as OutboundEntry).url === "string" &&
      "body" in e,
  );
}

export function saveOutbound(entries: OutboundEntry[]): void {
  writeJson(OUTBOUND_KEY, entries);
}

/** True when a hypothesis carries no fix that could be approved. */
export function isNoRemediation(remediation: string): boolean {
  return remediation.trim().toLowerCase() === "no remediation proposed";
}
