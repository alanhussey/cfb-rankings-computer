#!/usr/bin/env node
const ncaa = require("ncaa-stats");

const NCAA_MENS_FOOTBALL = "MFB";
const DIVISION_ONE_FBS = 11;

async function main({ category }) {
  const { teams } = await ncaa.stats.getTeamStats({
    sport: NCAA_MENS_FOOTBALL,
    division: DIVISION_ONE_FBS,
    category: require("../data/ncaa-stats/categories.json")[category]
  });

  if (!Array.isArray(teams)) {
    console.error(`Expected an array of teams but got this instead:\n${teams}`);
    process.exit(1);
  }
  if (teams.length < 50 || teams.length > 130) {
    console.error(`Expected 128-130 teams but got ${teams.length} instead`);
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(teams, null, 2), error => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  const [category] = process.argv.slice(2);
  main({ category });
}
