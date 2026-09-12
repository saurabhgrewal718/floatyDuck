"use client";

/**
 * Two ways to put Floaty on the page.
 *
 * <Floaty> is the hero: she bobs, blinks, follows the pointer and squashes when poked.
 * She draws from lib/duck.ts, so she cannot drift from the app's art.
 *
 * Only `transform` and `opacity` are ever animated -- the canvas itself is redrawn just
 * when a pixel actually changes (a blink, a gaze shift), never per frame.
 */

import { useEffect, useRef, useState } from "react";
import { DuckState, FIELD, duckPixels } from "@/lib/duck";

/**
 * The largest whole number of screen pixels per art pixel that still fits the
 * container, never above `maxDp`.
 *
 * Whole numbers only: pixel art at a fractional scale gets uneven pixel widths,
 * which is exactly the blur the app's README goes out of its way to avoid.
 */
function useFitDp(maxDp: number, hostRef: React.RefObject<HTMLElement | null>) {
  const [dp, setDp] = useState(maxDp);

  useEffect(() => {
    const el = hostRef.current;
    const parent = el?.parentElement ?? el;
    if (!parent) return;

    const measure = () => {
      const w = parent.clientWidth || window.innerWidth;
      setDp(Math.max(4, Math.min(maxDp, Math.floor(w / FIELD))));
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [maxDp, hostRef]);

  return dp;
}

function paint(canvas: HTMLCanvasElement, pixels: { x: number; y: number; c: string }[], dp: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const side = FIELD * dp;
  canvas.width = side * dpr;
  canvas.height = side * dpr;
  canvas.style.width = `${side}px`;
  canvas.style.height = `${side}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, side, side);
  for (const p of pixels) {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x * dp, p.y * dp, dp, dp);
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ------------------------------------------------------------------ hero ---- */

export function Floaty({
  dp: maxDp = 14,
  label = "Floaty. Poke her.",
}: {
  dp?: number;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef<DuckState>({ gazeX: 0, gazeY: 0, expression: "idle" });
  const dp = useFitDp(maxDp, buttonRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!canvas || !button) return;

    const still = prefersReducedMotion();
    let raf = 0;
    let disposed = false;

    const redraw = () => paint(canvas, duckPixels(stateRef.current), dp);
    redraw();

    /* Reduced motion: she is simply there. No bob, no blink, no spring --
       the poke still answers, as a 120ms opacity dip, so the page is not inert. */
    if (still) {
      const dip = () => {
        canvas.style.transition = "opacity 120ms ease-out";
        canvas.style.opacity = "0.65";
        window.setTimeout(() => (canvas.style.opacity = "1"), 120);
      };
      button.addEventListener("pointerdown", dip);
      return () => button.removeEventListener("pointerdown", dip);
    }

    /* --- the squash spring. Critically underdamped, because a poke is physical. --- */
    const ZETA = 0.62;
    const RESPONSE = 0.32;
    const W = (2 * Math.PI) / RESPONSE;
    let s = 0; // 0 = at rest, negative = squashed
    let v = 0;

    let last = performance.now();
    const start = last;

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      // Spring integrates from its own live value, so an interrupting poke
      // never jumps -- it just re-targets from wherever she currently is.
      if (Math.abs(s) > 0.0005 || Math.abs(v) > 0.0005) {
        const a = -W * W * s - 2 * ZETA * W * v;
        v += a * dt;
        s += v * dt;
      } else {
        s = 0;
        v = 0;
      }

      const bob = -Math.sin(((now - start) / 2400) * Math.PI * 2) * 0.75 * dp;
      const sy = 1 + s;
      const sx = 1 - s * 0.55;
      canvas.style.transform = `translate3d(0, ${bob.toFixed(2)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* --- blink: 110ms, every 4-7s --- */
    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        stateRef.current = { ...stateRef.current, expression: "blink" };
        redraw();
        window.setTimeout(() => {
          stateRef.current = { ...stateRef.current, expression: "idle" };
          redraw();
          scheduleBlink();
        }, 110);
      }, 4000 + Math.random() * 3000);
    };
    scheduleBlink();

    /* --- gaze. She faces right, so she can look ahead or right, level or down. --- */
    let pointerSeen = false;
    let wander = 0;

    const setGaze = (gazeX: 0 | 1, gazeY: 0 | 1) => {
      const cur = stateRef.current;
      if (cur.gazeX === gazeX && cur.gazeY === gazeY) return;
      stateRef.current = { ...cur, gazeX, gazeY };
      if (cur.expression === "idle") redraw();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerSeen = true;
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width * 0.52; // her eye sits right of centre
      const cy = r.top + r.height * 0.42;
      setGaze(e.clientX - cx > r.width * 0.06 ? 1 : 0, e.clientY - cy > r.height * 0.1 ? 1 : 0);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* No pointer (a phone), so she looks around on her own. */
    const startWander = () => {
      wander = window.setInterval(() => {
        if (pointerSeen) return;
        setGaze(Math.random() < 0.5 ? 0 : 1, Math.random() < 0.7 ? 0 : 1);
      }, 2200);
    };
    startWander();

    /* --- the poke. On pointerdown, never on click: waiting for release feels dead. --- */
    const poke = () => {
      v = -3.2;
    };
    button.addEventListener("pointerdown", poke);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") poke();
    };
    button.addEventListener("keydown", onKey);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.clearInterval(wander);
      window.removeEventListener("pointermove", onPointerMove);
      button.removeEventListener("pointerdown", poke);
      button.removeEventListener("keydown", onKey);
    };
  }, [dp]);

  return (
    <button ref={buttonRef} className="floatyButton" aria-label={label} type="button">
      <canvas ref={canvasRef} style={{ transformOrigin: "50% 88%", display: "block" }} />
    </button>
  );
}
