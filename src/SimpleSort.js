import sortBy from "lodash/sortBy";
import groupBy from "lodash/groupBy";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import FuzzySearch from "fuzzy-search";
import classnames from "classnames";
import { DATA_SOURCES, CATEGORIES } from "./DataSource";
import SimpleSortRankedTeams from "./SimpleSortRankedTeams";
import rankBy from "./rankBy";
import { ASCENDING, DESCENDING, ORDER_ARROW, ORDER_LABEL } from "./constants";
import Button from "./Button";

const SOURCES_BY_CATEGORY = sortBy(
  Object.entries(groupBy(DATA_SOURCES, source => source.category)),
  ([category]) => CATEGORIES.indexOf(category)
);

const HeavyButton = ({ className, ...props }) => (
  <Button className={classnames("Button-heavy", className)} {...props} />
);

const Factor = ({
  name,
  order,
  disabled,
  onClickAddRemoveButton,
  buttonContent,
  onClickOrderToggle,
  children
}) => {
  const OrderToggle = onClickOrderToggle ? Button : "span";
  return (
    <li className="Factor">
      <HeavyButton disabled={disabled} onClick={onClickAddRemoveButton}>
        {buttonContent}
      </HeavyButton>
      <span className="Factor--name">{name}</span>&nbsp;
      <OrderToggle
        className="Factor--order-indicator"
        title={`By default, this will be sorted in ${
          ORDER_LABEL[order]
        } order. You can change this later.`}
        onClick={onClickOrderToggle}
      >
        {ORDER_ARROW[order]}
      </OrderToggle>
      <br />
      <div className="Factor--children">{children}</div>
    </li>
  );
};

const ListHeader = ({ children }) => <h3 className="ListHeader">{children}</h3>;

const toggleOrder = factor => ({
  ...factor,
  order: factor.order === ASCENDING ? DESCENDING : ASCENDING
});

const toggleOrderForFactorByKey = (factors, key) =>
  factors.map(factor => (factor.key === key ? toggleOrder(factor) : factor));

function SelectedFactors({ factors, setFactors }) {
  return (
    <div className="SelectedFactors">
      <h3>Selected stats</h3>
      <ol>
        {factors.map(factor => (
          <Factor
            key={factor.key}
            disabled={factors.length <= 1}
            onClickAddRemoveButton={() =>
              setFactors(factors.filter(f => f.key !== factor.key))
            }
            onClickOrderToggle={() =>
              setFactors(toggleOrderForFactorByKey(factors, factor.key))
            }
            buttonContent={
              <span role="img" aria-label="hide">
                ➖
              </span>
            }
            name={DATA_SOURCES.find(source => source.key === factor.key).name}
            order={factor.order}
          />
        ))}
      </ol>
    </div>
  );
}

function AvailableDataSources({ factors, addFactors }) {
  const [search, setSearch] = useState("");
  const isSearching = search.trim() !== "";

  const [showAll, setShowAll] = useState(false);

  const [categoryExpanded, setCategoryExpanded] = useState(
    SOURCES_BY_CATEGORY.map(() => true)
  );

  const categories = useMemo(
    () =>
      isSearching
        ? SOURCES_BY_CATEGORY.map(([category, sources]) => {
            let filteredSources = new FuzzySearch(sources, [
              "name",
              "key",
              "description"
            ]).search(search);

            return [category, filteredSources];
          })
        : SOURCES_BY_CATEGORY,
    [isSearching, search]
  );

  const factorKeys = useMemo(() => new Set(factors.map(({ key }) => key)), [
    factors
  ]);

  return (
    <div className="AvailableDataSources">
      <h3>Available stats</h3>
      <input
        type="search"
        placeholder="Search"
        className="Typeahead"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <label>
        <input
          style={{ margin: "0 1em" }}
          checked={showAll}
          onChange={event => setShowAll(event.target.checked)}
          type="checkbox"
        />
        Show all
      </label>
      <ul>
        {(showAll || isSearching) &&
          categories.map(([category, sources], categoryIndex) => (
            <li key={category}>
              <ListHeader>
                {category}
                <Button
                  className="ListHeader--disclosure-triangle"
                  onClick={() =>
                    setCategoryExpanded(
                      categoryExpanded.map((expanded, index) =>
                        index === categoryIndex ? !expanded : expanded
                      )
                    )
                  }
                >
                  {categoryExpanded[categoryIndex] ? (
                    <span role="img" aria-label="hide">
                      ➖
                    </span>
                  ) : (
                    <span role="img" aria-label="show">
                      ➕
                    </span>
                  )}
                </Button>
              </ListHeader>
              {categoryExpanded[categoryIndex] && (
                <ul>
                  {sources.map(source => {
                    const disabled = factorKeys.has(source.key);
                    return (
                      <Factor
                        key={source.key}
                        disabled={disabled}
                        onClickAddRemoveButton={() =>
                          addFactors([
                            {
                              key: source.key,
                              order: source.defaultOrder
                            }
                          ])
                        }
                        buttonContent={
                          <span
                            title={
                              disabled &&
                              "You cannot use the same stat more than once to sort teams. That doesn't even make sense."
                            }
                            role="img"
                            aria-label="add"
                          >
                            ➕
                          </span>
                        }
                        name={source.name}
                        order={source.defaultOrder}
                      >
                        {source.description}
                      </Factor>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function SimpleSort({
  factors,
  setFactors,
  addFactors,
  teams: teamsWithFactors
}) {
  useEffect(() => {
    setFactors([
      { key: "winningPercentage", order: DESCENDING },
      { key: "mascotWeight", order: DESCENDING }
    ]);
  }, [setFactors]);

  const toggleStatOrder = useCallback(
    key => setFactors(toggleOrderForFactorByKey(factors, key)),
    [factors, setFactors]
  );

  // Teams ranked by the selected factors
  const rankedTeams = rankBy(teamsWithFactors, factors);
  const stats = factors.map(factor => {
    const source = DATA_SOURCES.find(source => source.key === factor.key);
    return {
      key: factor.key,
      name: source.name,
      order: factor.order,
      render: value => source.render(value)
    };
  });
  return (
    <>
      <p>The easiest way to build your own computer poll.</p>
      <p>
        Select one or more of the following stats. Teams will be sorted by each
        stat, using the next stat as a tie-breaker if needed.
      </p>

      <SelectedFactors factors={factors} setFactors={setFactors} />

      <AvailableDataSources
        factors={factors}
        addFactors={addFactors}
        setFactors={setFactors}
      />

      <SimpleSortRankedTeams
        teams={rankedTeams}
        stats={stats}
        toggleStatOrder={toggleStatOrder}
      />
    </>
  );
}
