"use client";

/**
 * How far down the page people actually get.
 *
 * One observer over every `[data-section]` rather than a wrapper component per
 * section: the sections are plain markup in a server component, and threading a
 * client boundary through each of them to watch its own scroll position would cost
 * more than it measures.
 *
 * Each section reports once. A section is "reached" when it crosses into the upper
 * four-fifths of the viewport -- not merely when its first pixel appears at the very
 * bottom, which on a long page is satisfied by scrolling a couple of lines and would
 * report as read something nobody has looked at.
 */

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function SectionTracker() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-section]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const name = entry.target.getAttribute("data-section");
          if (name) track("section_viewed", { name });
          /* Once each. Scrolling back up past a section is the same section, not a
             second reader, and counting it twice would quietly inflate exactly the
             number this exists to answer. */
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return null;
}
