#!/usr/bin/env bash
# check-vercel-git-block.sh — asserts the KNOWN BLOCKER state for Vercel git linking.
#
# Context: Vercel's GitHub integration can see dev4aibots repos (search_repo works),
# but create_git_project 403s: the Muse Vercel OAuth token lacks the dev4aibots
# team scope (team_aVIe0g0kWWcPQQRqqGXhD4v1). Vercel's own API says the only fix is
# re-authentication by the user in the Vercel dashboard. Direct deployments
# (create_deployment) are unaffected.
#
# Exit 0 = the blocker is still exactly as documented (403 team-scope refusal).
# Exit 1 = the situation CHANGED (either linking now works, or a different error
#          appeared) — a human must update the claims and the deploy workflow.
set -u
OUT=$(vercel call-tool --name create_git_project --arguments-json \
  '{"repo":"dev4aibots/infra-diagnostics-agent","teamId":"team_aVIe0g0kWWcPQQRqqGXhD4v1","rootDirectory":"demo"}' 2>&1)
echo "$OUT" | grep -q "Not authorized" || echo "$OUT" | grep -q "re-authenticate" || echo "$OUT" | grep -qi "403"
if [ $? -eq 0 ]; then
  echo "BLOCKER CONFIRMED: Vercel git-link still 403s on dev4aibots team scope."
  echo "User action needed (one-time): re-authorize the Vercel GitHub App on dev4aibots."
  exit 0
fi
echo "STATE CHANGED — output was:"
echo "$OUT" | head -20
exit 1