import React from "react";
import Rank from "./Rank";

export default function SimpleSortRankedTeams({ teams, stats }) {
  return (
    <table className="App-ranks">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          {stats.map(({ key, name }) => (
            <th key={key}>{name}</th>
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
                return (
                  <td
                    key={key}
                    align="right"
                    style={{
                      fontWeight:
                        ((teamIndex === 0 || !needsATiebreaker) &&
                          statIndex === 0) ||
                        isTieBreaker
                          ? "bold"
                          : "normal",
                      color:
                        statIndex === 0 || isTieBreaker || needsATiebreaker
                          ? "black"
                          : "grey"
                    }}
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
