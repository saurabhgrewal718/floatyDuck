/**
 * Generic OS chrome for the screen. Nothing here imitates a real app -- the window
 * is anonymous, and the only nameable icon in the dock is hers.
 *
 * `only` exists because the furniture and the window arrive at different moments:
 * a freshly opened Mac should be bare when Floaty turns up, and a giant duck sitting
 * on top of a document is just clutter. The window appears later, as she shrinks into
 * her corner and the desktop starts looking used.
 *
 * Rendering each group separately -- rather than one full set per layer -- keeps the
 * menu bar out of the accessibility tree twice.
 */

import { DuckMark } from "./Logo";
import s from "./desktop.module.css";

export function MacChrome({ only }: { only?: "furniture" | "window" }) {
  const wants = (part: "furniture" | "window") => !only || only === part;

  return (
    <>
      {wants("furniture") && (
        <div className={s.menubar}>
          <span className={s.menuApple} aria-hidden="true" />
          <span className={s.menuItem}>Finder</span>
          <span className={s.menuItem}>File</span>
          <span className={s.menuItem}>Edit</span>
          <span className={s.menuItem}>View</span>
          <span className={s.menuSpacer} />
          <span className={s.menuStatus} aria-hidden="true" />
          <span className={s.menuStatus} aria-hidden="true" />
          <span className={s.menuClock}>10:59</span>
        </div>
      )}

      {wants("window") && (
        <div className={s.window} aria-hidden="true">
          <div className={s.titlebar}>
            <span className={`${s.light} ${s.close}`} />
            <span className={`${s.light} ${s.min}`} />
            <span className={`${s.light} ${s.zoom}`} />
          </div>
          <div className={s.windowBody}>
            {[92, 74, 84, 61, 78, 48].map((width, i) => (
              <span key={i} className={s.textLine} style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
      )}

      {wants("furniture") && (
        <div className={s.dock} aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className={s.dockTile} />
          ))}
          <span className={s.dockDuck}>
            <DuckMark size={19} />
          </span>
        </div>
      )}
    </>
  );
}
