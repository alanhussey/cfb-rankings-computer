import React from "react";
import classnames from "classnames";
import get from "lodash/get";
import Ranks from "./Ranks";
import { ORDER_ARROW } from "./constants";
import Button from "./Button";

export default function SimpleSortRankedTeams({
  teams,
  stats,
  toggleStatOrder
}) {
  return (
    <Ranks
      headers={stats.map(({ key, name, order }) => (
        <th key={key}>
          <Button onClick={() => toggleStatOrder(key)}>
            {name}&nbsp;{ORDER_ARROW[order]}
          </Button>
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
