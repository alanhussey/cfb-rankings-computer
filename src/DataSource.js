import sortBy from "lodash/sortBy";
import mapValues from "lodash/mapValues";
import mapKeys from "lodash/mapKeys";
import camelCase from "lodash/camelCase";
import fromPairs from "lodash/fromPairs";
import getCorrectTeamName from "./getCorrectTeamName";

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

class GeneratedDataSource extends DataSource {
  fetch() {
    return Promise.resolve();
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
  async fetch() {
    return await (await fetch(this.href)).json();
  }
}

class NCAAStatDataSource extends FetchDataSource {
  constructor(options) {
    const slug = options.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    super({
      ...options,
      key: camelCase(slug),
      href: `ncaa-stats/${slug}.json`
    });
  }
  process(data) {
    const values = data;
    const ranks = sortBy(Object.values(values));
    return mapValues(
      mapKeys(values, (value, team) => getCorrectTeamName(team)),
      value => ({
        value,
        rank: ranks.indexOf(value)
      })
    );
  }
}

export const FBS_TEAMS = new FetchDataSource({
  name: "All FBS teams",
  key: "fbsTeams",
  href: "fbs-teams.json",
  initialState: {}
});

/*
const CURRENT_RANKINGS = new FetchDataSource({
  name: "Most recent polls",
  key: "currentRankings",
  href: "rankings/current.json",
  initialState: { polls: [] }
});
*/

const NCAA_STATS = [
  "3rd Down Conversion Pct",
  "3rd Down Conversion Pct Defense",
  "4th Down Conversion Pct",
  "4th Down Conversion Pct Defense",
  "Blocked Kicks",
  "Blocked Kicks Allowed",
  "Blocked Punts",
  "Blocked Punts Allowed",
  "Completion Percentage",
  "Defensive TDs",
  "Fewest Penalties",
  "Fewest Penalties Per Game",
  "Fewest Penalty Yards",
  "Fewest Penalty Yards Per Game",
  "First Downs Defense",
  "First Downs Offense",
  "Fumbles Lost",
  "Fumbles Recovered",
  "Kickoff Return Defense",
  "Kickoff Returns",
  "Net Punting",
  "Passes Had Intercepted",
  "Passes Intercepted",
  "Passing Offense",
  "Passing Yards Allowed",
  "Passing Yards per Completion",
  "Punt Return Defense",
  "Punt Returns",
  "Red Zone Defense",
  "Red Zone Offense",
  "Rushing Defense",
  "Rushing Offense",
  "Sacks Allowed",
  "Scoring Defense",
  "Scoring Offense",
  "Tackles for Loss Allowed",
  "Team Passing Efficiency",
  "Team Passing Efficiency Defense",
  "Team Sacks",
  "Team Tackles for Loss",
  "Time of Possession",
  "Total Defense",
  "Total Offense",
  "Turnover Margin",
  "Turnovers Gained",
  "Turnovers Lost",
  "Winning Percentage"
];

const RANDOM = new GeneratedDataSource({
  name: "Random",
  key: "random",
  description:
    "Each team is given a random score, updated on every page refresh",

  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, Math.random()]));
    const ranks = sortBy(Object.values(values)).reverse();
    return mapValues(data, (_, key) => ({
      value: values[key],
      rank: ranks.indexOf(values[key]) + 1
    }));
  }
});

const MASCOT_WEIGHTS = new FetchDataSource({
  name: "Mascot weights",
  key: "mascotWeight",
  description:
    "Per Jon Bois and SBNation https://www.youtube.com/watch?v=obtRtrk42a8",
  href: "mascot-weights.json",
  initialState: {},
  process(data) {
    // parse `"Infinity"`
    const weights = mapValues(data, Number);
    const ranks = sortBy(Object.values(weights), n => -n);
    return mapValues(weights, value => ({
      value,
      rank: ranks.indexOf(value) + 1
    }));
  }
});

export const DATA_SOURCES = [
  RANDOM,
  MASCOT_WEIGHTS,
  ...NCAA_STATS.map(name => new NCAAStatDataSource({ name }))
];
