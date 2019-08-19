import React from "react";
import classnames from "classnames";
import Ranks from "./Ranks";
import get from "lodash/get";
import { ASCENDING, DESCENDING } from "./constants";

export default function SimpleSortRankedTeams({
  teams,
  stats,
  toggleStatOrder
}) {
  return (
    <Ranks
      headers={stats.map(({ key, name, order }) => (
        <th key={key}>
          <button
            className="App-rank-toggle"
            type="button"
            onClick={() => toggleStatOrder(key)}
          >
            {name}&nbsp;
            {
              {
                [ASCENDING]: "▲",
                [DESCENDING]: "▼"
              }[order]
            }
          </button>
        </th>
      ))}
      teams={teams.map(({ team, rank, score, ...teamStats }, teamIndex) => {
        const previousTeam = teamIndex !== 0 && teams[teamIndex - 1];

        const firstStat = get(stats, [0, "key"]);
        let needsATiebreaker =
          !!firstStat &&
          !!previousTeam &&
          teamStats[firstStat] === previousTeam[firstStat];

        return {
          team,
          rank,
          columns: stats.map(({ key, render }, statIndex) => {
            const stat = teamStats[key];

            const isTieBreaker = needsATiebreaker && stat !== previousTeam[key];
            if (isTieBreaker) {
              needsATiebreaker = false;
            }
            const isMostSignificantStat =
              ((teamIndex === 0 || !needsATiebreaker) && statIndex === 0) ||
              isTieBreaker;
            const isInsignificant =
              statIndex === 0 || isTieBreaker || needsATiebreaker;
            return (
              <td
                key={key}
                className={classnames({
                  "Stat--most-significant": isMostSignificantStat,
                  "Stat--insignificant": isInsignificant
                })}
              >
                {render(stat)}
              </td>
            );
          })
        };
      })}
    />
  );
}
