#!/usr/bin/env node
const ncaa = require("ncaa-stats");
const path = require("path");

// Because `console.log` also goes to stdout
console.log = console.error;

const CATEGORIES_PATH = path.resolve(
  process.env.DATADIR,
  "ncaa-stats/categories.json"
);
const CATEGORY_IDS = require(CATEGORIES_PATH);
function getCategoryID(category) {
  if (!CATEGORY_IDS.hasOwnProperty(category)) {
    throw new Error(`It looks like the category ${category} doesn't exist`);
  }
  return CATEGORY_IDS[category];
}

const NCAA_MENS_FOOTBALL = "MFB";
const DIVISION_ONE_FBS = 11;

async function main({ category, season }) {
  const { seasons } = await ncaa.sports.getSeasons(NCAA_MENS_FOOTBALL);

  const desiredSeason = seasons.find(s => `${Number(s.value) - 1}` === season);

  let teams = [];
  if (desiredSeason) {
    const options = {
      sport: NCAA_MENS_FOOTBALL,
      division: DIVISION_ONE_FBS,
      season: desiredSeason.value,
      category: getCategoryID(category)
    };
    teams = (await ncaa.stats.getTeamStats(options)).teams;

    if (!Array.isArray(teams)) {
      console.error(
        `Expected an array of teams but got this instead:\n${teams}`
      );
      process.exit(1);
    }
  }

  process.stdout.write(JSON.stringify(teams, null, 2), error => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  const [category, season] = process.argv.slice(2);
  main({ category, season });
}
