#!/usr/bin/env bash
# Serve PWA on local network for iPhone "Add to Home Screen" testing.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)/docs"
PORT="${1:-8080}"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "ExpenseTracker PWA"
echo "  Mac:     http://127.0.0.1:$PORT"
echo "  iPhone:  http://$IP:$PORT  (same Wi-Fi)"
echo ""
echo "On iPhone Safari → Share → Add to Home Screen"
echo ""

cd "$ROOT"
python3 -m http.server "$PORT"
