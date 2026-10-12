// Shared server-side state for the demo API routes.
//
// outboundLog mirrors the source repo's in-memory outboundLog: the ported
// handlers append entries here instead of POSTing to Slack. Nothing here is
// ever sent anywhere — entries are only read back by GET /api/outbound and
// counted by GET /api/health (via handleHealth).
//
// The state lives on globalThis (the standard Next.js singleton pattern)
// because production builds bundle each API route separately — a plain
// module-level array would become one copy per route and the health route
// would never see the decisions route's entries.
//
// DEMO_SIGNING_SECRET is NOT a hardcoded key and NOT a credential. It is a
// random value generated once per server start, used only to self-sign the
// simulated Slack requests so the real HMAC verification path
// (verifySlackSignature, 300s replay window) is exercised end to end. It is
// never persisted, never leaves the process, and is not a secret for any
// real service — there is no real Slack workspace. The source repo's --demo
// mode does the equivalent with a throwaway test secret.

import { randomBytes } from "node:crypto";
import type { OutboundCall } from "../logic/types";

type DemoGlobals = {
  __sentinelOutboundLog?: OutboundCall[];
  __sentinelSigningSecret?: string;
};

const g = globalThis as DemoGlobals;
if (!g.__sentinelOutboundLog) {
  g.__sentinelOutboundLog = [];
}
if (!g.__sentinelSigningSecret) {
  g.__sentinelSigningSecret = randomBytes(32).toString("hex");
}

export const outboundLog: OutboundCall[] = g.__sentinelOutboundLog;
export const DEMO_SIGNING_SECRET: string = g.__sentinelSigningSecret;
