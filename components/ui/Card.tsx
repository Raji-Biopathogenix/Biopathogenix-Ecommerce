import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export default function Card({ className = "", ...props }: CardProps) {
  return <div {...props} className={`premium-card ${className}`.trim()} />;
}
