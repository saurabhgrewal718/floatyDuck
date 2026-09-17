"use client";

/**
 * The cookie question, asked once.
 *
 * It renders nothing until the answer is known to be missing. That matters more than it
 * looks: the page is a static export, so the first HTML every visitor receives is
 * identical, and a banner baked into it would flash up even for the people who answered
 * months ago. Reading localStorage is a client-only act, so the server snapshot commits
 * to nothing and the client decides.
 */

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { POSTHOG_KEY } from "@/lib/analytics";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  writeConsent,
} from "@/lib/consent";
import s from "./consent.module.css";

export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /* No key, nothing to consent to. Without this the banner asks permission to set a
     cookie that no code exists to set -- which is not merely pointless but untrue, and
     trains people to dismiss the one that will matter later. A build without a key is
     the normal state of a local checkout and of any fork. */
  if (!POSTHOG_KEY) return null;
  if (consent !== "unset") return null;

  return (
    <aside className={s.bar} role="dialog" aria-label="Cookies">
      <p className={s.text}>
        May we count this visit? It sets a cookie so you are not counted twice, and it
        tells us nothing about you beyond which country you are in and which parts of
        this page get used. Nothing here follows you to other sites.{" "}
        <Link href="/privacy">What we collect</Link>.
      </p>
      <div className={s.row}>
        <button
          type="button"
          className={s.accept}
          onClick={() => writeConsent("granted")}
        >
          Allow
        </button>
        <button
          type="button"
          className={s.decline}
          onClick={() => writeConsent("denied")}
        >
          No thanks
        </button>
      </div>
    </aside>
  );
}
