#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

category="$(get_config category)"
stat_key="$(get_config stat_key)"
output_path="$DATADIR/$(get_config output_path)"

mkdir -p "$(dirname "$output_path")"

# TODO don't hard-code this stat_key, do parse time-of-possession somehow
if [[ "$stat_key" == "AvgTOP" ]]; then
    jq_pipeline="map({key: .Team, value: .[\"$stat_key\"]}) | from_entries"
else
    jq_pipeline="map({key: .Team, value: .[\"$stat_key\"] | gsub(\",\"; \"\") | tonumber}) | from_entries"
fi

"$SCRIPTDIR/download-ncaa-stat.js" "$category" | jq "$jq_pipeline" >"$output_path"

if [ ! "$(wc -c <"$output_path" | xargs)" -ge 10 ]; then
    echo "No output generated for $output_path"
    exit 1
fi
