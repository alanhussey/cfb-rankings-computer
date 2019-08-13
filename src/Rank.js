import React from "react";
import minBy from "lodash/minBy";
import { luminance } from "./color";

export default function Rank({ team, rank, children }) {
  const { school, mascot, logos, color, alt_color } = team;

  const colors = [color || "#000000", alt_color || "#ffffff"];
  const darkestColor = minBy(colors, luminance);

  return (
    <tr>
      <td>{rank}</td>
      <td>
        <img src={logos[0]} alt="" loading="lazy" />
        {school}{" "}
        <span className="Rank-mascot-name" style={{ color: darkestColor }}>
          {mascot}
        </span>
      </td>
      {children}
    </tr>
  );
}
