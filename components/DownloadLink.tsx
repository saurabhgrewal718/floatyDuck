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

import { useEffect, useRef } from "react";
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
  const ref = useRef<HTMLAnchorElement>(null);

  /* Seen, not merely rendered. Half the button inside the viewport is the threshold:
     a sliver at the edge during a fast scroll is not an offer anybody was made. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        track("cta_viewed", { where });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [where]);

  return (
    <a
      ref={ref}
      className={className}
      href={href}
      onClick={() => track("download_clicked", { where })}
    >
      {children}
    </a>
  );
}
