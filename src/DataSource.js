import sortBy from "lodash/sortBy";
import mapValues from "lodash/mapValues";
import mapKeys from "lodash/mapKeys";
import camelCase from "lodash/camelCase";
import fromPairs from "lodash/fromPairs";
import getCorrectTeamName from "./getCorrectTeamName";
import { ASCENDING, DESCENDING } from "./constants";

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

const assertNonNull = (name, value) => {
  if (value == null) {
    throw new TypeError(`A null-ish value was provided for ${name}`);
  }
};

const assertEnum = (name, value, allowable) => {
  if (!allowable.includes(value)) {
    throw new TypeError(`${name} must be one of ${JSON.stringify(allowable)}`);
  }
};

const assertCallable = (name, fn) => {
  if (typeof fn !== "function") {
    throw new TypeError(`${name} must be a function`);
  }
};

class DataSource {
  constructor({
    name,
    key,
    description = "",
    category = CATEGORY_OTHER,
    defaultOrder = "desc",
    defaultValue = 0,
    render = String,
    process = null
  }) {
    assertNonNull("name", name);
    assertNonNull("key", key);
    assertNonNull("description", description);
    assertEnum("category", category, CATEGORIES);
    assertEnum("defaultOrder", defaultOrder, [ASCENDING, DESCENDING]);
    assertNonNull("defaultValue", defaultValue);
    assertCallable("render", render);
    Object.assign(this, {
      name,
      key,
      description,
      category,
      defaultOrder,
      defaultValue,
      render
    });
    if (process) {
      assertCallable("process", process);
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
    this.relativePath = options.relativePath;
  }
  getURL({ season }) {
    return `/data/${season}/${this.relativePath}`;
  }
  async fetch(options) {
    const url = this.getURL(options);
    const response = await fetch(url);
    if (response.ok) {
      try {
        const txt = await response.text();
        return JSON.parse(txt);
      } catch (error) {
        console.error(error, url);
        return {};
      }
    } else {
      console.error(response.statusText, url);
      return {};
    }
  }
}

function getRender(dataType) {
  switch (dataType) {
    case "time":
      return value => `${Math.trunc(value)}:${Math.round((value % 1) * 60)}`;
    case "percent":
      return value => `${(value * 100).toFixed(2)}%`;

    default:
      return undefined;
  }
}

class NCAAStatDataSource extends FetchDataSource {
  constructor(options) {
    const slug =
      options.slug || options.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    super({
      ...options,
      key: camelCase(slug),
      relativePath: `ncaa-stats/${slug}.json`,
      render: getRender(options.dataType)
    });
  }
  process(data, teams) {
    const ranks = sortBy(Object.values(data));

    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(
        mapKeys(data, (value, team) => getCorrectTeamName(team)),
        value => ({
          value,
          rank: ranks.indexOf(value)
        })
      )
    };
  }
}

export const FBS_TEAMS = new FetchDataSource({
  name: "All FBS teams",
  key: "fbsTeams",
  relativePath: "fbs-teams.json",
  defaultValue: {}
});

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
  { name: "Time of Possession", category: CATEGORY_OFFENSE, dataType: "time" },
  { name: "Total Defense", category: CATEGORY_DEFENSE, defaultOrder: "asc" },
  { name: "Total Offense", category: CATEGORY_OFFENSE },
  { name: "Turnover Margin", category: CATEGORY_OVERALL },
  { name: "Turnovers Gained", category: CATEGORY_OVERALL },
  { name: "Turnovers Lost", category: CATEGORY_OVERALL, defaultOrder: "asc" },
  {
    name: "Winning Percentage",
    category: CATEGORY_OVERALL,
    dataType: "percent"
  },
  { name: "Wins", category: CATEGORY_OVERALL, slug: "wins" },
  {
    name: "Losses",
    category: CATEGORY_OVERALL,
    slug: "losses",
    defaultOrder: "asc"
  },
  {
    name: "Ties",
    category: CATEGORY_OVERALL,
    slug: "ties",
    defaultOrder: "asc"
  },
  { name: "Games Played", category: CATEGORY_OVERALL, slug: "games-played" }
].map(opts => new NCAAStatDataSource(opts));

const quantize = (num, decimals) => {
  return Math.round(num * (1 / decimals)) / (1 / decimals);
};

const RANDOM = new GeneratedDataSource({
  name: "Random",
  key: "random",
  description:
    "Each team is given a random score, randomized on every page refresh",

  process(data, teams) {
    const values = fromPairs(
      teams.map(team => [team, quantize(Math.random(), 0.0001)])
    );
    const ranks = Object.values(values).sort();

    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(values, (_, key) => ({
        value: values[key],
        rank: ranks.indexOf(values[key]) + 1
      }))
    };
  }
});

const MASCOT_WEIGHTS = new FetchDataSource({
  name: "Mascot weight (lbs.)",
  key: "mascotWeight",
  description:
    "Per Jon Bois and SBNation https://www.youtube.com/watch?v=obtRtrk42a8",
  relativePath: "mascot-weights.json",
  defaultValue: 0,
  process(data) {
    // parse `"Infinity"`
    const weights = mapValues(data, Number);
    const ranks = sortBy(Object.values(weights), n => -n);
    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(weights, value => ({
        value,
        rank: ranks.indexOf(value) + 1
      }))
    };
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
  relativePath: "talent.json",
  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, data[team]]));
    const ranks = Object.values(values).sort();
    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(values, value => ({
        value,
        rank: ranks.indexOf(value) + 1
      }))
    };
  }
});

const STRENGTH_OF_SCHEDULE = new FetchDataSource({
  name: "Strength of schedule",
  key: "sos",
  description:
    "Combined record of each team's opponents, excluding games against that team",
  category: CATEGORY_OVERALL,
  relativePath: "strength-of-schedule.json",
  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, data[team]]));
    const ranks = Object.values(values).sort();
    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(values, value => ({
        value,
        rank: ranks.indexOf(value) + 1
      }))
    };
  }
});

const OPPONENT_WINNING_PERCENTAGE = new FetchDataSource({
  name: "Opponent winning percentage",
  key: "opponentWinPercentage",
  description: "Combined record of each team's opponents",
  category: CATEGORY_OVERALL,
  relativePath: "opponent-winning-percentage.json",
  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, data[team]]));
    const ranks = Object.values(values).sort();
    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(values, value => ({
        value,
        rank: ranks.indexOf(value) + 1
      }))
    };
  }
});

const CONF_WIN_PERCENTAGE_OOC = new FetchDataSource({
  name: "Conference OOC Win Percentage",
  key: "oocConfWinPercentage",
  description:
    "The combined out-of-conference winning percentage for each team's conference. " +
    "Useful as an approximation of relative conference strength. " +
    "For independent teams their own winning percentage is reported.",
  relativePath: "ooc-conference-winning-percentage-by-team.json",
  render: getRender("percent"),
  process(data, teams) {
    const values = fromPairs(teams.map(team => [team, data[team]]));
    const ranks = Object.values(values).sort();
    return {
      defaultValue: this.defaultValue,
      forTeam: mapValues(values, value => ({
        value,
        rank: ranks.indexOf(value) + 1
      }))
    };
  }
});

export const DATA_SOURCES = [
  RANDOM,
  MASCOT_WEIGHTS,
  TALENT,
  STRENGTH_OF_SCHEDULE,
  OPPONENT_WINNING_PERCENTAGE,
  CONF_WIN_PERCENTAGE_OOC,
  ...NCAA_STATS
];

DATA_SOURCES.forEach((source, index) => {
  if (DATA_SOURCES.findIndex(s => s.key === source.key) !== index) {
    throw new Error(`${source.key} is used twice`);
  }
});
