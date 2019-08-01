import minBy from "lodash/minBy";
import sortBy from "lodash/sortBy";
import mapValues from "lodash/mapValues";
import fromPairs from "lodash/fromPairs";
import isEqual from "lodash/isEqual";
import React, { useState, useEffect } from "react";
import { luminance } from "./color";
import "./App.css";

function Rank({ team, rank, children }) {
  const { school, mascot, logos, color, alt_color } = team;

  const colors = [color || "#000000", alt_color || "#ffffff"];
  const darkestColor = minBy(colors, luminance);

  return (
    <li key={school}>
      {rank}.
      <img src={logos[0]} alt="" width="24" />
      {school}{" "}
      <span style={{ color: darkestColor, fontStyle: "italic" }}>{mascot}</span>
      <br />
      {children}
    </li>
  );
}

function PollRanks({ poll, ranks, teams }) {
  return (
    <ol className="App-ranks">
      {sortBy(ranks, "rank").map(rank => (
        <Rank key={rank.school} team={teams[rank.school]} rank={rank.rank}>
          {["Coaches Poll", "AP Top 25"].includes(poll)
            ? rank.firstPlaceVotes
              ? `${rank.points} points (${rank.firstPlaceVotes} 1ﬆ place votes)`
              : `${rank.points} points`
            : ""}
        </Rank>
      ))}
    </ol>
  );
}

class DataSource {
  constructor({ name, key, description = "", id, initialState = null }) {
    Object.assign(this, {
      name,
      key,
      description,
      id,
      initialState
    });
  }
  fetch() {
    return Promise.reject(
      new TypeError(`${this.constructor} does not implement \`fetch\``)
    );
  }
  process(data) {
    return data;
  }
}

class FetchDataSource extends DataSource {
  constructor(options) {
    super(options);
    this.href = `/data/${options.href}`;
    if (options.process) {
      this.process = options.process;
    }
  }
  fetch() {
    return fetch(this.href).then(response => response.json());
  }
}

const FBS_TEAMS = new FetchDataSource({
  name: "All FBS teams",
  key: "fbsTeams",
  href: "fbs-teams.json",
  initialState: {}
});
const CURRENT_RANKINGS = new FetchDataSource({
  name: "Most recent polls",
  key: "currentRankings",
  href: "rankings/current.json",
  initialState: { polls: [] }
});

const DATA_SOURCES = [
  new FetchDataSource({
    name: "Random",
    key: "random",
    description:
      "Each team is given a random score, updated on every page refresh",
    // this is a hack, figure out a better way to get a list of every team
    href: "mascot-weights.json",
    process(data) {
      const values = mapValues(data, Math.random);
      const ranks = sortBy(Object.values(values)).reverse();
      return mapValues(data, (_, key) => ({
        value: values[key],
        rank: ranks.indexOf(values[key]) + 1
      }));
    }
  }),
  new FetchDataSource({
    name: "Mascot weights",
    key: "mascotWeight",
    description:
      "Per Jon Bois and SBNation https://www.youtube.com/watch?v=obtRtrk42a8",
    href: "mascot-weights.json",
    initialState: {
      teams: {},
      weights: []
    },
    process(data) {
      const weights = sortBy(Object.values(data), n => -n);
      return mapValues(data, weight => ({
        value: Number(weight), // parse `"Infinity"`
        rank: weights.indexOf(weight) + 1
      }));
    }
  })
];

const ALL_DATA_SOURCES = [...DATA_SOURCES, FBS_TEAMS, CURRENT_RANKINGS];

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
  const [data, setData] = useState(
    fromPairs(ALL_DATA_SOURCES.map(source => [source.key, source.initialState]))
  );
  console.log(data);
  const [factors, setFactors] = useState([
    { key: "mascotWeight", order: DESCENDING },
    { key: "random", order: ASCENDING }
  ]);

  useEffect(() => {
    Promise.all(
      ALL_DATA_SOURCES.map(source =>
        source.fetch().then(data => [source.key, source.process(data)])
      )
    ).then(data => setData(fromPairs(data)));
  }, []);

  const { fbsTeams, currentRankings } = data;
  const { polls } = currentRankings;

  const teams = Object.values(fbsTeams).map(team => ({
    team,
    ...factors.reduce(
      (facts, factor) => ({
        ...facts,
        [factor.key]: data[factor.key][team.school].value
      }),
      {}
    )
  }));

  return (
    <div style={{ columns: "300px 3" }}>
      <div style={{ breakInside: "avoid" }}>
        <h2>Build-a-ranking</h2>
        <p>
          Sort teams by the following factors, where each factor is a
          tie-breaker for the previous one:
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
          {rankBy(teams, factors).map(({ team, rank, ...scores }, index) => {
            return (
              <Rank key={team.school} team={team} rank={rank}>
                {index < 25 && <pre>{JSON.stringify(scores, null, 2)}</pre>}
              </Rank>
            );
          })}
        </ol>
      </div>

      {polls.map(({ poll, ranks }) => (
        <div style={{ breakInside: "avoid" }} key={poll}>
          <h3>{poll}</h3>
          <p>
            {currentRankings.season} week {currentRankings.week}
          </p>
          <PollRanks poll={poll} ranks={ranks} teams={fbsTeams} />
        </div>
      ))}
    </div>
  );
}

export default App;
