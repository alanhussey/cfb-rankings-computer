import Rank from "./Rank";
import sortBy from "lodash/sortBy";
import fromPairs from "lodash/fromPairs";
import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { FBS_TEAMS, DATA_SOURCES } from "./DataSource";

const ASCENDING = "ASC";
const DESCENDING = "DESC";

function rankBy(teams, factors) {
  const iteratees = factors.map(factor => team =>
    (factor.order === DESCENDING ? -1 : 1) * team[factor.key]
  );

  const result = sortBy(teams, iteratees).map(team => ({ ...team }));

  result.forEach((team, index) => {
    team.score = iteratees.map(iteratee => iteratee(team));
    let rank = index + 1;
    if (index > 0) {
      const previousTeam = result[index - 1];
      if (isEqual(team.score, previousTeam.score)) {
        rank = previousTeam.rank;
      }
    }
    team.rank = rank;
  });

  return result;
}

function App() {
  // All FBS teams
  const [teams, setTeams] = useState(null);
  useEffect(() => {
    FBS_TEAMS.fetch()
      .then(data => FBS_TEAMS.process(data))
      .then(data => setTeams(data));
  }, []);

  // Available data points
  const [data, setData] = useState(
    fromPairs(DATA_SOURCES.map(source => [source.key, source.initialState]))
  );
  useEffect(() => {
    if (teams != null) {
      const teamNames = Object.keys(teams);
      Promise.all(
        DATA_SOURCES.map(async source => {
          const data = await source.fetch();
          return [source.key, source.process(data, teamNames)];
        })
      ).then(data => setData(fromPairs(data)));
    }
  }, [teams]);

  // Selected data points for sorting
  const [factors /*, setFactors */] = useState([
    { key: "mascotWeight", order: DESCENDING },
    { key: "winningPercentage", order: DESCENDING }
  ]);

  // Teams with data points mixed in
  const teamsWithFactors = useMemo(() => {
    if (!teams || Object.values(data).every(isEmpty)) return;

    return Object.values(teams || {}).map(team => ({
      team,
      ...factors.reduce(
        (facts, factor) => ({
          ...facts,
          [factor.key]: data[factor.key][team.school].value
        }),
        {}
      )
    }));
  }, [teams, data, factors]);

  // Teams ranked by the selected factors
  const rankedTeams = rankBy(teamsWithFactors, factors);

  return (
    <>
      <h2>Build-a-ranking</h2>
      <p>
        Sort teams by the following factors, where each factor is a tie-breaker
        for the previous one:
      </p>
      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {DATA_SOURCES.find(source => source.key === factor.key).name} (
            {factor.order === ASCENDING
              ? "in ascending order"
              : "in descending order"}
            )
          </li>
        ))}
      </ol>
      <ol className="App-ranks">
        {rankedTeams.map(({ team, rank, ...scores }, index) => {
          return (
            <Rank key={team.school} team={team} rank={rank}>
              {index < 25 && <pre>{JSON.stringify(scores, null, 2)}</pre>}
            </Rank>
          );
        })}
      </ol>
    </>
  );
}

export default App;
