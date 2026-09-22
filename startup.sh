#!/bin/sh
set -eu
cd /workspace
# Field-test admin key (server only). Override by exporting ADMIN_KEY.
export ADMIN_KEY="${ADMIN_KEY:-stayora-thu}"
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
