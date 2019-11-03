import React from "react";

const Emoji = ({ emoji, label }) => {
  if (typeof label !== "string" || label.length === 0)
    throw new TypeError(
      "<Emoji /> requires a human-readable label for accessibility"
    );
  return (
    <span role="img" aria-label={label}>
      {emoji}
    </span>
  );
};

export default Emoji;
