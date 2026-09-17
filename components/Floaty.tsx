"use client";

/**
 * Floaty on the hero: she bobs, blinks, follows the pointer and squashes when poked.
 *
 * She is the app icon in three layers rather than one flat image, because the eye has
 * to move independently of the head:
 *
 *   floatyDuck-body.png   the icon with the eye painted out
 *   floatyDuck-eye.png    the eye alone, matted against that same background
 *
 * Stacked at rest the two are the original artwork again, to within a rounding error.
 * Both layers are the full 499x500 frame, so they need no positioning of their own --
 * `inset: 0` lines them up, and the only numbers here are where a blink pivots and how
 * far a glance carries the eye.
 *
 * Only `transform` and `opacity` are ever animated, so nothing here touches layout.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import s from "./floaty.module.css";

/**
 * Where a blink pivots, in frame coordinates.
 *
 * Not the eye's centre (that is 20.8%) but a little below it: a lid comes down over
 * the eye rather than closing on it from both sides, so the slit it leaves sits in
 * the lower third of where the eye was.
 */
const EYE_ORIGIN = "59.42% 22.3%";

/**
 * How far a glance carries the eye, as a percentage of the frame.
 *
 * Her whole eye is 8.8% of the frame wide, so these are about a quarter of its width
 * and a sixth of its height -- plainly a look, and still short of the googly.
 */
const GAZE_X = 2.2;
const GAZE_Y = 2.0;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The largest square that still fits the container, never above `size`.
 *
 * Measured rather than left to CSS because the bob and the squash are in pixels: a
 * spring tuned for a 396px duck reads as a twitch on a 220px one.
 */
function useFitSize(size: number, hostRef: React.RefObject<HTMLElement | null>) {
  const [side, setSide] = useState(size);

  useEffect(() => {
    const el = hostRef.current;
    const parent = el?.parentElement ?? el;
    if (!parent) return;

    const measure = () => {
      const w = parent.clientWidth || window.innerWidth;
      setSide(Math.max(120, Math.min(size, Math.floor(w))));
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [size, hostRef]);

  return side;
}

export function Floaty({
  size = 396,
  label = "Floaty. Poke her.",
}: {
  size?: number;
  label?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const gazeRef = useRef<HTMLSpanElement>(null);
  const lidRef = useRef<HTMLSpanElement>(null);
  const side = useFitSize(size, buttonRef);

  useEffect(() => {
    const button = buttonRef.current;
    const stage = stageRef.current;
    const gaze = gazeRef.current;
    const lid = lidRef.current;
    if (!button || !stage || !gaze || !lid) return;

    /* Reduced motion: she is simply there. No bob, no blink, no gaze -- the poke still
       answers, as a 120ms opacity dip, so the page is not inert. */
    if (prefersReducedMotion()) {
      const dip = () => {
        stage.style.transition = "opacity 120ms ease-out";
        stage.style.opacity = "0.65";
        window.setTimeout(() => (stage.style.opacity = "1"), 120);
      };
      button.addEventListener("pointerdown", dip);
      return () => button.removeEventListener("pointerdown", dip);
    }

    let raf = 0;
    let disposed = false;

    /* --- the squash spring. Critically underdamped, because a poke is physical. --- */
    const ZETA = 0.62;
    const RESPONSE = 0.32;
    const W = (2 * Math.PI) / RESPONSE;
    let sp = 0; // 0 = at rest, negative = squashed
    let v = 0;

    let last = performance.now();
    const start = last;

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      // Spring integrates from its own live value, so an interrupting poke never
      // jumps -- it just re-targets from wherever she currently is.
      if (Math.abs(sp) > 0.0005 || Math.abs(v) > 0.0005) {
        const a = -W * W * sp - 2 * ZETA * W * v;
        v += a * dt;
        sp += v * dt;
      } else {
        sp = 0;
        v = 0;
      }

      const bob = -Math.sin(((now - start) / 2400) * Math.PI * 2) * (0.75 / 22) * side;
      const sy = 1 + sp;
      const sx = 1 - sp * 0.55;
      stage.style.transform = `translate3d(0, ${bob.toFixed(2)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* --- blink: 110ms, every 4-7s. The lid is the eye layer squeezed to a slit
           about EYE_ORIGIN, which is what a closing eyelid leaves behind. --- */
    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        lid.style.transform = "scaleY(0.08)";
        window.setTimeout(() => {
          lid.style.transform = "scaleY(1)";
          scheduleBlink();
        }, 110);
      }, 4000 + Math.random() * 3000);
    };
    scheduleBlink();

    /* --- gaze. She faces right, so she can look ahead or right, level or down. --- */
    let pointerSeen = false;
    let wander = 0;
    let gx: 0 | 1 = 0;
    let gy: 0 | 1 = 0;

    const setGaze = (nx: 0 | 1, ny: 0 | 1) => {
      if (nx === gx && ny === gy) return;
      gx = nx;
      gy = ny;
      gaze.style.transform = `translate(${gx * GAZE_X}%, ${gy * GAZE_Y}%)`;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerSeen = true;
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width * 0.594; // her eye sits right of centre
      const cy = r.top + r.height * 0.208;
      setGaze(e.clientX - cx > r.width * 0.06 ? 1 : 0, e.clientY - cy > r.height * 0.1 ? 1 : 0);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* No pointer (a phone), so she looks around on her own. */
    wander = window.setInterval(() => {
      if (pointerSeen) return;
      setGaze(Math.random() < 0.5 ? 0 : 1, Math.random() < 0.7 ? 0 : 1);
    }, 2200);

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
  }, [side]);

  return (
    <button ref={buttonRef} className="floatyButton" aria-label={label} type="button">
      <span
        ref={stageRef}
        className={s.stage}
        style={{ width: side, height: side, transformOrigin: "50% 88%" }}
      >
        <Image
          className={s.layer}
          src="/floatyDuck-body.png"
          alt=""
          width={side}
          height={side}
          priority
        />
        <span ref={gazeRef} className={s.gaze}>
          <span ref={lidRef} className={s.lid} style={{ transformOrigin: EYE_ORIGIN }}>
            <Image
              className={s.layer}
              src="/floatyDuck-eye.png"
              alt=""
              width={side}
              height={side}
              priority
            />
          </span>
        </span>
      </span>
    </button>
  );
}
