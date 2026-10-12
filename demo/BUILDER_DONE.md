# BUILDER_DONE — Sentinel console (infra-diagnostics-agent demo)

## What was built

A standalone Next.js 14 App Router app at
`~/workspace/demos/infra-diagnostics-agent/demo/` — a Microsoft Fluent v9
"Sentinel" console for the infra-diagnostics-agent backend. Zero login, zero
credentials, zero external network calls.

**Five surfaces** (left-nav sections, all real Fluent v9 components):
1. **Triage console** — alert text input + preset chips (OOMKilled
   payments-api, CrashLoopBackOff auth-svc, HighAPIErrorRate checkout-api) →
   `POST /api/alerts/triage` → ranked hypothesis cards (rank badge, summary,
   evidence list, dry-run remediation) each with Approve / Escalate / Ignore.
2. **Approval gate** — per-hypothesis buttons open a confirmation `Dialog`
   showing the exact dry-run remediation plan + evidence, with a
   `MessageBar(intent="warning")` labeled **SIMULATED — dry run only** (no
   cluster). Confirm → `POST /api/decisions` → toast with the agent's exact
   reply; decision recorded in the audit log tab.
3. **Signature playground** — valid / tampered / stale request probes →
   `POST /api/security/probe` returns real 200 / 401 verdicts over the wire,
   with the handler's exact body plus request anatomy (timestamp, base
   string, signature) in monospace.
4. **Outbound log & health** — `GET /api/health` (`{ ok, outboundCount }`
   from the real `handleHealth`) + table of the in-memory "Slack posts" the
   handlers append (read via demo-only `GET /api/outbound`; never sent).
5. **Alert stream** — toggle feeds sample alerts every 6s, every item badged
   SIMULATED; one click triages any item.

**Backend wiring (no mocks, no reimplementation):** `src/logic/` holds
byte-identical copies of the tested port (`types, agent, blocks,
slack_verify, handlers` — verified with `diff -r`). API routes only add HTTP
plumbing: they self-sign simulated Slack requests with a **per-process random
secret** (generated at startup via `node:crypto`, never hardcoded, never
persisted, not a real credential) so the genuine HMAC-SHA256 / 300s-replay
verification path runs end to end.

**Credentials / AI:** none needed, none used. The backend is fully
deterministic (keyword mock agent, HMAC checks, canned replies) — no LLM
calls exist in the original code and none were added. No escalation required.

## Build / typecheck status

- `npm run typecheck` — **clean, exit 0** (Node v24.20.0, npm 10.9.4).
- `npm run build` — **clean, exit 0**: "✓ Compiled successfully", types
  valid, all 7 routes generated. Full output saved at `/tmp/sentinel-build.log`.
- Installed versions: `@fluentui/react-components@9.74.9`,
  `@fluentui/react-icons@2.0.344`, `@fluentui/tokens@1.0.0-alpha.24`
  (note: the `^9.x` range does not exist for this package; latest is the
  1.0.0-alpha line), `next@14.2.35`, `react@18.3.1`.

## Runtime verification (production `next start`, curl)

- `POST /api/alerts/triage` — OOM/crashloop/fallback branches return the
  exact hypothesis strings; Slack body byte-faithful
  (`{"response_type":"ephemeral","text":"Triaging incident, will follow up in <channel>."}`).
- `POST /api/decisions` — approve/escalate/ignore return the exact
  `actionReply` texts; unknown action → 400.
- `POST /api/security/probe` — valid → HTTP 200; tampered → HTTP 401
  `{"error":"signature mismatch"}`; stale → HTTP 401 `{"error":"signature stale"}`.
- `GET /api/health` — `{"ok":true,"outboundCount":2}` after two decisions;
  `/api/outbound` lists both entries newest-first.
- `GET /` — 200, renders; Fluent SSR styles injected (no FOUC path).

## Two real bugs found and fixed during verification

1. **Per-route module copies:** Next.js production bundles each API route
   separately, so a module-level `outboundLog` array became one copy per
   route and decisions never reached the health route. Fixed with the
   standard `globalThis` singleton pattern in `src/lib/outbound.ts`.
2. **Static GET caching:** Next.js prerenders GET handlers at build time —
   `/api/health` froze at its build-time `outboundCount`. Fixed with
   `export const dynamic = "force-dynamic"` on the GET-only routes.

## How to run locally

```sh
cd ~/workspace/demos/infra-diagnostics-agent/demo
npm install
npm run dev      # http://localhost:3000
```

## Deploy

**Deploy directory (exact):** `~/workspace/demos/infra-diagnostics-agent/demo/`

Standalone app root: `package.json`, `next.config.mjs`, `src/` all assume
the app root is this directory. No `vercel.json` needed (Next.js
auto-detected, no env vars). Parent pushes this directory's content to
`dev4aibots/infra-diagnostics-agent` under `demo/` via `push_files`, then
connects Vercel with root directory `demo/`. No `git init` was done here
per the final plan; nothing was pushed.

## Deviations from DESIGN.md (with reasons)

1. **`useFluent().theme` unavailable** — v9.74.9's `useFluent()` type has no
   `.theme`; the current theme is exposed through the app's own
   `ThemeContext` instead (same token values, fully typed).
2. **ShinyText reimplemented, not copied** — react-bits license re-verified
   as MIT + Commons Clause v1.0 (use-as-part-of-app permitted), but the
   shimmer was written independently (gradient sweep via Griffel, token
   colors, `prefers-reduced-motion` respected) so no upstream code is
   redistributed. Attribution comment kept in `Header.tsx`. Still exactly
   one wow element, on the wordmark only.
3. **No confidence ProgressBar on hypothesis cards** — the ported
   `Hypothesis` type has no confidence field; rank badges are shown instead
   of inventing percentages.
4. **Left nav rail instead of top tabs** — closer to the Azure portal
   information hierarchy; still 100% Fluent components + tokens.
5. **Monospace via `theme.fontFamilyMonospace`** (read from the theme object
   per DESIGN.md §4) rather than a hardcoded stack.
