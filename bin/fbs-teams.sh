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

all_teams_path="$DATADIR/$(get_config "$SCRIPTDIR/jobs/all-teams.json" output_path)"
fbs_teams_path="$DATADIR/$(get_config "$1" output_path)"

count_fbs_teams="$(
    jq 'map(select(.conference)) | length' \
        "$all_teams_path"
)"

if [[ "$count_fbs_teams" -ne "130" ]]; then
    echo "Expected 130 FBS teams but got $count_fbs_teams"
    exit 1
fi

mkdir -p "$(dirname "$fbs_teams_path")"

jq 'map(select(.conference)) | map({key: .school, value: .}) | from_entries' "$all_teams_path" >"$fbs_teams_path"
