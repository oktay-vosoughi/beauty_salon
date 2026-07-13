#!/usr/bin/env bash
#
# Server-side deploy for Niltellioglu — run ON the VPS.
#
#   cd /var/www/guzellikmerkezi && bash deploy/deploy.sh
#
# Pulls latest main, installs deps, runs DB migrations, rebuilds the Next
# standalone bundle, and reloads PM2 (guzellik-api + guzellik-web).
#
# SAFE with user data:
#   * Never runs `git clean` or `rm -rf`, so customer-uploaded product images
#     in apps/web/public/uploads survive every deploy.
#   * Asset copies MERGE into the standalone dir (add/overwrite, never delete).
#   * Takes a full mysqldump backup BEFORE running migrations. If the backup
#     fails, the deploy aborts before touching the DB (fail-safe).
#
# The whole body is wrapped in main() and called on the last line, so bash
# parses the entire file before running — safe even though `git pull` may
# rewrite this very script mid-deploy.

set -euo pipefail

REPO="/var/www/guzellikmerkezi"
BRANCH="main"
# WEB_BASE_URL is read at BUILD time (sitemap.ts / robots.ts / canonical URLs),
# so it must be exported before `next build`, not just present at runtime.
WEB_BASE_URL="${WEB_BASE_URL:-https://ntbeauty.shop}"

main() {
  cd "$REPO"

  echo "▶ 1/7  Fetching latest origin/$BRANCH …"
  git fetch origin "$BRANCH"
  if ! git merge --ff-only "origin/$BRANCH"; then
    echo "✗ Fast-forward merge failed: local commits or uncommitted edits to a"
    echo "  tracked file (e.g. ecosystem.config.js) conflict with upstream."
    echo "  Reconcile on the server, then re-run. Untracked files (.env, uploads)"
    echo "  are never touched by this script."
    exit 1
  fi

  echo "▶ 2/7  Installing dependencies …"
  pnpm install --frozen-lockfile

  echo "▶ 3/7  Backing up database (before any migration) …"
  bash "$REPO/deploy/backup.sh"

  echo "▶ 4/7  Prisma generate + migrate deploy …"
  pnpm --filter @niltellioglu/api exec prisma generate
  pnpm --filter @niltellioglu/api exec prisma migrate deploy

  echo "▶ 5/7  Building web (Next standalone) with WEB_BASE_URL=$WEB_BASE_URL …"
  WEB_BASE_URL="$WEB_BASE_URL" pnpm --filter @niltellioglu/web build

  echo "▶ 6/7  Syncing standalone assets (preserving uploads) …"
  # `next build` regenerates .next/standalone but does NOT include static/public,
  # so copy them in. Merge semantics (trailing /.) add/overwrite but never delete.
  SA="apps/web/.next/standalone/apps/web"
  mkdir -p "$SA/.next/static" "$SA/public"
  cp -r apps/web/.next/static/. "$SA/.next/static/"
  cp -r apps/web/public/.       "$SA/public/"

  echo "▶ 7/7  Restarting PM2 (by name — restarting via the ecosystem file has"
  echo "        errored and killed the process before) …"
  pm2 restart guzellik-api guzellik-web
  pm2 save

  echo "✓ Deploy complete."
}

main "$@"
