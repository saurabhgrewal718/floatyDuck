"use client";

/**
 * One Mac, pinned, with three acts playing inside its screen as you scroll.
 *
 *   0.00 - 0.11   the lid comes up, hinged off the deck
 *   0.08 - 0.17   the desktop boots: menu bar and dock, screen otherwise bare
 *   0.15 - 0.22   Floaty arrives, dead centre and very large
 *   0.23 - 0.34   she shrinks and travels to the bottom-left, where she really lives
 *   0.28 - 0.42   a window turns up; the desktop starts looking used
 *
 *   ACT 1  0.34 - 0.52   WATER      droplets rise up the side of everything
 *   ACT 2  0.54 - 0.74   EYE REST   the screen goes dark and she dances
 *   ACT 3  0.78 - 1.00   TIMER      a countdown over her head, then a notification
 *
 * SMOOTHNESS IS AN ARCHITECTURE PROBLEM HERE, NOT A DRAW-CALL ONE. What costs is
 * compositing, so:
 *
 * - She is one <img> in a box fixed at the biggest she ever gets, and every size she
 *   takes in the scene is a `scale()` down from it. Her box is laid out once per
 *   resize; crossing the screen and growing are compositor work with no repaint.
 * - The droplets get a narrow strip, not a full-screen canvas.
 * - Styles are written only when their value actually changes.
 * - Nothing inside the screen uses `backdrop-filter`: it sits on a rotating element,
 *   so the compositor would re-blur it every frame.
 *
 * She is never rotated -- she turns by an exact horizontal flip, which on `.duck`'s
 * `transform-origin: 0 0` means anchoring to the right edge of her box instead of the
 * left. That is the `cx + half` in the flipped branch.
 */

import Image from "next/image";
import { useEffect, useRef } from "react";
import { MacChrome } from "./MacChrome";
import { DuckMark } from "./Logo";
import { getStageSound, type Act } from "@/lib/stageSound";
import { clamp, lerp, outCubic, phase, smooth } from "@/lib/ease";
import s from "./macstage.module.css";

interface Drop {
  x: number;
  y: number;
  vy: number;
  drift: number;
  ph: number;
}

interface Sweat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const STRIP = 0.26;

/**
 * The three sizes she plays at, as fractions of the screen's height: arriving, parked
 * in her corner, and dancing in the dark. BIG is also the size her element is built
 * at, so every scale in the scene is a shrink and she is never blown up past her art.
 */
const BIG = 0.44;
const SMALL = 0.07;
const DANCE = 0.3;

const mmss = (total: number) => {
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

export function MacStage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const macRef = useRef<HTMLDivElement>(null);
  const duckRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLCanvasElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const track = trackRef.current;
    const mac = macRef.current;
    const duck = duckRef.current;
    const dropC = dropRef.current;
    const chrome = chromeRef.current;
    const win = windowRef.current;
    const dark = darkRef.current;
    const badge = badgeRef.current;
    const note = noteRef.current;
    if (!track || !mac || !duck || !dropC || !chrome || !win || !dark || !badge || !note) return;

    const pctx = dropC.getContext("2d");
    if (!pctx) return;

    const sound = getStageSound();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let stripW = 0;
    let base = 0; // her box in CSS pixels: the biggest she ever gets

    const measure = () => {
      /* Layout size, NOT getBoundingClientRect: the rect is the TRANSFORMED box, so
         while the lid is rotated back it reports a few pixels of height and every
         backing store gets stretched to fill its CSS box. */
      w = mac.offsetWidth;
      h = mac.offsetHeight;
      stripW = Math.round(w * STRIP);
      dropC.width = Math.round(stripW * dpr);
      dropC.height = Math.round(h * dpr);
      dropC.style.width = `${stripW}px`;
      dropC.style.height = `${h}px`;
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pctx.imageSmoothingEnabled = false;

      base = Math.max(24, Math.round(h * BIG));
      duck.style.width = `${base}px`;
      duck.style.height = `${base}px`;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(mac);

    /* A droplet, rendered once, then blitted. */
    const SP = 26;
    const sprite = document.createElement("canvas");
    sprite.width = SP * dpr;
    sprite.height = SP * dpr;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.font = `20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      sctx.textBaseline = "middle";
      sctx.textAlign = "center";
      sctx.fillText("💧", SP / 2, SP / 2);
    }

    const drops: Drop[] = [];
    const sweat: Sweat[] = [];
    let stripDirty = false;

    const drawStrip = () => {
      pctx.clearRect(0, 0, stripW, h);
      for (const d of drops) {
        pctx.globalAlpha = clamp(1.15 - (1 - d.y / (h * 0.9)) * 1.1);
        pctx.drawImage(sprite, d.x + Math.sin(d.ph) * d.drift - SP / 2, d.y - SP / 2, SP, SP);
      }
      for (const sw of sweat) {
        pctx.globalAlpha = clamp(sw.life);
        pctx.drawImage(sprite, sw.x - SP / 2, sw.y - SP / 2, SP, SP);
      }
      pctx.globalAlpha = 1;
      stripDirty = drops.length > 0 || sweat.length > 0;
    };

    const prev: Record<string, string> = {};
    const set = (el: HTMLElement, prop: "transform" | "opacity", key: string, val: string) => {
      if (prev[key] === val) return;
      prev[key] = val;
      el.style[prop] = val;
    };
    const setText = (el: HTMLElement, key: string, val: string) => {
      if (prev[key] === val) return;
      prev[key] = val;
      el.textContent = val;
    };

    let spawn = 0;
    let lastSweat = 0;
    let dinged = false;

    const render = (p: number, dt: number, now: number) => {
      const lid = smooth(phase(p, 0, 0.11));
      const arrive = outCubic(phase(p, 0.15, 0.22));
      const travel = smooth(phase(p, 0.23, 0.34));
      const water = phase(p, 0.36, 0.5) * (1 - smooth(phase(p, 0.5, 0.54)));
      const roam = smooth(phase(p, 0.55, 0.6)) * (1 - smooth(phase(p, 0.7, 0.74)));
      const blackout = smooth(phase(p, 0.54, 0.58)) * (1 - smooth(phase(p, 0.7, 0.74)));
      const timer = phase(p, 0.78, 0.93);
      const fired = phase(p, 0.93, 0.97);

      set(mac, "transform", "macT",
        `perspective(1600px) rotateX(${lerp(-82, 0, lid).toFixed(2)}deg) scale(${lerp(0.86, 1, lid).toFixed(3)})`);
      /* Fully opaque from the first pixel. Fading in from 0.15 left a near-blank
         screen at the top of the track; a closed laptop is a fine opening image. */
      set(mac, "opacity", "macO", "1");
      set(chrome, "opacity", "chrO", phase(p, 0.08, 0.17).toFixed(3));
      set(win, "opacity", "winO", (smooth(phase(p, 0.28, 0.42)) * (1 - blackout)).toFixed(3));
      set(dark, "opacity", "drkO", blackout.toFixed(3));

      /* --- where she is --- */
      const cornerX = w * 0.075;
      const cornerY = h * 0.855;
      let cx = lerp(w / 2, cornerX, travel);
      let cy = lerp(h / 2, cornerY, travel);
      let side = h * lerp(BIG, SMALL, travel);
      let flip = false;

      if (roam > 0) {
        // Dancing: a slow wander plus a quick bob, and she turns by a flip rather than
        // a rotation -- a duck that banks like an aeroplane is a different character.
        const wx = w / 2 + Math.sin(now / 900) * w * 0.26;
        const wy = h / 2 + Math.sin(now / 620) * h * 0.2 + Math.sin(now / 210) * 6;
        cx = lerp(cornerX, wx, roam);
        cy = lerp(cornerY, wy, roam);
        side = h * lerp(SMALL, DANCE, roam);
        flip = roam > 0.35 && Math.cos(now / 900) < 0;
      }

      const half = side / 2;
      const k = side / base;
      set(duck, "transform", "dkT",
        flip
          ? `translate3d(${(cx + half).toFixed(1)}px,${(cy - half).toFixed(1)}px,0) scale(${(-k).toFixed(4)},${k.toFixed(4)})`
          : `translate3d(${(cx - half).toFixed(1)}px,${(cy - half).toFixed(1)}px,0) scale(${k.toFixed(4)})`);
      set(duck, "opacity", "dkO", arrive.toFixed(3));

      /* --- act 1: water --- */
      if (water > 0.01) {
        spawn += dt * (2.2 + water * 2.4);
        while (spawn > 1) {
          spawn -= 1;
          drops.push({
            x: cx,
            y: cy,
            vy: 70 + Math.random() * 8,
            drift: 6 + Math.random() * 10,
            ph: Math.random() * Math.PI * 2,
          });
        }
        if (now - lastSweat > 780) {
          lastSweat = now;
          for (let i = 0; i < 2; i++) {
            sweat.push({
              x: cx + side * (0.056 + Math.random() * 0.167),
              y: cy - side * 0.278,
              vx: 26 + Math.random() * 30,
              vy: -46 - Math.random() * 26,
              life: 1,
            });
          }
        }
      } else if (p > 0.54 && (drops.length || sweat.length)) {
        // The act is over; do not carry its droplets into the dark.
        drops.length = 0;
        sweat.length = 0;
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y -= d.vy * dt;
        d.ph += dt * 1.7;
        if (d.y < -SP) drops.splice(i, 1);
      }
      for (let i = sweat.length - 1; i >= 0; i--) {
        const sw = sweat[i];
        sw.x += sw.vx * dt;
        sw.y += sw.vy * dt;
        sw.vy += 150 * dt;
        sw.life -= dt * 1.15;
        if (sw.life <= 0) sweat.splice(i, 1);
      }
      if (drops.length || sweat.length || stripDirty) drawStrip();

      /* --- act 3: the timer --- */
      const showBadge = phase(p, 0.76, 0.79) * (1 - smooth(phase(p, 0.985, 1)));
      set(badge, "opacity", "bgO", showBadge.toFixed(3));
      set(badge, "transform", "bgT",
        `translate3d(${(cx - half - 6).toFixed(1)}px,${(cy - half - 26).toFixed(1)}px,0)`);
      setText(badge, "bgX", mmss(Math.max(0, Math.round((1 - timer) * 1500))));

      set(note, "opacity", "ntO", fired.toFixed(3));
      set(note, "transform", "ntT",
        `translate3d(${lerp(24, 0, outCubic(fired)).toFixed(1)}px,0,0)`);

      /* Scroll drives the sound. The module stops the outgoing act before starting
         the incoming one, so two are never audible at once. */
      let cue: Act = "none";
      if (p >= 0.34 && p < 0.53) cue = "water";
      else if (p >= 0.53 && p < 0.75) cue = "eye";
      else if (p >= 0.75) cue = "timer";
      sound.setAct(cue);

      if (p >= 0.93 && !dinged) {
        dinged = true;
        sound.ding();
      }
      if (p < 0.9) dinged = false;

      /* --- captions, one per act --- */
      const caps = [
        phase(p, 0.34, 0.4) * (1 - smooth(phase(p, 0.5, 0.55))),
        phase(p, 0.55, 0.6) * (1 - smooth(phase(p, 0.73, 0.77))),
        phase(p, 0.78, 0.83),
      ];
      caps.forEach((v, i) => {
        const el = capRefs.current[i];
        if (!el) return;
        set(el, "opacity", `cap${i}`, v.toFixed(3));
        set(el, "transform", `capT${i}`, `translate3d(0,${lerp(12, 0, smooth(v)).toFixed(1)}px,0)`);
      });
    };

    /* Reduced motion: no pinning, no lid, no dancing, no dark takeover. The water
       act's last frame, held -- a 6000px scroll-jacked sequence is precisely what
       someone asking for less motion is asking not to get. */
    if (still) {
      track.classList.add(s.stillTrack);
      mac.style.transform = "none";
      mac.style.opacity = "1";
      chrome.style.opacity = "1";
      win.style.opacity = "1";
      dark.style.opacity = "0";
      badge.style.opacity = "0";
      note.style.opacity = "0";
      capRefs.current.forEach((el, i) => {
        if (el) {
          el.style.opacity = i === 0 ? "1" : "0";
          el.style.transform = "none";
        }
      });
      const paint = () => {
        const side = h * SMALL;
        const half = side / 2;
        const cx = w * 0.075;
        const cy = h * 0.855;
        duck.style.transform =
          `translate3d(${cx - half}px,${cy - half}px,0) scale(${(side / base).toFixed(4)})`;
        duck.style.opacity = "1";
        drops.length = 0;
        for (let i = 0; i < 12; i++) {
          drops.push({ x: cx, y: cy - i * (h * 0.07), vy: 0, drift: 9, ph: i * 1.1 });
        }
        drawStrip();
      };
      paint();
      const ro2 = new ResizeObserver(() => {
        measure();
        paint();
      });
      ro2.observe(mac);
      return () => {
        ro.disconnect();
        ro2.disconnect();
      };
    }

    let scrollY = window.scrollY;
    let trackTop = 0;
    let span = 1;
    const remeasureTrack = () => {
      const r = track.getBoundingClientRect();
      trackTop = r.top + window.scrollY;
      span = Math.max(1, r.height - window.innerHeight);
    };
    remeasureTrack();

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => {
      remeasureTrack();
      measure();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        // Rain must not keep playing in a section nobody is looking at.
        if (!visible) sound.silence();
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(track);

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (visible) render(clamp((scrollY - trackTop) / span), dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      sound.silence();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className={s.track} ref={trackRef} data-stage-track aria-labelledby="acts-heading">
      <h2 className={s.srOnly} id="acts-heading">
        What Floaty does, on your screen
      </h2>

      <div className={s.stage} data-stage>
        <div className={s.macWrap}>
          <div className={s.mac} ref={macRef}>
            <div className={s.chrome} ref={chromeRef}>
              <MacChrome only="furniture" />
            </div>
            <div className={s.chromeWindow} ref={windowRef}>
              <MacChrome only="window" />
            </div>
            <canvas className={s.drops} ref={dropRef} aria-hidden="true" />
            <div className={s.dark} ref={darkRef} aria-hidden="true" />
            <div className={s.duck} ref={duckRef} aria-hidden="true">
              <Image
                className={s.duckArt}
                src="/floatyDuck.png"
                alt=""
                width={499}
                height={500}
                sizes="45vh"
              />
            </div>
            <div className={s.badge} ref={badgeRef} aria-hidden="true">
              25:00
            </div>
            <div className={s.note} ref={noteRef} aria-hidden="true">
              <span className={s.noteIcon}>
                <DuckMark size={20} />
              </span>
              <span className={s.noteBody}>
                <strong>Floaty Duck</strong>
                <span>That&rsquo;s time.</span>
              </span>
            </div>
          </div>
          <div className={s.deck} aria-hidden="true">
            <span className={s.notch} />
          </div>
        </div>

        <div className={s.captions}>
          <div className={s.caption} ref={(el) => { capRefs.current[0] = el; }}>
            <h3 className={s.capTitle}>Water, up the side of your screen.</h3>
            <p className={s.capBody}>
              Eight glasses between nine and nine, and she works out the gaps herself. No
              window opens &mdash; the droplets just rise past whatever you were doing.
            </p>
          </div>
          <div className={s.caption} ref={(el) => { capRefs.current[1] = el; }}>
            <h3 className={s.capTitle}>Eye rest. She takes the whole screen.</h3>
            <p className={s.capBody}>
              Every twenty minutes everything goes dark for a couple of seconds and she
              dances in the black. Shut your eyes until she stops.
            </p>
          </div>
          <div className={s.caption} ref={(el) => { capRefs.current[2] = el; }}>
            <h3 className={s.capTitle}>Timers, over her head.</h3>
            <p className={s.capBody}>
              Start one with a keystroke. The countdown sits above her, and when it runs
              out you get three little dings and a notification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
