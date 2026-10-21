#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GoChina Edge Portal — Cloudflare Pages Deployment Script
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

DRY_RUN=false
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  fi
done

echo "=========================================================="
echo "🌐 GoChina Cloudflare Pages Deployment"
echo "Frontend dir: $FRONTEND_DIR"
echo "Dry run mode: $DRY_RUN"
echo "=========================================================="

echo "🔍 1. Running frontend typecheck & tests..."
pnpm --dir "$FRONTEND_DIR" typecheck
pnpm --dir "$FRONTEND_DIR" test

echo "📦 2. Building production static bundle..."
pnpm --dir "$FRONTEND_DIR" build

if [ ! -f "$FRONTEND_DIR/dist/index.html" ]; then
  echo "❌ Error: frontend/dist/index.html was not generated!"
  exit 1
fi

echo "✅ Static assets generated successfully in frontend/dist/"

if [ "$DRY_RUN" = true ]; then
  echo "✨ Dry run completed. Assets verified."
  exit 0
fi

echo "🚀 3. Deploying to Cloudflare Pages..."
pnpm wrangler pages deploy "$FRONTEND_DIR/dist" --project-name gochina-portal
echo "🎉 Frontend deployed successfully to Cloudflare Pages!"
