#!/bin/bash

# really hacky job runner with dependencies

set -e

SCRIPTDIR="$(
    cd "$(dirname "$0")"
    pwd -P
)"
DATADIR="$SCRIPTDIR/../data"
mkdir -p "$DATADIR"
JOBSDIR="$SCRIPTDIR/jobs"

get_config() {
    jq ".$2" "$1" --raw-output
}

job_completed() {
    _job_path="$1"
    output_path="$(get_config "$_job_path" output_path)"

    if [ -f "$DATADIR/$output_path" ]; then
        true
    else
        false
    fi
}

# count total number of jobs
jobs_remaining=$(
    find "$JOBSDIR" -name '*.json' |
        wc -l |
        xargs
)
# reduce by the number of jobs already completed
for job_path in "$JOBSDIR"/*; do
    if job_completed "$job_path"; then
        jobs_remaining=$(bc <<<"$jobs_remaining - 1")
    fi
done

# perpetually loop over all the jobs until they've all been completed
while [ "$jobs_remaining" -ne 0 ]; do
    for job_path in "$JOBSDIR"/*; do
        if job_completed "$job_path"; then
            continue
        fi

        # check if this job has dependencies, and if so,
        # check that all its dependencies are completed
        count_deps="$(jq '.dependencies | length' "$job_path")"
        if [ "$count_deps" != 0 ]; then
            deps="$(jq '.dependencies | .[]' "$job_path" --raw-output)"
            for dep in $deps; do
                dep_job_path="$(dirname "$job_path")/$dep.json"
                if job_completed "$dep_job_path"; then
                    count_deps=$(bc <<<"$count_deps - 1")
                fi
            done

            # some dependencies are not yet done, so this job cannot be run yet
            if [ "$count_deps" -ne "0" ]; then
                continue
            fi
        fi

        (
            export SCRIPTDIR="$SCRIPTDIR"
            export DATADIR="$DATADIR"
            export JOBSDIR="$JOBSDIR"
            "$SCRIPTDIR/run-job.sh" "$job_path"
        )
        jobs_remaining=$(bc <<<"$jobs_remaining - 1")
    done
done

echo "jobs done"
