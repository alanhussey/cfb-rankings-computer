#!/bin/bash

set -e

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

url=$(get_config url)
output_path=$(get_config output_path)

mkdir -p "$(dirname "$DATADIR/$output_path")"

curl \
    -X GET "https://api.collegefootballdata.com$url?year=$SEASON" \
    -H "accept: application/json" \
    -o "$DATADIR/$output_path" \
    2>/dev/null
