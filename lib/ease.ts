/** Small helpers for scroll-driven motion. */

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progress through the window [a, b] of an overall 0..1 timeline. */
export const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/** Smooth in and out. Apple's device pages never start or stop abruptly. */
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Fast out, slow in -- for things arriving. */
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
