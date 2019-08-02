import React from "react";
import minBy from "lodash/minBy";
import { luminance } from "./color";

export default function Rank({ team, rank, children }) {
  const { school, mascot, logos, color, alt_color } = team;

  const colors = [color || "#000000", alt_color || "#ffffff"];
  const darkestColor = minBy(colors, luminance);

  return (
    <li key={school}>
      {rank}.
      <img src={logos[0]} alt="" width="24" />
      {school}{" "}
      <span style={{ color: darkestColor, fontStyle: "italic" }}>{mascot}</span>
      <br />
      {children}
    </li>
  );
}
