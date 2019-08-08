import sortBy from "lodash/sortBy";
import orderBy from "lodash/orderBy";
import fromPairs from "lodash/fromPairs";
import groupBy from "lodash/groupBy";
import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import React, { useState, useEffect, useMemo } from "react";
import { FBS_TEAMS, DATA_SOURCES, CATEGORIES } from "./DataSource";
import RankedTeams from "./RankedTeams";
import "./App.css";

const ASCENDING = "asc";
const DESCENDING = "desc";

const shallowCopy = obj => ({ ...obj });

function rankBy(teams, factors) {
  const result = orderBy(
    teams,
    factors.map(factor => factor.key),
    factors.map(factor => factor.order)
  ).map(shallowCopy);

  result.forEach((team, index) => {
    team.score = factors.map(factor => team[factor.key]);

    const previousTeam = result[index - 1];
    const rank =
      index > 0 && isEqual(team.score, previousTeam.score)
        ? previousTeam.rank
        : index + 1;

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

  // Selected data points for sorting
  const [factors, setFactors] = useState([
    { key: "mascotWeight", order: DESCENDING },
    { key: "winningPercentage", order: DESCENDING }
  ]);

  // Available data points
  const [dataSources, setDataSources] = useState(
    fromPairs(DATA_SOURCES.map(source => [source.key, source.initialState]))
  );
  useEffect(() => {
    async function fetchSources() {
      const teamNames = Object.keys(teams);
      const selectedSources = factors.map(factor => factor.key);

      const fetchedSources = await Promise.all(
        DATA_SOURCES.filter(source => selectedSources.includes(source.key)).map(
          async source => {
            const data = await source.fetch();
            return [source.key, source.process(data, teamNames)];
          }
        )
      );

      setDataSources(fromPairs(fetchedSources));
    }

    if (teams != null) fetchSources();
  }, [factors, teams]);

  // Teams with data points mixed in
  const teamsWithFactors = useMemo(() => {
    // Early-out if we don't have all the data we need yet
    if (!teams || factors.some(factor => isEmpty(dataSources[factor.key])))
      return;

    return Object.values(teams || {}).map(team => ({
      team,
      ...fromPairs(
        factors.map(factor => [
          factor.key,
          dataSources[factor.key][team.school].value
        ])
      )
    }));
  }, [teams, dataSources, factors]);

  // Teams ranked by the selected factors
  const rankedTeams = rankBy(teamsWithFactors, factors);
  const stats = factors.map(factor => {
    const source = DATA_SOURCES.find(source => source.key === factor.key);
    return {
      key: factor.key,
      name: source.name,
      render: value => source.render(value)
    };
  });

  return (
    <>
      <h1> Build-a-ranking </h1>
      <h2>Simple sort</h2>
      <p>The easiest way to build your own computer poll.</p>
      <p>
        Select one or more of the following statistics. Teams will be sorted by
        each factor, using the next factor as a tie-breaker if needed.
      </p>
      <p>Selected statistics:</p>
      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {factors.length > 1 && (
              <button
                onClick={() =>
                  setFactors(factors.filter(f => f.key !== factor.key))
                }
              >
                -
              </button>
            )}
            {DATA_SOURCES.find(source => source.key === factor.key).name} (
            {factor.order === ASCENDING
              ? "in ascending order"
              : "in descending order"}
            )
          </li>
        ))}
      </ol>
      <p>Available statistics:</p>
      <ul>
        {sortBy(
          Object.entries(groupBy(DATA_SOURCES, source => source.category)),
          ([category]) => CATEGORIES.indexOf(category)
        ).map(([category, sources]) => (
          <li key={category}>
            <strong>{category}</strong> <br />
            <ol>
              {sources.map(source => (
                <li key={source.key}>
                  <button
                    disabled={
                      !!factors.find(factor => factor.key === source.key)
                    }
                    onClick={() =>
                      setFactors([
                        ...factors,
                        { key: source.key, order: source.defaultOrder }
                      ])
                    }
                  >
                    +
                  </button>
                  {source.name}
                  {source.description && `: ${source.description}`}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>

      <RankedTeams teams={rankedTeams} stats={stats} />
    </>
  );
}

export default App;
