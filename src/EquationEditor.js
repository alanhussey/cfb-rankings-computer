import React, { useEffect } from "react";
import { DATA_SOURCES } from "./DataSource";
import Rank from "./Rank";
import rankBy from "./rankBy";
import { DESCENDING } from "./constants";

const DEFAULT_SCORING_FN = team =>
  ((team.totalOffense - team.totalDefense) / team.totalOffense) *
  team.winningPercentage;

export default function EquationEditor({
  factors,
  setFactors,
  teams: teamsWithFactors
}) {
  useEffect(() => {
    setFactors(
      [
        ...DATA_SOURCES.filter(source => source.name.startsWith("Total ")),
        ...DATA_SOURCES.filter(source => source.name.startsWith("Winning "))
      ].map(source => ({ key: source.key, order: source.defaultOrder }))
    );
  }, [setFactors]);

  // Teams ranked by the selected factors
  const teams = rankBy(teamsWithFactors, [
    {
      key: DEFAULT_SCORING_FN,
      order: DESCENDING
    }
  ]);
  const render = !!(window.Intl && Intl.NumberFormat)
    ? new Intl.NumberFormat().format
    : value => value.toFixed(3);
  return (
    <>
      <p>Selected statistics:</p>

      <pre>{DEFAULT_SCORING_FN.toString()}</pre>

      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {DATA_SOURCES.find(source => source.key === factor.key).name}
          </li>
        ))}
      </ol>
      <table className="App-ranks">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(({ team, rank, score, ...teamStats }) => (
            <Rank key={team.school} team={team} rank={rank}>
              <td>{render(score)}</td>
            </Rank>
          ))}
        </tbody>
      </table>
    </>
  );
}
