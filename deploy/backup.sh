#!/usr/bin/env bash
#
# Standalone database backup for Niltellioglu — run ON the VPS, on demand or via cron.
#
#   bash /var/www/guzellikmerkezi/deploy/backup.sh
#
# Writes a gzip'd, timestamped mysqldump into backups/ and keeps the most
# recent $BACKUP_KEEP dumps. Safe to run any time — it only READS the DB.
#
# DB credentials are parsed from apps/api/.env by Node (correct percent-
# decoding of the password) and written to a 0600 options file, so the
# password never appears in the process list (`ps`).
#
# Daily cron (3:15 AM), logging to a file:
#   15 3 * * * /usr/bin/bash /var/www/guzellikmerkezi/deploy/backup.sh >> /var/log/niltellioglu-backup.log 2>&1

set -euo pipefail

REPO="/var/www/guzellikmerkezi"
BACKUP_DIR="${BACKUP_DIR:-$REPO/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-30}"     # how many timestamped dumps to retain

CNF_TMP=""
cleanup() { [ -n "$CNF_TMP" ] && rm -f "$CNF_TMP"; }
trap cleanup EXIT

cd "$REPO"

# Parse DATABASE_URL → 0600 MySQL options file; echo the DB name.
url=$(grep -E '^DATABASE_URL=' apps/api/.env | head -1 | cut -d '=' -f2-)
url="${url%\"}"; url="${url#\"}"; url="${url%\'}"; url="${url#\'}"
CNF_TMP="$(mktemp)"
dbname=$(DB_URL="$url" CNF="$CNF_TMP" node -e '
  const u = new URL(process.env.DB_URL);
  require("fs").writeFileSync(process.env.CNF,
    `[client]\nhost=${u.hostname}\nport=${u.port||3306}\n` +
    `user=${decodeURIComponent(u.username)}\n` +
    `password="${decodeURIComponent(u.password)}"\n`, { mode: 0o600 });
  process.stdout.write(u.pathname.replace(/^\//, ""));
')

mkdir -p "$BACKUP_DIR"
out="$BACKUP_DIR/${dbname}-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "Backing up '$dbname' → $out"
mysqldump --defaults-extra-file="$CNF_TMP" \
  --single-transaction --quick --routines --triggers "$dbname" | gzip > "$out"
rm -f "$CNF_TMP"; CNF_TMP=""

# Retain only the most recent $BACKUP_KEEP dumps.
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n "+$((BACKUP_KEEP + 1))" | xargs -r rm -f

echo "✓ Backup complete: $(du -h "$out" | cut -f1)  ($(ls -1 "$BACKUP_DIR"/*.sql.gz | wc -l) dumps kept)"
echo "  Restore with:  gunzip -c '$out' | mysql --defaults-extra-file=<creds> $dbname"
