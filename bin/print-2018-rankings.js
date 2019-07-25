const { zip, chunk, maxBy, mapValues, keyBy, sortBy } = require("lodash");

const leftPad = (value, n, padder = " ") => String(value).padStart(n, padder);
const rightPad = (value, n, padder = " ") => String(value).padEnd(n, padder);
const print = console.log.bind(console);

const latestPolls = require("../data/rankings/current.json").polls;
const pollsByName = keyBy(latestPolls, ({ poll }) => poll);

const prettyPrintedPolls = mapValues(pollsByName, ({ ranks }) =>
  sortBy(ranks, "rank").map(({ rank, points, school, firstPlaceVotes }) =>
    points !== 0
      ? firstPlaceVotes > 0
        ? `${leftPad(
            rank,
            2
          )}. ${school} (${points} [${firstPlaceVotes} first place votes])`
        : `${leftPad(rank, 2)}. ${school} (${points})`
      : `${leftPad(rank, 2)}. ${school}`
  )
);

const columns = Object.entries(prettyPrintedPolls).map(([name, rankings]) => [
  name,
  ...rankings
]);

const maxWidths = columns.map(column => maxBy(column, "length").length);

print(
  zip(
    ...columns.map((column, index) =>
      column.map(row => rightPad(row, maxWidths[index]))
    )
  )
    .map(row => row.join("  |  "))
    .join("\n")
);
