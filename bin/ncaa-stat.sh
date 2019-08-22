#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".[\"$1\"]" "$config_path" --raw-output
}

category="$(get_config category)"
stat_key="$(get_config stat_key)"
output_path="$DATADIR/$(get_config output_path)"

mkdir -p "$(dirname "$output_path")"

# TODO don't hard-code this stat_key, do parse time-of-possession somehow
if [[ "$stat_key" == "AvgTOP" ]]; then
    time_to_number='(. / ":") | map(tonumber) | .[0] + (.[1] / 60)'
    jq_pipeline="map({key: .Team, value: (.[\"$stat_key\"] | $time_to_number)}) | from_entries"
else
    jq_pipeline="map({key: .Team, value: .[\"$stat_key\"] | gsub(\",\"; \"\") | tonumber}) | from_entries"
fi

"$SCRIPTDIR/download-ncaa-stat.js" "$category" "$SEASON" | jq "$jq_pipeline" >"$output_path"
