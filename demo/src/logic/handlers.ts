// Faithful framework-agnostic port of dev4aibots/infra-diagnostics-agent
// src/server.ts ROUTE LOGIC (Hono wiring and zod removed; pure functions).
// Zero external dependencies (no hono, no zod). Intended to be imported by
// Next.js API route handlers, which only add HTTP plumbing around these.
//
// Behavior mirrors the source exactly:
// - GET /health        -> 200 { ok: true, outboundCount: outboundLog.length }
// - POST /slack/command: verify signature (401 { error: "signature <reason>" }),
//   mockAgent(text), buildSlackResponse(report), push outbound entry only when
//   response_url is non-empty; always 200
//   { response_type: "ephemeral", text: "Triaging incident, will follow up in <url|channel>." }
// - POST /slack/interactivity: verify signature (401), parse+validate payload
//   (400 { error: "bad interactivity payload" }), actionReply(...), push
//   outbound entry { url, body: { text: reply.text } } only when response_url
//   present; 200 with the reply.
// - 404 notFound body { error: "not found" } is framework-level and stays in
//   the route layer (it carries no domain logic).
//
// The zod InteractivitySchema is replaced by an equivalent hand check that
// rejects exactly the same shapes: JSON must be an object (not null/array);
// `actions`, when present, must be an array of objects whose action_id/value
// are strings when present; `response_url`, when present, must be a string.

import { verifySlackSignature } from "./slack_verify";
import { mockAgent } from "./agent";
import { actionReply, buildSlackResponse } from "./blocks";
import type { OutboundCall } from "./types";

export type RouteRequest = {
  /** The raw, unmodified request body string (exactly as signed by Slack). */
  rawBody: string;
  /** Value of the x-slack-request-timestamp header ("" when absent). */
  timestamp: string;
  /** Value of the x-slack-signature header ("" when absent). */
  signature: string;
};

export type HandlerDeps = {
  signingSecret: string;
  outboundLog: OutboundCall[];
  nowSeconds: number;
};

export type RouteResult = {
  status: number;
  body: unknown;
};

function requireSignature(req: RouteRequest, deps: HandlerDeps): RouteResult | null {
  const verdict = verifySlackSignature({
    signingSecret: deps.signingSecret,
    timestamp: req.timestamp,
    signature: req.signature,
    rawBody: req.rawBody,
    nowSeconds: deps.nowSeconds,
  });
  if (!verdict.ok) {
    return { status: 401, body: { error: `signature ${verdict.reason}` } };
  }
  return null;
}

type InteractivityPayload = {
  actions?: Array<{ action_id?: string; value?: string }>;
  response_url?: string;
};

// Equivalent of the source's zod InteractivitySchema. Throws on any shape
// zod would reject (caller maps to 400).
function parseInteractivityPayload(payloadStr: string): InteractivityPayload {
  const parsed: unknown = JSON.parse(payloadStr);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("bad interactivity payload");
  }
  const obj = parsed as Record<string, unknown>;
  const out: InteractivityPayload = {};
  if (obj.actions !== undefined) {
    if (!Array.isArray(obj.actions)) throw new Error("bad interactivity payload");
    out.actions = obj.actions.map((a) => {
      if (typeof a !== "object" || a === null || Array.isArray(a)) {
        throw new Error("bad interactivity payload");
      }
      const item = a as Record<string, unknown>;
      const entry: { action_id?: string; value?: string } = {};
      if (item.action_id !== undefined) {
        if (typeof item.action_id !== "string") throw new Error("bad interactivity payload");
        entry.action_id = item.action_id;
      }
      if (item.value !== undefined) {
        if (typeof item.value !== "string") throw new Error("bad interactivity payload");
        entry.value = item.value;
      }
      return entry;
    });
  }
  if (obj.response_url !== undefined) {
    if (typeof obj.response_url !== "string") throw new Error("bad interactivity payload");
    out.response_url = obj.response_url;
  }
  return out;
}

export function handleHealth(outboundLog: OutboundCall[]): RouteResult {
  return { status: 200, body: { ok: true, outboundCount: outboundLog.length } };
}

export function handleSlackCommand(req: RouteRequest, deps: HandlerDeps): RouteResult {
  const denied = requireSignature(req, deps);
  if (denied) return denied;
  const params = new URLSearchParams(req.rawBody);
  const text = params.get("text") ?? "";
  const responseUrl = params.get("response_url") ?? "";
  const report = mockAgent(text);
  const payload = buildSlackResponse(report);
  if (responseUrl) {
    deps.outboundLog.push({ url: responseUrl, body: payload });
  }
  return {
    status: 200,
    body: {
      response_type: "ephemeral",
      text: `Triaging incident, will follow up in <${responseUrl || "channel"}>.`,
    },
  };
}

export function handleSlackInteractivity(
  req: RouteRequest,
  deps: HandlerDeps,
): RouteResult {
  const denied = requireSignature(req, deps);
  if (denied) return denied;
  const params = new URLSearchParams(req.rawBody);
  const payloadStr = params.get("payload") ?? "{}";
  let parsed: InteractivityPayload;
  try {
    parsed = parseInteractivityPayload(payloadStr);
  } catch {
    return { status: 400, body: { error: "bad interactivity payload" } };
  }
  const action = parsed.actions?.[0] ?? {};
  const actionId = action.action_id ?? "unknown";
  const incidentId = action.value ?? "unknown";
  const reply = actionReply(actionId, incidentId);
  if (parsed.response_url) {
    deps.outboundLog.push({ url: parsed.response_url, body: { text: reply.text } });
  }
  return { status: 200, body: reply };
}
