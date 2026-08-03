import * as React from "react";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export default function Badge({ className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full border border-[#dbe7f3] bg-white px-3 py-1 text-[12px] font-semibold tracking-[0.06em] text-[#4f87cb] ${className}`.trim()}
    />
  );
}
