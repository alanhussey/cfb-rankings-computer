#!/bin/bash

set -e

SCRIPTDIR="$(
    cd "$(dirname "$0")"
    pwd -P
)"
DATADIR="$SCRIPTDIR/../data"

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

url=$(get_config url)
output_path=$(get_config output_path)

mkdir -p "$(dirname "$DATADIR/$output_path")"

curl \
    -X GET "https://api.collegefootballdata.com$url" \
    -H "accept: application/json" \
    -o "$DATADIR/$output_path" \
    2>/dev/null
