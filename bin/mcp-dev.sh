#!/usr/bin/env bash
# Launcher for MCP clients that ignore cwd or rewrite args (e.g. Claude Desktop).
# Single executable, no arguments required.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.bun/bin:${PATH}"
if ! command -v bun >/dev/null 2>&1; then
  echo "sonic-pi-mcp: bun not found. Install https://bun.sh or add bun to PATH." >&2
  exit 1
fi
exec bun run src/server.ts
