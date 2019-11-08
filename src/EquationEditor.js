import React, { useEffect, useState, useMemo } from "react";
import difference from "lodash/difference";
import { create, all } from "mathjs/number";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

import Emoji from "./Emoji";
import { DATA_SOURCES } from "./DataSource";
import rankBy from "./rankBy";
import Ranks from "./Ranks";
import { DESCENDING } from "./constants";
import getBaseURL from "./getBaseURL";
import URLSearchParamsSchema from "./URLSearchParamsSchema";

const math = create(all);

function makeScoringFn(expression) {
  const node = math.parse(expression);
  const code = node.compile();
  return team => code.evaluate(team);
}

const INITIAL_EQUATION =
  "100 * (totalOffense / (totalOffense + totalDefense)) * winPercentage / PI";

const CODE_FONT_FAMILY =
  '"Fira code", "Fira Mono", Inconsolata, Menlo, monospace';

const CodeEditor = ({ code, setCode, error }) => (
  <>
    <Editor
      value={code}
      onValueChange={setCode}
      highlight={code => highlight(code, languages.js)}
      padding={10}
      style={{
        fontFamily: CODE_FONT_FAMILY,
        fontSize: 12,
        border: "1px solid grey"
      }}
    />
    {error && (
      <p style={{ color: "red" }}>
        Uh oh! <code>{error.message}</code>
      </p>
    )}
  </>
);

const render = !!(window.Intl && Intl.NumberFormat)
  ? new Intl.NumberFormat().format
  : value => value.toFixed(3);

function EquationEditorRankedTeams({ teams }) {
  return (
    <Ranks
      headers={<th>Score</th>}
      teams={teams.map(({ score, ...rest }) => ({
        ...rest,
        columns: <td title={String(score[0])}>{render(score)}</td>
      }))}
    />
  );
}

const isSubset = (subset, superset) =>
  difference(subset, superset).length === 0;

const searchParamsSchema = new URLSearchParamsSchema({
  system: String,
  equation: String
});

export default function EquationEditor({ factors, addFactors, teams }) {
  const { equation: initialEquation } = useMemo(
    () => searchParamsSchema.decodeURL(document.location),
    []
  );

  const [equation, setEquation] = useState(initialEquation || INITIAL_EQUATION);

  // All the references in the equation that are valid sources
  const desiredSources = useMemo(() => {
    // All named references in the equation
    const variables = [...new Set(equation.match(/[A-ZA-z]+/g))];

    return variables
      .map(variable => DATA_SOURCES.find(source => source.key === variable))
      .filter(Boolean);
  }, [equation]);

  useEffect(() => {
    const desiredSourceKeys = desiredSources.map(({ key }) => key);
    const availableFactorKeys = factors.map(({ key }) => key);

    // Early-out if we already are aware of all dependencies
    if (isSubset(desiredSourceKeys, availableFactorKeys)) return;

    addFactors(
      desiredSources.map(source => ({
        key: source.key,
        order: source.defaultOrder
      }))
    );
  }, [addFactors, desiredSources, factors]);

  // Check scoreFn for potential errors before trying to render a list
  const [scoreFn, error] = useMemo(() => {
    try {
      const fn = makeScoringFn(equation);
      fn(teams[0]);
      return [fn, null];
    } catch (error) {
      // If there's a problem, produce a "default" score function
      return [() => null, error];
    }
  }, [equation, teams]);

  // Teams ranked by the given equation
  const rankedTeams = useMemo(
    () => rankBy(teams, [{ key: scoreFn, order: DESCENDING }]),
    [scoreFn, teams]
  );

  // Avoid janky autoformatting
  const MATH_JS = (
    <a href="https://mathjs.org/docs/expressions/syntax.html">
      <code>math.js</code>
    </a>
  );
  return (
    <>
      <p>Do some math!</p>
      <p>
        You can write whatever {MATH_JS} code you want here. Any available data
        source that you reference will be automatically downloaded.
      </p>

      <p>Currently loaded data sources:</p>
      <ol>
        {factors.map(factor => (
          <li key={factor.key}>
            {DATA_SOURCES.find(source => source.key === factor.key).name} (
            <code style={{ fontFamily: CODE_FONT_FAMILY }}>{factor.key}</code>)
          </li>
        ))}
      </ol>

      <p style={{ display: "none" }}>
        <a
          href={`${getBaseURL(document.location)}?${searchParamsSchema.encode({
            system: "equation",
            equation
          })}`}
          // eslint-disable-next-line react/jsx-no-target-blank
          target="_blank"
        >
          Share <Emoji emoji="🔗" label="link" />
        </a>
      </p>

      <CodeEditor code={equation} setCode={setEquation} error={error} />

      <EquationEditorRankedTeams teams={rankedTeams} />
    </>
  );
}
