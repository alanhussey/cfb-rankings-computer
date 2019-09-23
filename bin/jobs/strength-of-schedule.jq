. as [$gamesByTeam] |
    $gamesByTeam |
    with_entries(
        .key as $team |
        .value as $games |
        .value = (
            $games |
            (
                map(
                    (if (.away_team == $team) then .home_team else .away_team end) as $opponent |
                    (
                        ($gamesByTeam[$opponent] // []) |
                        map(select(.home_team != $team and .away_team != $team)) |
                        map(
                            if (.winner == null) then
                                .5
                            else
                                if (.[.winner] == $opponent) then
                                    1
                                else
                                    0
                                end
                            end
                        ) | add // 0
                    )
                ) | flatten | add
            ) / (
                map(
                    (if (.away_team == $team) then .home_team else .away_team end) as $opponent |
                    (
                        ($gamesByTeam[$opponent] // []) |
                        map(select(.home_team != $team and .away_team != $team)) |
                        length
                    )
                ) | flatten | add
            )
        )
    )