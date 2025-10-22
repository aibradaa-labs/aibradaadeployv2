#!/usr/bin/env bash
set -euo pipefail
FORCE_RECOMPUTE="${1:-false}"
RECRAWL_PRICES="${2:-false}"
REASON="${3:-manual run}"
echo "[manual_fetch] force_recompute=$FORCE_RECOMPUTE recrawl_prices=$RECRAWL_PRICES reason='$REASON'"
node ./scripts/fetch/auto/fetch_prices.js
node ./scripts/validate/validator.js
# TODO: ranking, windowing, snapshot, report
