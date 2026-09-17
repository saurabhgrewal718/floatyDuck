"use client";

/**
 * Take it back.
 *
 * Consent that can only be given is not consent, so the answer has to be reachable
 * somewhere permanent rather than only during the seconds the banner was on screen.
 * This puts the question back and lets the banner ask again.
 *
 * Renders nothing before the answer is known, and plain text when there is none to
 * undo -- a live "ask me again" while the banner is still waiting would be offering to
 * repeat a question nobody has answered.
 */

import { useSyncExternalStore } from "react";
import { POSTHOG_KEY } from "@/lib/analytics";
import { clearConsent, getServerSnapshot, getSnapshot, subscribe } from "@/lib/consent";

export function ConsentReset() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /* Same reasoning as the banner: with nothing being collected there is no answer to
     give and none to take back. */
  if (!POSTHOG_KEY) return <>Nothing is being counted on this site.</>;
  if (consent === "unknown") return null;
  if (consent === "unset") return <>The banner is waiting for your answer.</>;

  return (
    <>
      You said {consent === "granted" ? "yes" : "no"}.{" "}
      <button type="button" className="linkish" onClick={() => clearConsent()}>
        Ask me again
      </button>
      .
    </>
  );
}
