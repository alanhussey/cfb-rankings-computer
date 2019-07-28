import minBy from "lodash/minBy";
import sortBy from "lodash/sortBy";
import React, { Fragment, useState, useEffect } from "react";
import { luminance } from "./color";
import "./App.css";

function get(url) {
  return fetch(url).then(response => response.json());
}

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

const DATA_SOURCES = {
  fbsTeams: "/data/fbs-teams.json",
  currentRankings: "/data/rankings/current.json"
};

function App() {
  const [state, setState] = useState({ data: {} });

  useEffect(
    () =>
      Promise.all(
        Object.entries(DATA_SOURCES).map(([key, url]) =>
          get(url).then(json => [key, json])
        )
      ).then(data => setState({ data: Object.fromEntries(data) })),
    []
  );

  const teams = state.data.fbsTeams || {};
  const rankings = state.data.currentRankings || {};
  const polls = rankings.polls || [];
  return (
    <div>
      <h1>Polls</h1>
      <p>
        {rankings.season} week {rankings.week}
      </p>
      {polls.map(({ poll, ranks }) => (
        <Fragment key={poll}>
          <h2>{poll}</h2>
          <PollRanks poll={poll} ranks={ranks} teams={teams} />
        </Fragment>
      ))}
    </div>
  );
}

export default App;
