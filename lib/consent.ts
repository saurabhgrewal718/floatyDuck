/**
 * Whether this visitor agreed to be counted.
 *
 * The answer gates PostHog's `init`, not merely its persistence. Under GDPR the cookie
 * is set the moment the SDK starts, so asking afterwards would be asking about
 * something already done -- consent has to be the thing that decides whether the SDK
 * runs at all. Hence a store the analytics layer waits on rather than a flag it
 * consults on the way past.
 *
 * The answer itself lives in localStorage, which needs no consent of its own:
 * remembering "no" is what stops the question being asked on every page, and a
 * preference the visitor set is exactly what the strictly-necessary carve-out is for.
 * It is also why this cannot be sessionStorage -- "no" has to survive the tab.
 *
 * Shaped for `useSyncExternalStore` rather than as something each component reads into
 * its own state: three of them care about this value, they must agree at every instant
 * (the banner cannot still be up while the privacy page says the answer was given),
 * and an effect that copies a store into state is both a frame behind and, under React
 * 19's lint rules, flagged for being so.
 */

const KEY = "fd-consent";

export type Consent = "granted" | "denied" | "unset";
/** What the server renders. Distinguished from "unset" because the static HTML is the
 *  same for everyone and must therefore commit to nothing -- a banner baked into it
 *  would flash up even for the people who answered months ago. */
export type ConsentSnapshot = Consent | "unknown";

const listeners = new Set<() => void>();

/* `getSnapshot` runs on every render and must return an equal value each time or React
   re-renders forever, so the read is done once and held until something changes it. */
let cached: Consent | null = null;

/* Safari in private mode throws on storage rather than returning null, and an
   exception here would take the banner down with it -- so every access is guarded and
   an unreadable store reads as a question not yet answered. */
function read(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
}

function changed() {
  cached = null;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): ConsentSnapshot {
  if (cached === null) cached = read();
  return cached;
}

export function getServerSnapshot(): ConsentSnapshot {
  return "unknown";
}

export function writeConsent(value: Exclude<Consent, "unset">) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* Nothing to do: they will be asked again next visit, which is the safe way round.
       Losing the answer costs a second banner; assuming it costs a cookie nobody
       agreed to. */
  }
  changed();
}

/** Puts the question back. Withdrawing has to be as easy as giving, which means a
 *  control somewhere permanent -- the privacy page -- and not only in the seconds the
 *  banner happened to be on screen. */
export function clearConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Same reasoning as writeConsent: unreadable storage reads as "not answered",
       which is the side that collects nothing. */
  }
  changed();
}
