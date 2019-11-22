import fromPairs from "lodash/fromPairs";
import uniqBy from "lodash/uniqBy";
import sample from "lodash/sample";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import range from "lodash/range";
import React, { useState, useEffect, useMemo, useReducer } from "react";
import classnames from "classnames";

import { FBS_TEAMS, DATA_SOURCES } from "./DataSource";
import SimpleSort from "./SimpleSort";
import EquationEditor from "./EquationEditor";
import "./App.css";
import URLSearchParamsSchema from "./URLSearchParamsSchema";

const EloPlaceholder = () => <p>Coming soon.</p>;

const RANKING_SYSTEMS = [
  { id: "simple-sort", name: "Simple sort", Component: SimpleSort },
  { id: "equation", name: "Score", Component: EquationEditor },
  { id: "elo", name: "Elo", Component: EloPlaceholder }
];
const RANKING_SYSTEMS_BY_ID = keyBy(RANKING_SYSTEMS, "id");

const TAGLINE = sample([
  "Bring Your Own Bias",
  "Bring your own bias",
  "Computers ain't played nobody, PAAAWWWWLLLLLL!",
  "Shut up, nerd",
  "I bet you can't make a ranking worse than the CFP",
  "Finally, a ranking worse than the CFP",
  "Proving once and for all that computers hate your team"
]);

const searchParamsSchema = new URLSearchParamsSchema({
  system: String,
  season: Number
});

const getQueryParam = (param, defaultValue = null) =>
  searchParamsSchema.decodeURL(document.location)[param] || defaultValue;

const NOW = new Date();
const FIRST_SEASON = 2018;
const CURRENT_SEASON =
  // Last year if we're currently in the first half of this year
  NOW.getFullYear() + (NOW.getMonth() <= 6 ? -1 : 0);
const SEASONS = range(FIRST_SEASON, CURRENT_SEASON + 1);

const initialDataSources = fromPairs(
  DATA_SOURCES.map(source => [
    source.key,
    { loading: false, error: null, data: null }
  ])
);

function App() {
  const [season, setSeason] = useState(getQueryParam("season", CURRENT_SEASON));

  // All FBS teams
  const [teams, setTeams] = useState(null);
  useEffect(() => {
    FBS_TEAMS.fetch({ season })
      .then(data => FBS_TEAMS.process(data))
      .then(data => setTeams(data));
  }, [season]);

  // Selected data points for sorting
  const [factors, setFactors] = useState([]);
  const addFactors = f => setFactors(uniqBy([...factors, ...f], "key"));

  // Available data points
  const [dataSources, dispatch] = useReducer((state, action) => {
    const key = get(action, "source.key", null);

    switch (action.type) {
      case "fetching":
        return {
          ...state,
          [key]: {
            ...(state[key] || {}),
            loading: true,
            error: null,
            data: null
          }
        };

      case "fetched":
        return {
          ...state,
          [key]: {
            ...(state[key] || {}),
            loading: false,
            error: null,
            data: action.data
          }
        };

      case "failed":
        return {
          ...state,
          [key]: {
            ...(state[key] || {}),
            loading: false,
            error: action.error,
            data: null
          }
        };

      default:
        return state;
    }
  }, initialDataSources);

  useEffect(() => {
    async function fetchSources() {
      const teamNames = Object.keys(teams);
      const selectedSources = factors.map(factor => factor.key);

      const desiredDataSources = DATA_SOURCES.filter(source =>
        selectedSources.includes(source.key)
      );
      desiredDataSources.forEach(async source => {
        const dataSource = dataSources[source.key];
        if (dataSource.loading || dataSource.data != null) return;

        dispatch({ type: "fetching", source });
        try {
          const data = await source.fetch({ season });
          dispatch({
            type: "fetched",
            source,
            data: source.process(data, teamNames)
          });
        } catch (error) {
          dispatch({ type: "failed", source, error });
        }
      });
    }

    if (teams != null) fetchSources();
  }, [dataSources, factors, season, teams]);

  // Teams with data points mixed in
  const teamsWithFactors = useMemo(() => {
    // Early-out if we don't have all the data we need yet
    if (!teams || factors.some(factor => dataSources[factor.key] == null))
      return [];

    return Object.values(teams).map(team => ({
      team,
      ...fromPairs(
        factors.map(factor => [
          factor.key,
          get(
            dataSources,
            [factor.key, "data", "forTeam", team.school, "value"],
            dataSources[factor.key].defaultValue
          )
        ])
      )
    }));
  }, [teams, dataSources, factors]);

  const [rankingSystem, setRankingSystem] = useState(
    getQueryParam("system", "")
  );

  const SystemComp = get(
    RANKING_SYSTEMS_BY_ID,
    [rankingSystem, "Component"],
    () => null
  );

  return (
    <>
      <header>
        <h1>rankings.computer</h1>
        <small>{TAGLINE}</small>
      </header>
      <main>
        <label style={{ float: "right" }}>
          Season{" "}
          <select
            value={season}
            onChange={event => setSeason(Number(event.target.value))}
          >
            {[...SEASONS].reverse().map(year => (
              <option key={year} value={year}>
                {year}-{year + 1}
              </option>
            ))}
          </select>
        </label>

        <h2>Build your own computer ranking</h2>
        <label>Choose your ranking system:</label>

        <div>
          {RANKING_SYSTEMS.map(({ id, name }) => (
            <label
              key={id}
              className={classnames("Select Select--ranking-system", {
                "Select--selected": id === rankingSystem
              })}
            >
              <input
                key={id}
                onChange={event => setRankingSystem(event.target.value)}
                type="radio"
                value={id}
                checked={id === rankingSystem}
              />
              {name}
            </label>
          ))}
        </div>

        <SystemComp
          factors={factors}
          setFactors={setFactors}
          addFactors={addFactors}
          teams={teamsWithFactors}
        />
      </main>
      <footer />
    </>
  );
}

export default App;
