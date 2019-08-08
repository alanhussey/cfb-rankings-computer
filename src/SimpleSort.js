import sortBy from "lodash/sortBy";
import groupBy from "lodash/groupBy";
import React, { useEffect } from "react";
import { DATA_SOURCES, CATEGORIES } from "./DataSource";
import SimpleSortRankedTeams from "./SimpleSortRankedTeams";
import rankBy from "./rankBy";
import { ASCENDING, DESCENDING } from "./constants";

export default function SimpleSort({
  factors,
  setFactors,
  teams: teamsWithFactors
}) {
  useEffect(() => {
    setFactors([
      { key: "winningPercentage", order: DESCENDING },
      { key: "mascotWeight", order: DESCENDING }
    ]);
  }, [setFactors]);

  // Teams ranked by the selected factors
  const rankedTeams = rankBy(teamsWithFactors, factors);
  const stats = factors.map(factor => {
    const source = DATA_SOURCES.find(source => source.key === factor.key);
    return {
      key: factor.key,
      name: source.name,
      render: value => source.render(value)
    };
  });
  return (
    <>
      <p>The easiest way to build your own computer poll.</p>
      <p>
        Select one or more of the following statistics. Teams will be sorted by
        each factor, using the next factor as a tie-breaker if needed.
      </p>
      <p>Selected statistics:</p>
      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {factors.length > 1 && (
              <button
                onClick={() =>
                  setFactors(factors.filter(f => f.key !== factor.key))
                }
              >
                -
              </button>
            )}
            {DATA_SOURCES.find(source => source.key === factor.key).name} (
            {factor.order === ASCENDING
              ? "in ascending order"
              : "in descending order"}
            )
          </li>
        ))}
      </ol>
      <p>Available statistics:</p>
      <ul>
        {sortBy(
          Object.entries(groupBy(DATA_SOURCES, source => source.category)),
          ([category]) => CATEGORIES.indexOf(category)
        ).map(([category, sources]) => (
          <li key={category}>
            <strong>{category}</strong> <br />
            <ol>
              {sources.map(source => (
                <li key={source.key}>
                  <button
                    disabled={
                      !!factors.find(factor => factor.key === source.key)
                    }
                    onClick={() =>
                      setFactors([
                        ...factors,
                        { key: source.key, order: source.defaultOrder }
                      ])
                    }
                  >
                    +
                  </button>
                  {source.name}
                  {source.description && `: ${source.description}`}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>

      <SimpleSortRankedTeams teams={rankedTeams} stats={stats} />
    </>
  );
}
