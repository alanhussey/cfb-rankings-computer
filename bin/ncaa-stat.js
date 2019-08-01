#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const ncaa = require("ncaa-stats");

const NCAA_MENS_FOOTBALL = "MFB";
const DIVISION_ONE_FBS = 11;

async function main(config) {
  const { teams } = await ncaa.stats.getTeamStats({
    sport: NCAA_MENS_FOOTBALL,
    division: DIVISION_ONE_FBS,
    category: require("../data/ncaa-stats/categories.json")[config.category]
  });

  if (!Array.isArray(teams)) {
    console.error(`Expected an array of teams but got this instead:\n${teams}`);
    process.exit(1);
  }
  if (teams.length < 50 || teams.length > 130) {
    console.error(`Expected 128-130 teams but got ${teams.length} instead`);
    process.exit(1);
  }

  const outputPath = path.join(__dirname, "../data", config.output_path);

  mkdirp.sync(path.dirname(outputPath));

  fs.writeFileSync(outputPath, JSON.stringify(teams, null, 2), {
    encoding: "utf8"
  });
}

if (require.main === module) {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath));
  main(config);
}
