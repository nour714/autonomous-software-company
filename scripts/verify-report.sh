#!/usr/bin/env bash
# ==============================================================================
# verify-report.sh <report.md> <project_root>
# Validates an evidence-based audit report against a project repository root.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <report.md> <project_root>" >&2
  exit 1
fi

REPORT_MD="$1"
PROJECT_ROOT="$2"

node "${SCRIPT_DIR}/verify-report.cjs" "$REPORT_MD" "$PROJECT_ROOT"
