#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

this_year=$(date +"%Y")
last_year=$(bc <<<"$this_year - 1")

# Handle two cases:
# 1. Too early in the season to have rankings (use last year's)
# 2. It's after January 1
for year in $this_year $last_year; do
    this_year_path="$DATADIR/rankings/$year.json"

    if [[ ! -f "$this_year_path" ]]; then
        continue
    fi

    poll_weeks_available="$(jq 'length' "$this_year_path")"

    if [[ "$poll_weeks_available" == 0 ]]; then
        continue
    fi

    current_polls_available="$(
        jq 'max_by(.week).polls | map(.poll) | sort | .[]' \
            --raw-output \
            "$this_year_path"
    )"
    expected_polls="$(
        cat <<EOF
AP Top 25
Coaches Poll
Playoff Committee Rankings
EOF
    )"

    if [[ "$current_polls_available" != "$expected_polls" ]]; then
        echo "$current_polls_available"
        echo "$expected_polls"
        continue
    fi

    mkdir -p "$(dirname "$DATADIR/$(get_config output_path)")"

    jq "max_by(.week) | .year = $year" \
        "$this_year_path" \
        >"$DATADIR/$(get_config output_path)"
    exit 0
done

exit 1
