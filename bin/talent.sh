#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

talent="$(
    curl \
        -X GET "https://api.collegefootballdata.com/talent?year=$SEASON" \
        -H "accept: application/json" \
        2>/dev/null
)"

talent_teams_count="$(echo "$talent" | jq 'length')"

if [[ "$talent_teams_count" == 0 ]]; then
    echo "    No talent found for the $SEASON season"
fi

echo "$talent" |
    jq "map({key: .school, value: .talent | tonumber}) | from_entries" \
        >"$DATADIR/$(get_config output_path)"
exit 0
