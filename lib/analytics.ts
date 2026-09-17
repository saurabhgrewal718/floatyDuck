/**
 * Every event the site sends, in one place.
 *
 * The names are a closed set rather than free strings because a funnel is built by
 * matching on them exactly: a `video_complete` sent from one component and a
 * `video_completed` from another are two different columns in the dashboard, and the
 * chart that results is wrong in a way nobody notices for a month. TypeScript catches
 * the typo here instead.
 *
 * NOTHING HERE IMPORTS POSTHOG. The SDK is ~100KB gzipped -- over half again what this
 * whole site weighed before it -- and a static import would put every byte of it in the
 * first chunk the browser parses, ahead of a page whose entire appeal is that the duck
 * moves smoothly. Analytics.tsx fetches it after consent and hands it back through
 * `attach`, so it lands on a page that is already interactive.
 *
 * WITHOUT A KEY, EVERY CALL BELOW IS A NO-OP. `npm run dev` and a fork's build both run
 * without a PostHog project and neither should have to care.
 */

/** Public by design -- see the note in .env.example about NEXT_PUBLIC_. */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
/* `||`, not `??`: an unset GitHub secret arrives as an empty string rather than
   undefined, and `??` would keep it and point the SDK at nowhere. */
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

export type DuckEvent =
  /** The download button, wherever on the page it was pressed. */
  | "download_clicked"
  /** The poster was clicked and the Vimeo frame was built. */
  | "video_played"
  /** A quarter mark went past -- carries `percent`, one of 25, 50 or 75. */
  | "video_progress"
  /** Ran to the end. Sent once, and never for someone who scrubbed past. */
  | "video_completed";

type Capture = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  /* Present on the real SDK; optional so the module can be reasoned about without it. */
  opt_out_capturing?: () => void;
  reset?: () => void;
};

let client: Capture | undefined;
let refused = false;

/* Whatever was sent while the SDK was still in flight. Small, and bounded by the fact
   that a person can only press so many things in the second or so it takes to arrive --
   but not empty: the fastest click on this page is the download button, by someone who
   came to do exactly that and nothing else, and losing that one would quietly understate
   the only number that pays for any of this. */
const pending: Array<[string, Record<string, unknown> | undefined]> = [];

/* Someone who never answers the banner still moves around the page, and every one of
   those events would queue forever against a flush that is never coming. Holding them
   is right -- press Allow and the visit counts from its beginning rather than from the
   moment of the click -- but holding them without a ceiling is a leak. */
const PENDING_LIMIT = 50;

export function attach(posthog: Capture) {
  client = posthog;
  for (const [event, properties] of pending.splice(0)) posthog.capture(event, properties);
}

/** Said no. Everything held is dropped rather than kept against a later change of
 *  mind: what was queued was gathered before an answer existed, and keeping it warm
 *  in case they reconsider is the sort of thing the banner promises not to do. */
export function refuse() {
  refused = true;
  pending.length = 0;
  /* Withdrawn after the fact, not just declined up front: the SDK is already running
     and holding an id, so it is told to stop and to forget rather than merely being
     ignored from here on. */
  client?.opt_out_capturing?.();
  client?.reset?.();
  client = undefined;
}

/** Undoes `refuse`, for the visitor who says no and later changes their mind. Without
 *  it the module stays latched shut and "Ask me again" leads nowhere until a reload. */
export function permit() {
  refused = false;
}

function send(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY || refused) return;
  if (client) client.capture(event, properties);
  else if (pending.length < PENDING_LIMIT) pending.push([event, properties]);
}

export function track(event: DuckEvent, properties?: Record<string, unknown>) {
  send(event, properties);
}

/** The first of these is queued behind the SDK's own arrival, like any other event --
 *  which is the point of routing it through here rather than reaching for posthog
 *  directly, where it would race the `init` call and be thrown away. */
export function page(url: string) {
  send("$pageview", { $current_url: url });
}
