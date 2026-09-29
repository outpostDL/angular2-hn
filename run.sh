#!/usr/bin/env bash
# Idempotent: starts the demo in the background if not already healthy.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
if curl -fs "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
  echo "Demo already running on http://localhost:$PORT"; exit 0
fi
PORT="$PORT" nohup python3 server.py > .demo.log 2>&1 &
echo $! > .demo.pid
for _ in $(seq 1 30); do
  if curl -fs "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
    echo "Demo running on http://localhost:$PORT (pid $(cat .demo.pid))"; exit 0
  fi
  sleep 0.5
done
echo "Demo failed to start; see .demo.log" >&2; exit 1
