"use client";

/**
 * The explainer video, sitting straight under the hero.
 *
 * TWO SHAPES, PICKED FROM THE URL IN `VIDEO`. A direct file (.mp4 in /public, Blob,
 * R2) plays in a bare <video>: muted, looping, started only once it is actually on
 * screen, no player chrome at all.
 *
 * A Vimeo link cannot go in a <video> tag -- it is a web page wrapping a player, not
 * a file -- so it plays in Vimeo's iframe instead, in the player's *background* mode:
 * it starts by itself, muted, loops, and draws none of Vimeo's own furniture. The
 * only controls on it are ours, two of them, play/pause and sound, talking to the
 * frame over the Vimeo SDK. The poster sits underneath until the first frame lands
 * so the box is never blank.
 *
 * Someone who asked for less motion still gets the frame, but it starts paused: the
 * play button is right there, and watching becomes something they choose.
 */

import Image from "next/image";
import type PlayerType from "@vimeo/player";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
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
    /* Background mode: autoplay + muted + loop, and none of the player's chrome --
       no bar, no title, no logo, no keyboard shortcuts. Ours go on top instead. */
    background: "1",
    autoplay: "1",
    muted: "1",
    loop: "1",
    autopause: "0",    // background mode already implies it; said out loud anyway
    /* Ask for 720p up front rather than letting the player open on the lowest rung
       and climb. Confirmed and raised on `ready`, below. */
    quality: "720p",
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

/* ------------------------------------------------------------- controls ---- */

/** The only two controls either player gets: play/pause and sound. Same buttons,
 *  same corner, whichever way the clip is hosted. */
function Controls({
  paused,
  muted,
  onPlay,
  onMute,
}: {
  paused: boolean;
  muted: boolean;
  onPlay: () => void;
  onMute: () => void;
}) {
  return (
    <div className={s.controls}>
      <button
        type="button"
        className={s.control}
        onClick={onPlay}
        aria-label={paused ? "Play" : "Pause"}
        aria-pressed={!paused}
        title={paused ? "Play" : "Pause"}
      >
        {paused ? (
          <svg viewBox="0 0 12 14" width="11" height="13" aria-hidden="true">
            <path d="M0 0.8v12.4a.8.8 0 0 0 1.22.68l10-6.2a.8.8 0 0 0 0-1.36l-10-6.2A.8.8 0 0 0 0 .8Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 14" width="11" height="13" aria-hidden="true">
            <rect x="1" y="0.5" width="3.4" height="13" rx="0.9" />
            <rect x="7.6" y="0.5" width="3.4" height="13" rx="0.9" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={s.control}
        onClick={onMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={!muted}
        title={muted ? "Unmute" : "Mute"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M11 5.5 6.8 9H4.2a.7.7 0 0 0-.7.7v4.6c0 .4.3.7.7.7h2.6l4.2 3.5a.5.5 0 0 0 .8-.4V5.9a.5.5 0 0 0-.8-.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {muted ? (
            <path d="M15.5 9.5l5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <>
              <path d="M15.4 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M17.9 6.9a7.4 7.4 0 0 1 0 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

/** Quarter marks, each counted once and only forward; the end caught as the clock
 *  wrapping back to the start, since a looping player never says "ended". */
function progressMeter() {
  const passed = new Set<number>();
  let last = 0;
  return (percent: number) => {
    const now = percent * 100;
    for (const mark of [25, 50, 75]) {
      if (now >= mark && !passed.has(mark)) {
        passed.add(mark);
        track("video_progress", { percent: mark });
      }
    }
    if (last > 90 && now < 10 && !passed.has(100)) {
      passed.add(100);
      track("video_completed");
    }
    last = now;
  };
}

/* ------------------------------------------------------------- the file ---- */

function FilePlayer({ src, poster }: { src: string; poster?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /* A pause has to survive scrolling away and back, or the observer would undo it. */
  const userPaused = useRef(false);
  /* True until the element actually says `play`: nothing is claimed that has not
     happened. */
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;

    /* The buttons follow the element, so whatever the browser does on its own -- a
       tab put to sleep, a phone pausing everything for a call -- is what they say. */
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onVolume = () => setMuted(video.muted || video.volume === 0);
    const meter = progressMeter();
    const onTime = () => {
      if (video.duration) meter(video.currentTime / video.duration);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("timeupdate", onTime);

    /* Someone who asked for less motion did not ask for a clip that starts itself.
       The frame and its two buttons stay; the first press is theirs to make. */
    userPaused.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Starts itself once it is actually on screen, and rests when it is not. */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused.current) void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(host);

    return () => {
      io.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("timeupdate", onTime);
    };
  }, [src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      track("video_played");
      userPaused.current = false;
      void video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) track("video_unmuted");
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
  };

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
        preload="auto"
        aria-label="Floaty Duck, in about a minute."
      />
      <Controls paused={paused} muted={muted} onPlay={togglePlay} onMute={toggleMute} />
    </div>
  );
}

/* ------------------------------------------------------------ the embed ---- */

/** Least-good first. Whatever the player has that sits at 720p or above wins, the
 *  highest of them; below that it is left on auto rather than pinned to something
 *  worse than auto would pick. */
const WANTED = ["4K", "2K", "1080p", "720p"] as const;

function VimeoPlayer({ id, hash, poster }: { id: string; hash?: string; poster?: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<PlayerType | null>(null);
  /* True until the player actually says `play`: nothing is claimed that has not
     happened, and the label is right even if the frame never loads. */
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  /* The first frame has not landed yet; the poster covers the box until it does. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let player: PlayerType | undefined;
    let cancelled = false;

    void (async () => {
      const { default: Player } = await import("@vimeo/player");
      if (cancelled) return;
      player = new Player(frame);
      playerRef.current = player;

      /* QUALITY. `quality=720p` in the URL is only a request; the account tier and the
         file decide. Ask what is actually on offer and pin the best of the wanted
         rungs. Missing SDK methods on a smaller plan reject -- that is fine, the URL
         param has already done what it can. */
      void player
        .getQualities()
        .then((list) => {
          const have = new Set(list.map((q) => q.id));
          const pick = WANTED.find((q) => have.has(q));
          if (pick) return player?.setQuality(pick);
        })
        .catch(() => {});

      /* Less motion asked for: the frame stays, autoplay does not. */
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void player.pause().catch(() => {});
      }

      /* The buttons follow the player, not the other way round, so a state the frame
         reaches on its own -- a tab put to sleep, a phone pausing everything for a
         call -- is still what the label says. */
      player.on("play", () => {
        setPaused(false);
        setReady(true);
      });
      player.on("pause", () => setPaused(true));
      player.on("volumechange", ({ volume }: { volume: number }) => setMuted(volume === 0));
      player.on("loaded", () => {
        void player?.getMuted().then(setMuted).catch(() => {});
      });

      /* HOW FAR PEOPLE ACTUALLY GET. Vimeo reports progress as a fraction already. */
      const meter = progressMeter();
      let sawEnd = false;
      player.on("timeupdate", ({ percent }: { percent: number }) => meter(percent));
      player.on("ended", () => {
        /* Only reached with the loop off; the meter handles the looping case. */
        if (sawEnd) return;
        sawEnd = true;
        track("video_completed");
      });
    })();

    return () => {
      cancelled = true;
      playerRef.current = null;
      /* Listeners only. `destroy()` would take the iframe with it, and that element
         belongs to React. */
      for (const name of ["play", "pause", "volumechange", "loaded", "timeupdate", "ended"] as const) {
        player?.off(name);
      }
    };
  }, [id, hash]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (paused) {
      track("video_played");
      void player.play().catch(() => {});
    } else {
      void player.pause().catch(() => {});
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) track("video_unmuted");
    /* The frame started life muted at volume 0; unmuting alone leaves it at 0 on
       some builds of the player, so the volume is set with it. */
    void player.setMuted(!muted).catch(() => {});
    if (muted) void player.setVolume(1).catch(() => {});
    setMuted(!muted);
  };

  return (
    <div className={s.frame}>
      {poster && (
        /* Her own art, not a frame of the film: a square sprite on a transparent
           ground, sat whole on the paper. It is under the frame and fades once the
           player has a picture of its own. */
        <Image
          className={`${s.poster} ${ready ? s.posterGone : ""}`}
          src={poster}
          alt=""
          width={499}
          height={500}
          priority
        />
      )}
      <iframe
        ref={frameRef}
        className={`${s.iframe} ${ready ? s.iframeIn : ""}`}
        src={embedSrc(id, hash)}
        title="Floaty Duck"
        /* autoplay has to be handed down explicitly: this frame is another origin,
           and without the grant the player comes up stopped. */
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <Controls paused={paused} muted={muted} onPlay={togglePlay} onMute={toggleMute} />
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
