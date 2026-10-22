import type { ReactNode } from "react";

/**
 * Route layout for content pages: applies the site type scale (see .type-scale in
 * app/globals.css). The wrapper uses display: contents, so it does not affect page layout.
 */
export default function TypeScale({ children }: { children: ReactNode }) {
  return <div className="type-scale">{children}</div>;
}
