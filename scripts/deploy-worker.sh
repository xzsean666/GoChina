#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GoChina Edge Portal — Cloudflare Workers Deployment Script
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN=false
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  fi
done

echo "=========================================================="
echo "🚀 GoChina Cloudflare Workers Deployment"
echo "Root: $ROOT_DIR"
echo "Dry run mode: $DRY_RUN"
echo "=========================================================="

echo "🔍 1. Running backend typecheck..."
pnpm typecheck

echo "🧪 2. Running test suite..."
pnpm test

if [ "$DRY_RUN" = true ]; then
  echo "📦 3. Executing dry-run build & validation via Wrangler..."
  pnpm wrangler deploy --dry-run
  echo "✅ Dry run deployment passed successfully!"
  exit 0
fi

echo "🔐 3. Verifying Cloudflare credentials..."
if ! pnpm wrangler whoami >/dev/null 2>&1; then
  echo "⚠️ Cloudflare Wrangler is not authenticated. Please run 'wrangler login' or set CLOUDFLARE_API_TOKEN."
fi

echo "🚀 4. Deploying Worker to Cloudflare edge..."
pnpm wrangler deploy
echo "🎉 Worker deployed successfully!"
