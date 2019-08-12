#!/bin/bash

set -e

SCRIPTDIR="$(
    cd "$(dirname "$0")"
    pwd -P
)"
DATADIR="$SCRIPTDIR/../data"

get_config() {
    jq ".$2" "$1" --raw-output
}

get_output_path() {
    echo "$DATADIR/$(get_config "$1" output_path)"
}

output_path="$(get_output_path "$1")"
fbs_teams_path="$(get_output_path "$SCRIPTDIR/jobs/fbs-teams.json")"
wins_losses_ties_paths="$(
    for job in $(get_config "$1" dependencies | jq '.[]' --raw-output); do
        get_output_path "$SCRIPTDIR/jobs/$job.json"
    done
)"

count_expected_teams="$(
    jq "to_entries | length" "$fbs_teams_path"
)"

# takes an array of objects, turns them into entries, flattens into one array, then reduces by summing the values for each key
sum_input_objects="map(to_entries) | flatten | reduce .[] as \$item ({}; . + {(\$item.key): (.[(\$item.key)] + \$item.value)})"

count_actual_teams="$(
    jq "$sum_input_objects | to_entries | length" \
        --slurp \
        $wins_losses_ties_paths
)"

if [[ "$count_expected_teams" -gt "$count_actual_teams" ]]; then
    echo "Expected at least $count_expected_teams teams but got $count_actual_teams"
    exit 1
fi

jq "$sum_input_objects" \
    --slurp \
    $wins_losses_ties_paths \
    >"$output_path"
