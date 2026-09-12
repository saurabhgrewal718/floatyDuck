"use client";

/**
 * The explainer video, sitting straight under the hero.
 *
 * Shaped after tryglance.app's clips: muted, inline, looping, and started only once
 * it is actually on screen -- a video decoding in a section nobody has scrolled to is
 * pure battery. `preload="metadata"` keeps the first paint cheap.
 *
 * TO ADD THE REAL VIDEO: drop the file in /public and pass its path as `src`
 * (see app/page.tsx). Until then this renders a labelled placeholder rather than a
 * broken player.
 */

import { useEffect, useRef } from "react";
import { DuckMark } from "./Logo";
import s from "./video.module.css";

export function VideoHolder({ src, poster }: { src?: string; poster?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [src]);

  return (
    <section className={s.section}>
      <div className={s.frame} ref={hostRef}>
        {src ? (
          <video
            ref={videoRef}
            className={s.video}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Floaty Duck, in about a minute"
          />
        ) : (
          <div className={s.placeholder}>
            <span className={s.badge}>
              <DuckMark size={22} />
            </span>
            <p className={s.placeholderText}>Your video goes here</p>
            <p className={s.placeholderHint}>
              Drop the file in /public and pass it as <code>src</code>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
