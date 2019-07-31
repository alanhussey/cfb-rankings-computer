import minBy from "lodash/minBy";
import sortBy from "lodash/sortBy";
import mapValues from "lodash/mapValues";
import React, { useState, useEffect } from "react";
import { luminance } from "./color";
import "./App.css";

function Rank({ team, rank, children }) {
  const { school, mascot, logos, color, alt_color } = team;

  const colors = [color || "#000000", alt_color || "#ffffff"];
  const darkestColor = minBy(colors, luminance);

  return (
    <li key={school}>
      {rank.rank}.
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
        <Rank key={rank.school} team={teams[rank.school]} rank={rank}>
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
  constructor(options) {
    this.name = options.name;
    this.description = options.description || "";
    this.id = options.id;
    this.initialState = options.initialState || null;
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

const DATA_SOURCES = {
  fbsTeams: new FetchDataSource({
    name: "All FBS teams",
    href: "fbs-teams.json",
    initialState: {}
  }),
  currentRankings: new FetchDataSource({
    name: "Most recent polls",
    href: "rankings/current.json",
    initialState: { polls: [] }
  }),
  mascotWeights: new FetchDataSource({
    name: "Mascot weights",
    description:
      "Per Jon Bois and SBNation https://www.youtube.com/watch?v=obtRtrk42a8",
    href: "mascot-weights.json",
    initialState: {
      teams: {},
      weights: []
    },
    process(data) {
      const weights = sortBy(Object.values(data), n => -n);
      return {
        teams: mapValues(data, weight => ({
          weight: Number(weight), // parse `"Infinity"`
          rank: weights.indexOf(weight) + 1
        }))
      };
    }
  })
};

function App() {
  const [state, setState] = useState({
    data: mapValues(DATA_SOURCES, source => source.initialState)
  });

  useEffect(() => {
    Promise.all(
      Object.entries(DATA_SOURCES).map(([key, source]) =>
        source.fetch().then(data => [key, source.process(data)])
      )
    ).then(data => setState({ data: Object.fromEntries(data) }));
  }, []);

  const { mascotWeights, fbsTeams, currentRankings } = state.data;
  const { polls } = currentRankings;
  return (
    <div style={{ columns: "300px 3" }}>
      <div style={{ "break-inside": "avoid" }}>
        <h2>{DATA_SOURCES.mascotWeights.name}</h2>
        <p>{DATA_SOURCES.mascotWeights.description}</p>
        <ol className="App-ranks">
          {sortBy(
            Object.values(fbsTeams),
            team => -mascotWeights.teams[team.school].weight
          )
            .slice(0, 25)
            .map(team => {
              const { weight } = mascotWeights.teams[team.school];
              return (
                <Rank
                  key={team.school}
                  team={team}
                  rank={{ rank: mascotWeights.teams[team.school].rank }}
                >
                  {Number.isFinite(weight) ? (
                    `${
                      weight > 100
                        ? `${weight}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        : weight
                    } lbs`
                  ) : (
                    <em>Unknowable</em>
                  )}
                </Rank>
              );
            })}
          <small>
            Also receiving votes:
            <br />
            {sortBy(
              Object.values(fbsTeams),
              team => -mascotWeights.teams[team.school].weight
            )
              .slice(25, 30)
              .map(
                team =>
                  `${team.school} ${team.mascot} (${
                    mascotWeights.teams[team.school].weight
                  } lbs)`
              )
              .join(", ")}
          </small>
        </ol>
      </div>

      {polls.map(({ poll, ranks }) => (
        <div style={{ "break-inside": "avoid" }} key={poll}>
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
