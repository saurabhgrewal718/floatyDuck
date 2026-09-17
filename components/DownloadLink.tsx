"use client";

/**
 * The download button, wrapped only so the click can be counted.
 *
 * The page is a server component and cannot carry a handler, so this is the
 * smallest possible client island: an <a> that is otherwise exactly what was
 * there before, styled by whatever class it is handed.
 *
 * `where` is the point of it. The same button sits in the hero and again in the
 * closing panel, and they are not the same button in any way that matters -- one
 * is pressed on arrival, the other after reading and watching. Counting them
 * together reports how many people downloaded and hides which half of the page
 * did the work.
 *
 * Nothing waits on the event. PostHog sends over `navigator.sendBeacon` when it
 * can, which survives the navigation, and if it does not the download still has
 * to win: a lost event is invisible, a delayed download is not.
 */

import { track } from "@/lib/analytics";

export function DownloadLink({
  href,
  className,
  where,
  children,
}: {
  href: string;
  className?: string;
  where: "hero" | "closing";
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => track("download_clicked", { where })}
    >
      {children}
    </a>
  );
}
