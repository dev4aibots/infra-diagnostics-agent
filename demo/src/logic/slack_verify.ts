// Ported from dev4aibots/infra-diagnostics-agent src/slack_verify.ts (verbatim logic).
// Uses ONLY node:crypto (node stdlib — permitted by the brief; no external deps).
// Framework-agnostic within Node-based runtimes (Next.js Node runtime, tsx,
// vitest). NOT edge-runtime/WebCrypto: see PORTING_NOTES.md for why the
// node:crypto form is kept byte-for-byte identical to the source.
//
// Slack signing contract (unchanged from source):
//   base      = "v0:<timestamp>:<rawBody>"
//   signature = "v0=" + HMAC-SHA256(secret, base).hexdigest()
//   verdict order: bad-timestamp -> stale -> length-mismatch -> mismatch -> ok
// REPLAY_WINDOW_SECONDS = 300 (5 minutes), compared with Math.abs(now - ts).

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SignatureVerdict } from "./types";

export const SIGNATURE_VERSION = "v0";
export const REPLAY_WINDOW_SECONDS = 60 * 5;

export type VerifyArgs = {
  signingSecret: string;
  timestamp: string;
  signature: string;
  rawBody: string;
  nowSeconds: number;
};

export function verifySlackSignature(args: VerifyArgs): SignatureVerdict {
  const ts = Number(args.timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad-timestamp" };
  if (Math.abs(args.nowSeconds - ts) > REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: "stale" };
  }
  const base = `${SIGNATURE_VERSION}:${args.timestamp}:${args.rawBody}`;
  const computed =
    `${SIGNATURE_VERSION}=` +
    createHmac("sha256", args.signingSecret).update(base).digest("hex");
  const got = Buffer.from(args.signature);
  const want = Buffer.from(computed);
  if (got.length !== want.length) return { ok: false, reason: "length-mismatch" };
  if (!timingSafeEqual(got, want)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}

export function signForTesting(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
): string {
  const base = `${SIGNATURE_VERSION}:${timestamp}:${rawBody}`;
  return (
    `${SIGNATURE_VERSION}=` +
    createHmac("sha256", signingSecret).update(base).digest("hex")
  );
}
