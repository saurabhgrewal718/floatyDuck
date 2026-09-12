/**
 * TEMPORARY MARK.
 *
 * Until there is real artwork, the logo is Floaty herself: the same 18x18 grid the
 * app rasterises, drawn as SVG rects so it stays sharp at any size instead of being
 * resampled. The tile is her outline colour -- a yellow duck on a yellow tile would
 * have no contrast, and dark-tile-with-bright-glyph is how a Mac app icon reads.
 *
 * TO REPLACE: swap the <DuckMark /> below for an <Image> of the real icon. Nothing
 * else on the site imports it.
 */

import Link from "next/link";
import { duckRects } from "@/lib/duck";
import s from "./logo.module.css";

export function DuckMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      /* Cropped to rows/cols 1-16: the grid's outer margin exists so the app's idle
         bob has slack, and inside a tile it just shrinks her for no reason. */
      viewBox="1 1 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {duckRects().map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={1} height={1} fill={p.c} />
      ))}
    </svg>
  );
}

export function Logo() {
  return (
    <Link className={s.logo} href="/" aria-label="Floaty Duck, home">
      <span className={s.tile}>
        <DuckMark size={26} />
      </span>
      <span className={s.word}>Floaty Duck</span>
    </Link>
  );
}
