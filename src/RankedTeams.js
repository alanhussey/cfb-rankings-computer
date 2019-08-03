import React from "react";
import Rank from "./Rank";

export default function RankedTeams({ teams }) {
  return (
    <table className="App-ranks">
      <thead>
        <th>Rank</th>
        <th>Team</th>
        <th>Stats</th>
      </thead>
      <tbody>
        {teams.map(({ team, rank, score, ...scores }, index) => (
          <Rank key={team.school} team={team} rank={rank}>
            {index < 25 &&
              Object.entries(scores).map(([key, value]) => (
                <p key={key}>
                  {key}: {value}
                </p>
              ))}
          </Rank>
        ))}
      </tbody>
    </table>
  );
}
