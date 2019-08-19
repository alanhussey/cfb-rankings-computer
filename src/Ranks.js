import React from "react";
import classnames from "classnames";
import Rank from "./Rank";

export default function Ranks({ headers, teams }) {
  return (
    <div
      className={classnames("Ranks", {
        "Ranks--full-width": headers.length > 1
      })}
    >
      <table className="Ranks--table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            {headers}
          </tr>
        </thead>
        <tbody>
          {teams.map(({ team, rank, columns }) => (
            <Rank key={team.school} team={team} rank={rank}>
              {columns}
            </Rank>
          ))}
        </tbody>
      </table>
    </div>
  );
}
