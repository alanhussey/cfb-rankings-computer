#!/bin/bash

set -e

get_config() {
    jq ".[\"$2\"]" "$1" --raw-output
}

get_output_path() {
    echo "$DATADIR/$(get_config "$1" output_path)"
}

output_path="$(get_output_path "$1")"

pipeline="$(get_config "$1" pipeline)"
pipeline_file="$(get_config "$1" "pipeline-file")"

input_files="$(
    for dep in $(jq '(.dependencies + []) | .[]' "$1" --raw-output); do
        get_output_path "$(dirname "$1")/$dep.json"
    done
)"

if [[ "$pipeline_file" != "null" ]]; then
    jq \
        --from-file "$(dirname "$1")/$pipeline_file" \
        --slurp $input_files >"$output_path"
else
    jq \
        "$pipeline" \
        --slurp $input_files >"$output_path"
fi
