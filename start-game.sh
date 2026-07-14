#!/usr/bin/env bash
# The Hollow Oath — launcher (Linux/macOS)
# Installs dependencies on first run, builds the production bundle once,
# then serves it locally and opens your browser.
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js / npm is required. Install it from https://nodejs.org (v20+)."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: installing dependencies (one time only)..."
  npm install
fi

if [ ! -d dist ]; then
  echo "Building the game (one time only)..."
  npm run build
fi

echo ""
echo "  The Hollow Oath is starting at http://localhost:4173"
echo "  (Keep this window open while playing. Press Ctrl+C to quit.)"
echo ""

( sleep 2 && (command -v xdg-open >/dev/null && xdg-open http://localhost:4173 || command -v open >/dev/null && open http://localhost:4173) ) >/dev/null 2>&1 &
npm run preview
