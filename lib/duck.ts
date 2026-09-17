/**
 * Floaty's pixel art, ported from the app's tools/gen-duck.mjs.
 *
 * NOTHING RENDERS THIS ANY MORE. The site draws her from /floatyDuck.png instead, and
 * this file is kept only because app/globals.css takes its whole palette from the
 * seven colours below, and because the app still ships the grid. Delete it and update
 * that stylesheet's comment together, or not at all.
 *
 * THE SEVEN COLOURS BELOW ARE ALSO THE PAGE'S PALETTE. That is deliberate: the site
 * has no colours of its own, it borrows hers. See app/globals.css.
 */

/** The duck's own palette. Six colours plus transparent. */
export const PALETTE: Record<string, string | null> = {
  ".": null,        // transparent
  K: "#3f2832",     // outline, eye, feet
  D: "#9e2835",     // under-beak shadow
  R: "#e43b44",     // beak
  O: "#f77622",     // deepest body shading
  A: "#feae34",     // body shading
  Y: "#fee761",     // body
};

/** 18 rows x 18 cols. She faces right and occupies rows 1-16, cols 1-16. */
const ART = [
  "..................",
  "........KKKK......",
  ".......KYYYYK.....",
  "......KYYYYYYK....",
  "......KYKYYYYK....",
  "......KYKYYYYKKK..",
  "......KYYYYYYKRRK.",
  "......KYYYYYYKDK..",
  ".....KYYYYYYYK....",
  "...KKYYYYYYYYAK...",
  "..KYYYYYYYYYYAAK..",
  ".KYYYKKKKKYYAAAK..",
  ".KYYKYYYYYKYAAAK..",
  ".KYYYKKKKKYYAAOK..",
  "..KYYYYYYYYAAAOK..",
  "...KKAAAAAAAOOK...",
  ".....KKK..KKK.....",
  "..................",
];

export const ART_GRID = 18;

/**
 * The field is bigger than she is. The margin is what lets the idle bob and the
 * poke squash move without clipping, and it gives emotes somewhere to sit --
 * exactly the reason the app pads its 18x18 art into a 256px canvas.
 */
export const FIELD = 22;
const OFFSET = (FIELD - ART_GRID) / 2; // 2

/** Where her eye lives in art coordinates. One pixel wide, two tall. */
const EYE_X = 8;
const EYE_Y = 4;

export type Expression = "idle" | "blink" | "shut";

export interface DuckState {
  /** Gaze offset in art pixels. x: 0 ahead, 1 right. y: 0 level, 1 down. */
  gazeX?: 0 | 1;
  gazeY?: 0 | 1;
  expression?: Expression;
}

/**
 * Her pixels in plain 18x18 coordinates, for drawing as SVG rects rather than
 * onto a canvas -- which is what the logo needs, because SVG stays sharp at the
 * fractional sizes a 26px tile forces.
 */
export function duckRects(): Pixel[] {
  const out: Pixel[] = [];
  for (let y = 0; y < ART_GRID; y++) {
    for (let x = 0; x < ART_GRID; x++) {
      const c = PALETTE[ART[y][x]];
      if (c) out.push({ x, y, c });
    }
  }
  return out;
}

export interface Pixel {
  x: number;
  y: number;
  c: string;
}

/**
 * Her pixels for one state, in FIELD coordinates.
 *
 * Built by copying the grid and patching the eye rather than storing a frame per
 * expression: the eye is the only thing that ever moves, and a patch cannot drift
 * out of sync with the body the way a second copy of the art could.
 */
export function duckPixels(state: DuckState = {}): Pixel[] {
  const { gazeX = 0, gazeY = 0, expression = "idle" } = state;
  const rows = ART.map((r) => r.split(""));

  if (expression === "idle") {
    if (gazeX !== 0 || gazeY !== 0) {
      rows[EYE_Y][EYE_X] = "Y";
      rows[EYE_Y + 1][EYE_X] = "Y";
      rows[EYE_Y + gazeY][EYE_X + gazeX] = "K";
      rows[EYE_Y + 1 + gazeY][EYE_X + gazeX] = "K";
    }
  } else {
    // Blink and shut are the same frame: the eye opens up and a lid rules across it.
    rows[EYE_Y][EYE_X] = "Y";
    rows[EYE_Y + 1][EYE_X] = "Y";
    rows[EYE_Y + 1][EYE_X - 1] = "K";
    rows[EYE_Y + 1][EYE_X] = "K";
    rows[EYE_Y + 1][EYE_X + 1] = "K";
  }

  const out: Pixel[] = [];
  for (let y = 0; y < ART_GRID; y++) {
    for (let x = 0; x < ART_GRID; x++) {
      const c = PALETTE[rows[y][x]];
      if (c) out.push({ x: x + OFFSET, y: y + OFFSET, c });
    }
  }
  return out;
}
