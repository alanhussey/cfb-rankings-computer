#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

all_rankings="$(
    curl \
        -X GET "https://api.collegefootballdata.com/rankings?year=$SEASON" \
        -H "accept: application/json" \
        2>/dev/null
)"

poll_weeks_available="$(
    echo "$all_rankings" | jq 'length'
)"

if [[ "$poll_weeks_available" == 0 ]]; then
    exit 1
fi

current_polls_available="$(
    echo "$all_rankings" |
        jq 'max_by(.week).polls | map(.poll)'
)"

if [[ "$(echo "$current_polls_available" | jq 'length')" -eq 0 ]]; then
    echo "No polls available for $SEASON season"
    exit 1
fi

mkdir -p "$(dirname "$DATADIR/$(get_config output_path)")"

sort_polls_jq_pipeline=".polls = (.polls | sort_by(.poll) | map(.ranks = (.ranks | sort_by(.rank))))"

echo "$all_rankings" |
    jq "max_by(.week) | $sort_polls_jq_pipeline" \
        >"$DATADIR/$(get_config output_path)"
exit 0
