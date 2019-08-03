import React from "react";
import Rank from "./Rank";

export default function RankedTeams({ teams, stats }) {
  return (
    <table className="App-ranks">
      <thead>
        <th>Rank</th>
        <th>Team</th>
        {stats.map(({ key, name }) => (
          <th key={key}>{name}</th>
        ))}
      </thead>
      <tbody>
        {teams.map(({ team, rank, score, ...scores }, index) => (
          <Rank key={team.school} team={team} rank={rank}>
            {stats.map(({ key, render }) => (
              <td key={key} align="right">
                {render(scores[key])}
              </td>
            ))}
          </Rank>
        ))}
      </tbody>
    </table>
  );
}
