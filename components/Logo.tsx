/**
 * The app icon, and the wordmark next to it.
 *
 * `DuckMark` is the single source of the icon everywhere it appears at small sizes --
 * the header logo tile, the dock in the fake Mac, the notification, the video badge.
 * The artwork lives at /floatyDuck.png; swapping that one file re-skins all of them.
 * (The hero duck needs a third size and a moving eye, so it stacks its own layers --
 * see components/Floaty.tsx.)
 */

import Image from "next/image";
import Link from "next/link";
import s from "./logo.module.css";

/**
 * `eager` is for the two marks in the header, which are on screen before anything has
 * scrolled. The ones inside the stage and the video frame are below the fold and stay
 * lazy, so the header's copy is the only one that competes with the hero.
 */
export function DuckMark({ size = 26, eager = false }: { size?: number; eager?: boolean }) {
  return (
    <Image
      src="/floatyDuck.png"
      alt=""
      width={size}
      height={size}
      className={s.mark}
      priority={eager}
    />
  );
}

export function Logo() {
  return (
    <Link className={s.logo} href="/" aria-label="Floaty Duck, home">
      <span className={s.tile}>
        <DuckMark size={26} eager />
      </span>
      <span className={s.word}>Floaty Duck</span>
    </Link>
  );
}
