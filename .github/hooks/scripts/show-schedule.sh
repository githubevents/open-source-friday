#!/usr/bin/env bash
# SessionStart hook: print the current upcoming streams so Copilot has context
set -euo pipefail

echo "=== Open Source Friday – Upcoming Streams ==="
awk '/<!-- SCHEDULE_START -->/,/<!-- SCHEDULE_END -->/' README.md | grep -v "SCHEDULE_" || echo "(No schedule table found)"
echo ""
