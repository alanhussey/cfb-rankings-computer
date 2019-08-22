#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const _ = require("lodash");
const ncaa = require("ncaa-stats");

const NCAA_MENS_FOOTBALL = "MFB";
const DIVISION_ONE_FBS = 11;

const EXPECTED_TEAM_STATISTIC_CATEGORIES = [
  { value: "699", name: "3rd Down Conversion Pct" },
  { value: "701", name: "3rd Down Conversion Pct Defense" },
  { value: "700", name: "4th Down Conversion Pct" },
  { value: "702", name: "4th Down Conversion Pct Defense" },
  { value: "785", name: "Blocked Kicks" },
  { value: "786", name: "Blocked Kicks Allowed" },
  { value: "790", name: "Blocked Punts" },
  { value: "791", name: "Blocked Punts Allowed" },
  { value: "756", name: "Completion Percentage" },
  { value: "926", name: "Defensive TDs" },
  { value: "876", name: "Fewest Penalties" },
  { value: "697", name: "Fewest Penalties Per Game" },
  { value: "877", name: "Fewest Penalty Yards" },
  { value: "698", name: "Fewest Penalty Yards Per Game" },
  { value: "694", name: "First Downs Defense" },
  { value: "693", name: "First Downs Offense" },
  { value: "458", name: "Fumbles Lost" },
  { value: "456", name: "Fumbles Recovered" },
  { value: "463", name: "Kickoff Return Defense" },
  { value: "96", name: "Kickoff Returns" },
  { value: "98", name: "Net Punting" },
  { value: "459", name: "Passes Had Intercepted" },
  { value: "457", name: "Passes Intercepted" },
  { value: "25", name: "Passing Offense" },
  { value: "695", name: "Passing Yards Allowed" },
  { value: "741", name: "Passing Yards per Completion" },
  { value: "462", name: "Punt Return Defense" },
  { value: "97", name: "Punt Returns" },
  { value: "704", name: "Red Zone Defense" },
  { value: "703", name: "Red Zone Offense" },
  { value: "24", name: "Rushing Defense" },
  { value: "23", name: "Rushing Offense" },
  { value: "468", name: "Sacks Allowed" },
  { value: "28", name: "Scoring Defense" },
  { value: "27", name: "Scoring Offense" },
  { value: "696", name: "Tackles for Loss Allowed" },
  { value: "465", name: "Team Passing Efficiency" },
  { value: "40", name: "Team Passing Efficiency Defense" },
  { value: "466", name: "Team Sacks" },
  { value: "467", name: "Team Tackles for Loss" },
  { value: "705", name: "Time of Possession" },
  { value: "22", name: "Total Defense" },
  { value: "21", name: "Total Offense" },
  { value: "29", name: "Turnover Margin" },
  { value: "460", name: "Turnovers Gained" },
  { value: "461", name: "Turnovers Lost" },
  { value: "742", name: "Winning Percentage" }
].reduce(
  (categories, { name, value }) => ({ ...categories, [name]: value }),
  {}
);

async function main(config) {
  const season =
    config.season ||
    new Date().getFullYear() + (new Date().getMonth() <= 6 ? 1 : 0);

  const { categories } = await ncaa.sports.getSportDivisionData({
    type: "team",
    sport: NCAA_MENS_FOOTBALL,
    division: DIVISION_ONE_FBS,
    season,
    gameHigh: false
  });

  const TEAM_STATISTIC_CATEGORIES = _.fromPairs(
    categories.map(({ name, value }) => [name, value])
  );

  if (
    !_.isEqual(EXPECTED_TEAM_STATISTIC_CATEGORIES, TEAM_STATISTIC_CATEGORIES)
  ) {
    console.error(
      "Expected statistical categories and actual statistical categories do not match"
    );
    process.exit(1);
  }

  const outputPath = path.join(process.env.DATADIR, config.output_path);

  mkdirp.sync(path.dirname(outputPath));

  fs.writeFileSync(
    outputPath,
    JSON.stringify(TEAM_STATISTIC_CATEGORIES, null, 2),
    { encoding: "utf8" }
  );
}

if (require.main === module) {
  const [configPath] = process.argv.slice(2);
  const config = require(path.resolve(configPath));
  main(config);
}
