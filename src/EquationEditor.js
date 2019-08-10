import React, { useEffect, useState, useMemo } from "react";
import debounce from "lodash/debounce";
import fromPairs from "lodash/fromPairs";
import difference from "lodash/difference";
import { create, all } from "mathjs/number";

import { DATA_SOURCES } from "./DataSource";
import Rank from "./Rank";
import rankBy from "./rankBy";
import { DESCENDING } from "./constants";

const math = create(all);

// Pre-defined set of built-ins
const DEFAULT_CONTEXT = {
  ...fromPairs(Object.getOwnPropertyNames(Math).map(key => [key, Math[key]]))
};

function makeScoringFn(expression) {
  const node = math.parse(expression);
  const code = node.compile();
  return team => code.evaluate(team);
}

const render = !!(window.Intl && Intl.NumberFormat)
  ? new Intl.NumberFormat().format
  : value => value.toFixed(3);

const isSubset = (subset, superset) =>
  difference(subset, superset).length === 0;

export default function EquationEditor({
  factors,
  addFactors,
  teams: teamsWithFactors
}) {
  const [equation, _setEquation] = useState(
    "(totalOffense / (totalOffense + totalDefense)) * winningPercentage / PI * 100"
  );

  // A (super)set of the factors needed
  const desiredSources = useMemo(() => {
    const variables =
      // All named references in the equation...
      [...new Set(equation.match(/[A-z]+/g))]
        // that are not already in context
        .filter(variable => !DEFAULT_CONTEXT.hasOwnProperty(variable));

    return variables
      .map(variable => DATA_SOURCES.find(source => source.key === variable))
      .filter(Boolean);
  }, [equation]);

  useEffect(() => {
    const desiredFactors = desiredSources.map(({ key }) => key);
    const availableFactors = factors.map(({ key }) => key);

    if (isSubset(desiredFactors, availableFactors)) return;

    addFactors(
      desiredSources.map(source => ({
        key: source.key,
        order: source.defaultOrder
      }))
    );
  }, [addFactors, desiredSources, factors]);

  // Debounce so each keystroke doesn't cause a re-render,
  // memoize so debounce internal state isn't lost.
  const setEquation = useMemo(() => {
    return debounce(_setEquation, 250);
  }, [_setEquation]);

  // Check scoreFn for potential errors before trying to render a list
  const [scoreFn, error] = useMemo(() => {
    const fn = makeScoringFn(equation);
    try {
      fn(teamsWithFactors[0]);
      return [fn, null];
    } catch (error) {
      // If there's a problem, produce a "default" score function
      return [() => null, error];
    }
  }, [equation, teamsWithFactors]);

  // Teams ranked by the given equation
  const teams = useMemo(
    () => rankBy(teamsWithFactors, [{ key: scoreFn, order: DESCENDING }]),
    [scoreFn, teamsWithFactors]
  );

  return (
    <>
      <textarea
        style={{
          width: "calc(100% - 2em)",
          margin: "1em",
          fontFamily: '"Fira Code", Inconsolata, Menlo, monospace'
        }}
        onChange={event => setEquation(event.target.value)}
        defaultValue={equation}
      />
      {error && <p style={{ color: "red" }}>Uh oh! {error.message}</p>}

      <p>Available statistics:</p>

      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {DATA_SOURCES.find(source => source.key === factor.key).name} (
            <code
              style={{
                fontFamily: '"Fira Code", Inconsolata, Menlo, monospace',
                padding: "5px",
                backgroundColor: "hsla(0, 0%, 0%, .1)"
              }}
            >
              {factor.key}
            </code>
            )
          </li>
        ))}
      </ol>
      <table className="App-ranks">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(({ team, rank, score, ...teamStats }) => (
            <Rank key={team.school} team={team} rank={rank}>
              <td>{render(score)}</td>
            </Rank>
          ))}
        </tbody>
      </table>
    </>
  );
}
