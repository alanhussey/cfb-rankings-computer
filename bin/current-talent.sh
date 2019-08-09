#!/bin/bash

set -e

SCRIPTDIR="$(
    cd "$(dirname "$0")"
    pwd -P
)"
DATADIR="$SCRIPTDIR/../data"
mkdir -p "$DATADIR"

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
    this_year_path="$DATADIR/talent/$year.json"

    if [[ ! -f "$this_year_path" ]]; then
        continue
    fi

    talent_year_available="$(jq 'length' "$this_year_path")"

    if [[ "$talent_year_available" == 0 ]]; then
        continue
    fi

    mkdir -p "$(dirname "$DATADIR/$(get_config output_path)")"

    jq "map({key: .school, value: .talent | tonumber}) | from_entries | .year = $year" \
        "$this_year_path" \
        >"$DATADIR/$(get_config output_path)"
    exit 0
done

exit 1
