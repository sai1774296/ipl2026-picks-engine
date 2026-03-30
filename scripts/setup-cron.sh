#!/usr/bin/env bash
# setup-cron.sh — Install (or remove) cron jobs for all IPL 2026 match notifications.
#
# Usage:
#   bash scripts/setup-cron.sh           # install all 70 match cron jobs
#   bash scripts/setup-cron.sh --remove  # remove all IPL 2026 cron jobs
#
# After install, verify with:   crontab -l
# Each job fires at match start time (UTC) and sends the WhatsApp picks sheet.
# Make sure GROUP_ID is set in notify-picks.js before the first real match.

set -euo pipefail

# Absolute path to the project root (directory containing this script's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_BIN="$(command -v node)"
LOG_FILE="$PROJECT_DIR/logs/notify.log"

MARKER="# IPL2026_NOTIFY"

# ─────────────────────────────────────────────────────────────
# IPL 2026 schedule — UTC times (keep in sync with notify-picks.js)
# Format: "matchId UTC_datetime"
# ─────────────────────────────────────────────────────────────
MATCHES=(
  "1  2026-03-28T14:00:00Z"
  "2  2026-03-29T14:00:00Z"
  "3  2026-03-30T14:00:00Z"
  "4  2026-03-31T14:00:00Z"
  "5  2026-04-01T14:00:00Z"
  "6  2026-04-02T14:00:00Z"
  "7  2026-04-03T14:00:00Z"
  "8  2026-04-04T10:00:00Z"
  "9  2026-04-04T14:00:00Z"
  "10 2026-04-05T10:00:00Z"
  "11 2026-04-05T14:00:00Z"
  "12 2026-04-06T14:00:00Z"
  "13 2026-04-07T14:00:00Z"
  "14 2026-04-08T14:00:00Z"
  "15 2026-04-09T14:00:00Z"
  "16 2026-04-10T14:00:00Z"
  "17 2026-04-11T10:00:00Z"
  "18 2026-04-11T14:00:00Z"
  "19 2026-04-12T10:00:00Z"
  "20 2026-04-12T14:00:00Z"
  "21 2026-04-13T14:00:00Z"
  "22 2026-04-14T14:00:00Z"
  "23 2026-04-15T14:00:00Z"
  "24 2026-04-16T14:00:00Z"
  "25 2026-04-17T14:00:00Z"
  "26 2026-04-18T10:00:00Z"
  "27 2026-04-18T14:00:00Z"
  "28 2026-04-19T10:00:00Z"
  "29 2026-04-19T14:00:00Z"
  "30 2026-04-20T14:00:00Z"
  "31 2026-04-21T14:00:00Z"
  "32 2026-04-22T14:00:00Z"
  "33 2026-04-23T14:00:00Z"
  "34 2026-04-24T14:00:00Z"
  "35 2026-04-25T10:00:00Z"
  "36 2026-04-25T14:00:00Z"
  "37 2026-04-26T10:00:00Z"
  "38 2026-04-26T14:00:00Z"
  "39 2026-04-27T14:00:00Z"
  "40 2026-04-28T14:00:00Z"
  "41 2026-04-29T14:00:00Z"
  "42 2026-04-30T14:00:00Z"
  "43 2026-05-01T14:00:00Z"
  "44 2026-05-02T14:00:00Z"
  "45 2026-05-03T10:00:00Z"
  "46 2026-05-03T14:00:00Z"
  "47 2026-05-04T14:00:00Z"
  "48 2026-05-05T14:00:00Z"
  "49 2026-05-06T14:00:00Z"
  "50 2026-05-07T14:00:00Z"
  "51 2026-05-08T14:00:00Z"
  "52 2026-05-09T14:00:00Z"
  "53 2026-05-10T10:00:00Z"
  "54 2026-05-10T14:00:00Z"
  "55 2026-05-11T14:00:00Z"
  "56 2026-05-12T14:00:00Z"
  "57 2026-05-13T14:00:00Z"
  "58 2026-05-14T14:00:00Z"
  "59 2026-05-15T14:00:00Z"
  "60 2026-05-16T14:00:00Z"
  "61 2026-05-17T10:00:00Z"
  "62 2026-05-17T14:00:00Z"
  "63 2026-05-18T14:00:00Z"
  "64 2026-05-19T14:00:00Z"
  "65 2026-05-20T14:00:00Z"
  "66 2026-05-21T14:00:00Z"
  "67 2026-05-22T14:00:00Z"
  "68 2026-05-23T14:00:00Z"
  "69 2026-05-24T10:00:00Z"
  "70 2026-05-24T14:00:00Z"
)

# ─────────────────────────────────────────────────────────────
# --remove: strip all IPL2026_NOTIFY lines from crontab
# ─────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--remove" ]]; then
  echo "Removing all IPL 2026 cron jobs..."
  crontab -l 2>/dev/null | grep -v "$MARKER" | crontab -
  echo "Done. Run 'crontab -l' to verify."
  exit 0
fi

# ─────────────────────────────────────────────────────────────
# Build new cron entries
# ─────────────────────────────────────────────────────────────
mkdir -p "$PROJECT_DIR/logs"

NEW_ENTRIES=""
SKIPPED=0
NOW_EPOCH=$(date -u +%s)

for entry in "${MATCHES[@]}"; do
  match_id=$(echo "$entry" | awk '{print $1}')
  utc_str=$(echo "$entry" | awk '{print $2}')

  # Parse date parts from "YYYY-MM-DDTHH:MM:SSZ"
  year="${utc_str:0:4}"
  month="${utc_str:5:2}"
  day="${utc_str:8:2}"
  hour="${utc_str:11:2}"
  minute="${utc_str:14:2}"

  # Remove leading zeros for cron (cron fields are numeric)
  cron_min=$((10#$minute))
  cron_hour=$((10#$hour))
  cron_day=$((10#$day))
  cron_month=$((10#$month))

  # Skip matches already in the past
  match_epoch=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$utc_str" +%s 2>/dev/null || echo 0)
  if [[ $match_epoch -le $NOW_EPOCH ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # cron runs every year — no year field in cron, so entries stay harmlessly after the season
  CRON_LINE="$cron_min $cron_hour $cron_day $cron_month * cd \"$PROJECT_DIR\" && \"$NODE_BIN\" scripts/notify-picks.js $match_id >> \"$LOG_FILE\" 2>&1 $MARKER match#$match_id"
  NEW_ENTRIES="$NEW_ENTRIES
$CRON_LINE"
done

# ─────────────────────────────────────────────────────────────
# Merge with existing crontab (strip old IPL entries first)
# ─────────────────────────────────────────────────────────────
EXISTING=$(crontab -l 2>/dev/null | grep -v "$MARKER" || true)

{
  echo "$EXISTING"
  echo "$NEW_ENTRIES"
} | grep -v '^$' | (cat; echo "") | crontab -

ADDED=$(echo "$NEW_ENTRIES" | grep -c "$MARKER" || true)
echo "✅ Installed $ADDED cron job(s). Skipped $SKIPPED past matches."
echo ""
echo "Verify with:  crontab -l"
echo "Remove all:   bash scripts/setup-cron.sh --remove"
echo "Logs:         tail -f $LOG_FILE"
echo ""
echo "⚠️  Make sure GROUP_ID is set in scripts/notify-picks.js before match #3!"
