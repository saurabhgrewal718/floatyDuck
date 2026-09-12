"use client";

/**
 * Translucent chrome the page scrolls under, rather than an opaque bar that eats a
 * strip of the viewport. No hard divider: the hairline fades in only once content
 * has actually moved beneath it.
 */

import { useEffect, useState } from "react";
import { AppleMark } from "./AppleMark";
import { Logo } from "./Logo";
import { SoundToggle } from "./SoundToggle";
import { DOWNLOAD, SUPPORT_EMAIL } from "@/lib/links";
import s from "./header.module.css";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${s.header} ${scrolled ? s.scrolled : ""}`}>
      <div className={s.inner}>
        <Logo />
        <div className={s.actions}>
          <SoundToggle />
          <a
            className={s.icon}
            href={`mailto:${SUPPORT_EMAIL}`}
            aria-label="Send us a note"
            title="Send us a note"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 5.5h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.8l-4 3.1a.4.4 0 0 1-.6-.3v-2.8h-.7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a className={s.pill} href={DOWNLOAD}>
            <AppleMark size={15} />
            <span>Download</span>
          </a>
        </div>
      </div>
    </header>
  );
}
