"use client";

/**
 * The explainer video, sitting straight under the hero.
 *
 * TWO SHAPES, PICKED FROM THE URL IN `VIDEO`. A direct file (.mp4 in /public, Blob,
 * R2) plays in a bare <video>: muted, looping, started only once it is actually on
 * screen, no player chrome at all. That is the nicer of the two and what this page
 * was drawn for.
 *
 * A Vimeo link cannot go in a <video> tag -- it is a web page wrapping a player, not
 * a file -- so it plays in Vimeo's iframe instead. To keep that player's chrome off
 * the page until someone actually wants it, the frame rests as the poster with a
 * button over it, and the iframe is only built on the click. Nothing of Vimeo's
 * loads before then: no iframe, no script, no cookie, no third party on first paint.
 * The click doubles as the user gesture the player needs to start with its sound on,
 * which is the point of a trailer -- and it means nothing moves or speaks on this
 * page until it is asked to, so there is no autoplay to take away from someone who
 * asked for less motion.
 */

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { DuckMark } from "./Logo";
import { VIDEO, VIDEO_POSTER } from "@/lib/links";
import s from "./video.module.css";

/* -------------------------------------------------------------- reading ---- */

type Source =
  | { kind: "none" }
  | { kind: "file"; src: string }
  | { kind: "vimeo"; id: string; hash?: string };

/**
 * Vimeo hands out several shapes of link and they all have to land here: the short
 * vimeo.com/123, the player.vimeo.com/video/123 an embed uses, the channel and
 * showcase paths that bury the id one segment deeper, and the unlisted form that
 * carries a privacy hash -- as a trailing path segment on newer links, as ?h= on
 * older ones. The id is the first run of digits in the path; everything before it is
 * routing, and the segment after it is the hash if it looks like one.
 */
function read(url: string): Source {
  const trimmed = url.trim();
  if (!trimmed) return { kind: "none" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // A root-relative path -- /floaty.mp4 -- is a file, and is not a valid URL alone.
    return { kind: "file", src: trimmed };
  }

  if (!/(^|\.)vimeo\.com$/i.test(parsed.hostname)) return { kind: "file", src: trimmed };

  const parts = parsed.pathname.split("/").filter(Boolean);
  const at = parts.findIndex((part) => /^\d{6,}$/.test(part));
  if (at === -1) return { kind: "none" };

  const after = parts[at + 1];
  const hash = after && /^[0-9a-z]{4,}$/i.test(after) ? after : parsed.searchParams.get("h");

  return { kind: "vimeo", id: parts[at], hash: hash ?? undefined };
}

/** The player's own share params (share, fl, fe) are for Vimeo's analytics and mean
 *  nothing to an embed; the ones that matter are the ones turning its furniture off. */
function embedSrc(id: string, hash?: string): string {
  const params = new URLSearchParams({
    autoplay: "1",     // allowed: the iframe only exists because someone clicked
    title: "0",
    byline: "0",
    portrait: "0",
    badge: "0",
    playsinline: "1",  // or an iPhone takes the whole screen for it
    dnt: "1",          // ask the player not to set tracking cookies
  });
  if (hash) params.set("h", hash);
  return `https://player.vimeo.com/video/${id}?${params}`;
}

/* ------------------------------------------------------------- the file ---- */

function FilePlayer({ src, poster }: { src: string; poster?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;

    /* Someone who asked for less motion did not ask for a clip that starts itself and
       never stops. They get the poster, the real controls, and no loop -- watching it
       becomes something they choose rather than something that happens at them. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      video.loop = false;
      return;
    }

    // A pause has to survive scrolling away and back, or the observer would undo it.
    let pausedByUser = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!pausedByUser) void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(host);

    const toggle = () => {
      pausedByUser = !video.paused;
      if (video.paused) void video.play().catch(() => {});
      else video.pause();
    };
    video.addEventListener("click", toggle);

    return () => {
      io.disconnect();
      video.removeEventListener("click", toggle);
    };
  }, [src]);

  return (
    <div className={s.frame} ref={hostRef}>
      <video
        ref={videoRef}
        className={s.video}
        src={src}
        poster={poster || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Floaty Duck, in about a minute. Click to pause."
      />
    </div>
  );
}

/* ------------------------------------------------------------ the embed ---- */

function VimeoPlayer({ id, hash, poster }: { id: string; hash?: string; poster?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={s.frame}>
      {playing ? (
        <iframe
          className={s.iframe}
          src={embedSrc(id, hash)}
          title="Floaty Duck"
          /* autoplay has to be handed down explicitly: this frame is another origin,
             and without the grant the player comes up silent or stopped. */
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className={s.facade} onClick={() => setPlaying(true)}>
          {poster ? (
            /* Her own art, not a frame of the film: it is a square sprite with a
               transparent ground, so it is sat whole on the paper rather than cropped
               to a strip across her middle the way `cover` would. Her intrinsic size,
               not the frame's -- the CSS does the fitting. */
            <Image className={s.poster} src={poster} alt="" width={499} height={500} />
          ) : (
            <span className={s.badge}>
              <DuckMark size={22} />
            </span>
          )}
          <span className={s.play}>
            <svg viewBox="0 0 12 14" width="11" height="13" aria-hidden="true">
              <path d="M0 0.8v12.4a.8.8 0 0 0 1.22.68l10-6.2a.8.8 0 0 0 0-1.36l-10-6.2A.8.8 0 0 0 0 .8Z" />
            </svg>
            Watch the trailer
          </span>
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- both ---- */

export function VideoHolder({
  src = VIDEO,
  poster = VIDEO_POSTER,
}: {
  src?: string;
  poster?: string;
}) {
  const source = useMemo(() => read(src), [src]);

  return (
    <section className={s.section}>
      {source.kind === "vimeo" ? (
        <VimeoPlayer id={source.id} hash={source.hash} poster={poster} />
      ) : source.kind === "file" ? (
        <FilePlayer src={source.src} poster={poster} />
      ) : (
        <div className={s.frame}>
          <div className={s.placeholder}>
            <span className={s.badge}>
              <DuckMark size={22} />
            </span>
            <p className={s.placeholderText}>Your video goes here</p>
            <p className={s.placeholderHint}>
              Put a direct <code>.mp4</code> link, or a Vimeo one, in <code>VIDEO</code>,
              in <code>lib/links.ts</code>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
