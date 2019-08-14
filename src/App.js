import fromPairs from "lodash/fromPairs";
import isEmpty from "lodash/isEmpty";
import uniqBy from "lodash/uniqBy";
import sample from "lodash/sample";
import get from "lodash/get";
import React, { useState, useEffect, useMemo } from "react";

import { FBS_TEAMS, DATA_SOURCES } from "./DataSource";
import SimpleSort from "./SimpleSort";
import EquationEditor from "./EquationEditor";
import "./App.css";

const RANKING_SYSTEMS = [
  { id: "simple-sort", name: "Simple sort" },
  { id: "equation", name: "Score" }
];

const TAGLINE = sample([
  "Bring Your Own Bias",
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

  const [system, setSystem] = useState("simple-sort");

  const SystemComp =
    {
      "simple-sort": SimpleSort,
      equation: EquationEditor
    }[system] || (() => <h2>Uh oh</h2>);

  return (
    <>
      <header>
        <h1>rankings.computer</h1>
        <small>{TAGLINE}</small>
      </header>
      <main>
        <label>
          Choose your ranking system:
          <select
            value={system}
            onChange={event => setSystem(event.target.value)}
          >
            {RANKING_SYSTEMS.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <h2>{RANKING_SYSTEMS.find(({ id }) => id === system).name}</h2>
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
