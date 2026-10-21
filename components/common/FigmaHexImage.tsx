"use client";

import { useId, type CSSProperties } from "react";

// Pointy-top hexagon as Figma draws a 6-point polygon in a w x h box: corners on
// the inscribed ellipse, so the sides sit at 0.866w, not the box edges. Each
// corner is rounded like Figma's corner radius (tangent length r / tan(60deg)).
function roundedHexPath(w: number, h: number, r: number) {
  const side = (w / 2) * (Math.sqrt(3) / 2);
  const points = [
    [w / 2, 0],
    [w / 2 + side, h / 4],
    [w / 2 + side, (3 * h) / 4],
    [w / 2, h],
    [w / 2 - side, (3 * h) / 4],
    [w / 2 - side, h / 4],
  ];
  const t = r / Math.sqrt(3);
  const along = (from: number[], to: number[]) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return [from[0] + ((to[0] - from[0]) * t) / len, from[1] + ((to[1] - from[1]) * t) / len];
  };

  return (
    points
      .map((point, i) => {
        const prev = points[(i + points.length - 1) % points.length];
        const next = points[(i + 1) % points.length];
        const start = along(point, prev);
        const end = along(point, next);
        return `${i === 0 ? "M" : "L"}${start[0]},${start[1]} Q${point[0]},${point[1]} ${end[0]},${end[1]}`;
      })
      .join(" ") + " Z"
  );
}

type FigmaHexImageProps = {
  src: string;
  /** Empty for decorative photos. */
  alt: string;
  /** Figma polygon box. */
  w: number;
  h: number;
  radius: number;
  /** Figma's inside stroke, drawn white. */
  stroke: number;
  /** Visible part of the photo, from Figma's image transform: width, left, height, top (0-1). */
  crop: readonly [number, number, number, number];
  className?: string;
  style?: CSSProperties;
};

/** A photo in a Figma rounded hexagon, positioned by the caller. */
export default function FigmaHexImage({ src, alt, w, h, radius, stroke, crop, className = "", style }: FigmaHexImageProps) {
  // useId output contains ":" which breaks url(#...) references.
  const clipId = `hex-${useId().replace(/[^\w-]/g, "")}`;
  const path = roundedHexPath(w, h, radius);
  // Scale the photo so only its cropped part fills the polygon box.
  const [cropW, cropX, cropH, cropY] = crop;
  const imageW = w / cropW;
  const imageH = h / cropH;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      className={`absolute overflow-visible ${className}`}
      style={style}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image href={src} x={-cropX * imageW} y={-cropY * imageH} width={imageW} height={imageH} preserveAspectRatio="none" />
        {/* Doubled and clipped, so it reads as Figma's inside stroke. */}
        {stroke > 0 && <path d={path} fill="none" stroke="#fff" strokeWidth={stroke * 2} />}
      </g>
    </svg>
  );
}
