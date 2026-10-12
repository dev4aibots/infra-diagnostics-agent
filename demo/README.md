# Sentinel — Infra Diagnostics Console (demo)

A simulated Microsoft Fluent 2 console for
[`dev4aibots/infra-diagnostics-agent`](https://github.com/dev4aibots/infra-diagnostics-agent):
an autonomous DevOps agent that triages Kubernetes alerts, proposes ranked
root-cause hypotheses, and gates every remediation behind human approval.

**Everything is simulated.** There is no live cluster, no real Slack
workspace, no credentials, and no external network calls. The backend logic
is the real ported code from the source repo (see `src/logic/`), exercised
through Next.js API routes.

## Run locally

```sh
npm install
npm run dev      # http://localhost:3000
```

Production check:

```sh
npm run build
npm run typecheck
npm start
```

## Deploy (Vercel)

This directory is a standalone Next.js 14 app — deploy straight from here:

```sh
vercel create_deployment ./   # run from this directory
```

No `vercel.json` needed; no environment variables needed.

## What it does

| Surface | What it shows |
|---|---|
| **Triage console** | Type an alert (or use a preset chip) → the agent's ranked hypotheses with evidence and dry-run remediation plans. |
| **Approval gate** | Approve / Escalate / Ignore per hypothesis → confirmation dialog with the exact dry-run plan, labeled SIMULATED → decision logged. |
| **Signature playground** | Fire valid / tampered / stale signed requests at the real HMAC-SHA256 verification gate → 200 / 401 verdicts. |
| **Outbound log** | The in-memory "Slack posts" the handlers append, plus the live `GET /health` counter. |
| **Alert stream** | A timer feeds sample alerts (all labeled SIMULATED); one click triages any of them. |

## How it's wired

- `src/logic/` — byte-identical copies of the tested port
  (`~/workspace/demos/infra-diagnostics-agent/logic/`): `mockAgent`,
  `buildSlackResponse`, `actionReply`, `verifySlackSignature`,
  `handleHealth`, `handleSlackCommand`, `handleSlackInteractivity`.
  **Do not edit** — re-copy from upstream instead.
- `src/app/api/*` — thin Next.js route wrappers. They self-sign simulated
  Slack requests with a per-process random secret (generated at startup,
  never hardcoded, never persisted) so the real signature-verification path
  runs end to end.
- `src/components/` + `src/app/` — Fluent v9 UI. All styling uses Fluent
  semantic tokens (`tokens.*`); see `DESIGN.md`. No raw hex/px values.

## Honest limits

- The "agent" is the source repo's keyword-matching mock — no LLM, no
  Kubernetes, no Prometheus.
- "Outbound Slack posts" are appended to an in-memory array, never sent.
- Remediation plans are dry-run displays; nothing executes.
- The signing secret is a throwaway per-process random value, not a real
  credential.
