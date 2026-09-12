"use client";

/**
 * The stop control for the stage's sound. It lives in the header because WCAG 1.4.2
 * requires audio that starts by itself and runs past three seconds to be stoppable,
 * and the rain runs for a whole act.
 *
 * Three states, and the label never lies about which one it is in:
 *   sound off               the visitor turned it off; remembered across visits
 *   enable sound            wanted, but the browser is still waiting for a gesture
 *   sound on                actually audible
 */

import { useEffect, useState } from "react";
import { getStageSound, type SoundState } from "@/lib/stageSound";
import s from "./header.module.css";

export function SoundToggle() {
  const [state, setState] = useState<SoundState>({ wanted: true, running: false });

  useEffect(() => {
    const sound = getStageSound();
    const off = sound.subscribe(setState);
    sound.init();
    return off;
  }, []);

  const label = !state.wanted ? "Sound off" : state.running ? "Sound on" : "Enable sound";

  const onClick = () => {
    const sound = getStageSound();
    // Wanted but blocked: this very click is the gesture, so open rather than toggle.
    if (state.wanted && !state.running) sound.resume();
    else sound.toggle();
  };

  return (
    <button
      type="button"
      className={s.icon}
      onClick={onClick}
      aria-label={label}
      aria-pressed={state.wanted && state.running}
      title={label}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M11 5.5 6.8 9H4.2a.7.7 0 0 0-.7.7v4.6c0 .4.3.7.7.7h2.6l4.2 3.5a.5.5 0 0 0 .8-.4V5.9a.5.5 0 0 0-.8-.4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {state.wanted && state.running ? (
          <>
            <path d="M15.4 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M17.9 6.9a7.4 7.4 0 0 1 0 10.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : state.wanted ? (
          <path d="M15.4 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
        ) : (
          <path d="M15.5 9.5l5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
