#!/usr/bin/env bash
# Lightweight telemetry logger — invoked by other hooks to record events.
# Usage: telemetry-log.sh <event-type> <name> [result] [latency_ms]
# Silently no-ops if DW_NO_TELEMETRY=1 or .dw/metrics unavailable.

set -e

if [ "${DW_NO_TELEMETRY:-}" = "1" ] || [ "${DW_NO_TELEMETRY:-}" = "true" ]; then
  exit 0
fi

EVENT_TYPE="${1:-unknown}"
NAME="${2:-unknown}"
RESULT="${3:-}"
LATENCY="${4:-}"

METRICS_DIR=".dw/metrics"
EVENTS_FILE="$METRICS_DIR/events.jsonl"

if [ ! -d "$METRICS_DIR" ]; then
  mkdir -p "$METRICS_DIR" 2>/dev/null || exit 0
fi

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_HASH=$(echo "$$:${CLAUDE_SESSION_ID:-default}" | sha256sum 2>/dev/null | cut -c1-8 || echo "unknown")

JSON="{\"ts\":\"$TS\",\"session\":\"$SESSION_HASH\",\"event\":\"$EVENT_TYPE\",\"name\":\"$NAME\""
[ -n "$RESULT" ] && JSON="$JSON,\"result\":\"$RESULT\""
[ -n "$LATENCY" ] && JSON="$JSON,\"latency_ms\":$LATENCY"
JSON="$JSON}"

echo "$JSON" >> "$EVENTS_FILE" 2>/dev/null || true

exit 0
