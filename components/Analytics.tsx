"use client";

/**
 * PostHog, started only once someone has said yes, and kept off the critical path.
 *
 * CONSENT GATES `init`, NOT PERSISTENCE. The cookie is written the moment the SDK
 * starts, so a banner that appears alongside a running SDK is asking permission for
 * something already done. Nothing here loads until lib/consent.ts reports "granted" --
 * which also means a visitor who declines never fetches the ~100KB at all.
 *
 * The SDK is imported inside the effect for the same reason it always was: this page
 * is mostly motion, all of it on the main thread, and analytics has no business
 * competing with the duck for it. Events raised before the answer arrives are held by
 * lib/analytics.ts and flushed on Allow, so the visit counts from its start rather
 * than from the moment of the click; on No thanks they are dropped.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { attach, page, permit, refuse, POSTHOG_HOST, POSTHOG_KEY } from "@/lib/analytics";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/consent";

export function Analytics() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const started = useRef(false);

  useEffect(() => {
    if (consent === "denied") {
      refuse();
      /* So that saying yes later starts the SDK rather than finding the guard already
         tripped and doing nothing. */
      started.current = false;
      return;
    }
    if (consent !== "granted" || !POSTHOG_KEY || started.current) return;
    permit();
    started.current = true;

    void (async () => {
      const { default: posthog } = await import("posthog-js");

      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        /* Pins the SDK's own defaults to the date this was set up, so a future
           posthog-js release cannot quietly change what is collected underneath a
           site that nobody is watching. The explicit options below still win. */
        defaults: "2026-05-30",
        /* They agreed to the cookie, and the cookie is the point: without something
           that survives the tab, every return visit is a new stranger and "how many
           people" cannot be answered at all. */
        persistence: "localStorage+cookie",
        /* Pageviews are sent by the effect below instead. Left on, the SDK fires one
           at init and then nothing again: /privacy and /terms are reached by client
           navigation, which never reloads the document the SDK is watching, so those
           pages would report as visited by nobody. */
        capture_pageview: false,
        /* Clicks the site never named. The funnel runs on the explicit events in
           lib/analytics.ts, but autocapture is what makes it possible to ask, months
           later, about a button nobody thought to instrument. */
        autocapture: true,
        /* The page's own claim is that nothing leaves your Mac. Recording the screen
           would not break it -- that promise is about the app -- but it sits badly
           beside it, and none of the metrics being collected need it. */
        disable_session_recording: true,
      });

      attach(posthog);
    })();
  }, [consent]);

  useEffect(() => {
    if (!pathname) return;
    page(window.location.href);
  }, [pathname]);

  return null;
}
