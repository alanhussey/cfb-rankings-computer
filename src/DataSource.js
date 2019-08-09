import sortBy from "lodash/sortBy";
import mapValues from "lodash/mapValues";
import mapKeys from "lodash/mapKeys";
import camelCase from "lodash/camelCase";
import fromPairs from "lodash/fromPairs";
import getCorrectTeamName from "./getCorrectTeamName";

const CATEGORY_OFFENSE = "Offense";
const CATEGORY_DEFENSE = "Defense";
const CATEGORY_SPECIAL = "Special Teams";
const CATEGORY_OVERALL = "Overall";
const CATEGORY_OTHER = "Other";

export const CATEGORIES = [
  CATEGORY_OVERALL,
  CATEGORY_OFFENSE,
  CATEGORY_DEFENSE,
  CATEGORY_SPECIAL,
  CATEGORY_OTHER
];

class DataSource {
  constructor({
    name,
    key,
    description = "",
    category = CATEGORY_OTHER,
    defaultOrder = "desc",
    initialState = null,
    render = String,
    process = null
  }) {
    Object.assign(this, {
      name,
      key,
      description,
      category,
      defaultOrder,
      initialState,
      render
    });
    if (process) {
      this.process = process;
    }
  }
  async fetch() {
    throw new TypeError(`${this.constructor.name} must implement \`fetch\``);
  }
  process(data) {
    return data;
  }
}

class GeneratedDataSource extends DataSource {
  async fetch() {
    return null;
  }
}

class FetchDataSource extends DataSource {
  constructor(options) {
    super(options);
    this.href = `/data/${options.href}`;
  }
  async fetch() {
    return await (await fetch(this.href)).json();
  }
}

function getRender(dataType) {
  switch (dataType) {
    case "percent":
      return value => `${(value * 100).toFixed(2)}%`;

    default:
      return undefined;
  }
}

class NCAAStatDataSource extends FetchDataSource {
  constructor(options) {
    const slug = options.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    super({
      ...options,
      key: camelCase(slug),
      href: `ncaa-stats/${slug}.json`,
      render: getRender(options.dataType)
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
  { name: "3rd Down Conversion Pct", category: CATEGORY_OFFENSE },
  { name: "3rd Down Conversion Pct Defense", category: CATEGORY_DEFENSE },
  { name: "4th Down Conversion Pct", category: CATEGORY_OFFENSE },
  { name: "4th Down Conversion Pct Defense", category: CATEGORY_DEFENSE },
  { name: "Blocked Kicks", category: CATEGORY_SPECIAL },
  {
    name: "Blocked Kicks Allowed",
    category: CATEGORY_SPECIAL,
    defaultOrder: "asc"
  },
  { name: "Blocked Punts", category: CATEGORY_SPECIAL },
  {
    name: "Blocked Punts Allowed",
    category: CATEGORY_SPECIAL,
    defaultOrder: "asc"
  },
  { name: "Completion Percentage", category: CATEGORY_OFFENSE },
  { name: "Defensive TDs", category: CATEGORY_DEFENSE },
  { name: "Fewest Penalties", category: CATEGORY_OVERALL, defaultOrder: "asc" },
  {
    name: "Fewest Penalties Per Game",
    category: CATEGORY_OVERALL,
    defaultOrder: "asc"
  },
  {
    name: "Fewest Penalty Yards",
    category: CATEGORY_OVERALL,
    defaultOrder: "asc"
  },
  {
    name: "Fewest Penalty Yards Per Game",
    category: CATEGORY_OVERALL,
    defaultOrder: "asc"
  },
  {
    name: "First Downs Defense",
    category: CATEGORY_DEFENSE,
    defaultOrder: "asc"
  },
  { name: "First Downs Offense", category: CATEGORY_OFFENSE },
  { name: "Fumbles Lost", category: CATEGORY_OVERALL, defaultOrder: "asc" },
  { name: "Fumbles Recovered", category: CATEGORY_OVERALL },
  {
    name: "Kickoff Return Defense",
    category: CATEGORY_DEFENSE,
    defaultOrder: "asc"
  },
  { name: "Kickoff Returns", category: CATEGORY_SPECIAL },
  { name: "Net Punting", category: CATEGORY_SPECIAL },
  {
    name: "Passes Had Intercepted",
    category: CATEGORY_OFFENSE,
    defaultOrder: "asc"
  },
  { name: "Passes Intercepted", category: CATEGORY_DEFENSE },
  { name: "Passing Offense", category: CATEGORY_OFFENSE },
  {
    name: "Passing Yards Allowed",
    category: CATEGORY_DEFENSE,
    defaultOrder: "asc"
  },
  { name: "Passing Yards per Completion", category: CATEGORY_OFFENSE },
  {
    name: "Punt Return Defense",
    category: CATEGORY_DEFENSE,
    defaultOrder: "asc"
  },
  { name: "Punt Returns", category: CATEGORY_SPECIAL },
  { name: "Red Zone Defense", category: CATEGORY_DEFENSE, defaultOrder: "asc" },
  { name: "Red Zone Offense", category: CATEGORY_OFFENSE },
  { name: "Rushing Defense", category: CATEGORY_DEFENSE, defaultOrder: "asc" },
  { name: "Rushing Offense", category: CATEGORY_OFFENSE },
  { name: "Sacks Allowed", category: CATEGORY_OFFENSE, defaultOrder: "asc" },
  { name: "Scoring Defense", category: CATEGORY_DEFENSE, defaultOrder: "asc" },
  { name: "Scoring Offense", category: CATEGORY_OFFENSE },
  {
    name: "Tackles for Loss Allowed",
    category: CATEGORY_OFFENSE,
    defaultOrder: "asc"
  },
  { name: "Team Passing Efficiency", category: CATEGORY_OFFENSE },
  {
    name: "Team Passing Efficiency Defense",
    category: CATEGORY_DEFENSE,
    defaultOrder: "asc"
  },
  { name: "Team Sacks", category: CATEGORY_DEFENSE },
  { name: "Team Tackles for Loss", category: CATEGORY_DEFENSE },
  { name: "Time of Possession", category: CATEGORY_OFFENSE },
  { name: "Total Defense", category: CATEGORY_DEFENSE, defaultOrder: "asc" },
  { name: "Total Offense", category: CATEGORY_OFFENSE },
  { name: "Turnover Margin", category: CATEGORY_OVERALL },
  { name: "Turnovers Gained", category: CATEGORY_OVERALL },
  { name: "Turnovers Lost", category: CATEGORY_OVERALL, defaultOrder: "asc" },
  {
    name: "Winning Percentage",
    category: CATEGORY_OVERALL,
    dataType: "percent"
  }
];

const RANDOM = new GeneratedDataSource({
  name: "Random",
  key: "random",
  description:
    "Each team is given a random score, randomized on every page refresh",

  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, Math.random()]));
    const ranks = Object.values(values).sort();

    return mapValues(values, (_, key) => ({
      value: values[key],
      rank: ranks.indexOf(values[key]) + 1
    }));
  }
});

const MASCOT_WEIGHTS = new FetchDataSource({
  name: "Mascot weight (lbs.)",
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
  },
  render(value) {
    switch (value) {
      case Infinity:
      case -Infinity:
        return "Unknowable";

      case 0:
        return "?";

      default:
        return window.Intl && Intl.NumberFormat
          ? new Intl.NumberFormat().format(value)
          : String(value);
    }
  }
});

const TALENT = new FetchDataSource({
  name: "Talent",
  key: "talent",
  description: "Team talent composite",
  href: "talent/current.json",
  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, data[team]]));
    const ranks = Object.values(values);
    return mapValues(values, value => ({
      value,
      rank: ranks.indexOf(value) + 1
    }));
  }
});

export const DATA_SOURCES = [
  RANDOM,
  MASCOT_WEIGHTS,
  TALENT,
  ...NCAA_STATS.map(opts => new NCAAStatDataSource(opts))
];
