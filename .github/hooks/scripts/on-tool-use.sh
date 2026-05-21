#!/usr/bin/env bash
# PostToolUse hook: re-run the schedule script when relevant files are edited
set -euo pipefail

# Read hook payload from stdin
PAYLOAD=$(cat)

# Extract the file path touched (works for editFiles, createFile, apply_patch, str_replace_editor)
TOUCHED=$(echo "$PAYLOAD" | python3 -c "
import json, sys
try:
    p = json.load(sys.stdin)
    inp = p.get('input', {})
    # Different tools use different field names
    path = (
        inp.get('filePath') or
        inp.get('path') or
        inp.get('target_file') or
        ''
    )
    print(path)
except Exception:
    print('')
" 2>/dev/null || true)

# Only re-run the schedule script if a relevant file was edited
case "$TOUCHED" in
  .github/scripts/update_schedule.py|\
  .github/ISSUE_TEMPLATE/*.yml|\
  README.md)
    echo "[osf-hook] Detected edit to '$TOUCHED' — refreshing schedule table..."
    if [ -z "${GITHUB_TOKEN:-}" ]; then
      echo "[osf-hook] GITHUB_TOKEN not set, skipping schedule refresh."
      exit 0
    fi
    python3 .github/scripts/update_schedule.py
    echo "[osf-hook] Schedule table updated."
    ;;
  *)
    exit 0
    ;;
esac
