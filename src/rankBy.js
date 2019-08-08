import orderBy from "lodash/orderBy";
import isEqual from "lodash/isEqual";

const shallowCopy = obj => ({ ...obj });

export default function rankBy(teams, factors) {
  const result = orderBy(
    teams,
    factors.map(factor => factor.key),
    factors.map(factor => factor.order)
  ).map(shallowCopy);
  result.forEach((team, index) => {
    team.score = factors.map(factor =>
      factor.key.call ? factor.key(team) : team[factor.key]
    );
    const previousTeam = result[index - 1];
    const rank =
      index > 0 && isEqual(team.score, previousTeam.score)
        ? previousTeam.rank
        : index + 1;
    team.rank = rank;
  });
  return result;
}
