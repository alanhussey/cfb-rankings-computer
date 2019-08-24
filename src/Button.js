import React from "react";
import classnames from "classnames";

const Button = ({ className, onClick, children, ...props }) => (
  <button
    className={classnames("Button", className)}
    type="button"
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

export default Button;
