#!/bin/bash

set -e

SCRIPTDIR="$(
    cd "$(dirname "$0")"
    pwd -P
)"

config_path=$1
get_config() {
    jq ".$1" "$config_path" --raw-output
}

job=$(get_config job)

echo "Running $job for config $config_path"

"$SCRIPTDIR/$job.sh" "$@"
