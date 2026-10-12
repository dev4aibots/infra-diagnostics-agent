# Vendored logic (do not edit)

Byte-identical copies of the tested port at
`~/workspace/demos/infra-diagnostics-agent/logic/`:

- `types.ts`, `agent.ts`, `blocks.ts`, `slack_verify.ts`, `handlers.ts`

Verified identical via `diff -r` (only `logic.test.ts` and `PORTING_NOTES.md`
were left out — tests already pass 30/30 upstream of this demo).

They live here (instead of `../logic`) so this Next.js app is a self-contained
deployable root. If the upstream logic changes, re-copy the files and re-run
`diff` — never hand-edit these copies.
