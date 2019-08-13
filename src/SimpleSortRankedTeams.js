import React from "react";
import classnames from "classnames";
import Rank from "./Rank";
import { ASCENDING, DESCENDING } from "./constants";

export default function SimpleSortRankedTeams({
  teams,
  stats,
  toggleStatOrder
}) {
  return (
    <table className="App-ranks">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          {stats.map(({ key, name, order }) => (
            <th key={key}>
              <button
                className="App-rank-toggle"
                type="button"
                onClick={() => toggleStatOrder(key)}
              >
                {name}{" "}
                {
                  {
                    [ASCENDING]: "▲",
                    [DESCENDING]: "▼"
                  }[order]
                }
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {teams.map(({ team, rank, score, ...teamStats }, teamIndex) => {
          const previousTeam = teamIndex !== 0 && teams[teamIndex - 1];

          const firstStat = stats[0].key;
          let needsATiebreaker =
            !!previousTeam && teamStats[firstStat] === previousTeam[firstStat];

          return (
            <Rank key={team.school} team={team} rank={rank}>
              {stats.map(({ key, render }, statIndex) => {
                const stat = teamStats[key];

                const isTieBreaker =
                  needsATiebreaker && stat !== previousTeam[key];
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
              })}
            </Rank>
          );
        })}
      </tbody>
    </table>
  );
}
