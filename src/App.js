import fromPairs from "lodash/fromPairs";
import isEmpty from "lodash/isEmpty";
import uniqBy from "lodash/uniqBy";
import sample from "lodash/sample";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import React, { useState, useEffect, useMemo } from "react";
import classnames from "classnames";

import { FBS_TEAMS, DATA_SOURCES } from "./DataSource";
import SimpleSort from "./SimpleSort";
import EquationEditor from "./EquationEditor";
import "./App.css";

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

function App() {
  // All FBS teams
  const [teams, setTeams] = useState(null);
  useEffect(() => {
    FBS_TEAMS.fetch()
      .then(data => FBS_TEAMS.process(data))
      .then(data => setTeams(data));
  }, []);

  // Selected data points for sorting
  const [factors, setFactors] = useState([]);
  const addFactors = f => setFactors(uniqBy([...factors, ...f], "key"));

  // Available data points
  const [dataSources, setDataSources] = useState(
    fromPairs(DATA_SOURCES.map(source => [source.key, null]))
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
      return [];

    return Object.values(teams).map(team => ({
      team,
      ...fromPairs(
        factors.map(factor => [
          factor.key,
          get(dataSources, [factor.key, team.school, "value"], null)
        ])
      )
    }));
  }, [teams, dataSources, factors]);

  const [rankingSystem, setRankingSystem] = useState("");

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
