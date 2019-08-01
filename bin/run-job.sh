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

if [ -f "$SCRIPTDIR/$job.sh" ]; then
    "$SCRIPTDIR/$job.sh" "$@"
else
    if [ -f "$SCRIPTDIR/$job.js" ]; then
        "$SCRIPTDIR/$job.js" "$@"
    else
        echo "Could not find job named $job"
        exit 1
    fi
fi
