// Ported from dev4aibots/infra-diagnostics-agent src/types.ts (verbatim logic).
// Zero external dependencies. Framework-agnostic: safe to import in any
// runtime (Node, edge, browser bundles) — this file has no imports at all.

export type Hypothesis = {
  rank: number;
  summary: string;
  evidence: string[];
  remediation: string;
};

export type AgentReport = {
  incidentId: string;
  topHypotheses: Hypothesis[];
};

export type Block = Record<string, unknown>;

export type SlackResponse = {
  response_type: "in_channel" | "ephemeral";
  blocks?: Block[];
  text?: string;
  replace_original?: boolean;
};

export type OutboundCall = {
  url: string;
  body: unknown;
};

export type SignatureVerdict =
  | { ok: true }
  | { ok: false; reason: "bad-timestamp" | "stale" | "length-mismatch" | "mismatch" };
