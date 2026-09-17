"use client";

/**
 * The phone CTA. A visitor on a phone cannot install a Mac app, so instead of a
 * dead button or an email form we hand them the link and collect nothing.
 */

import { useState } from "react";

export function CopyLink({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onPointerDown={async () => {
        try {
          await navigator.clipboard.writeText("https://floatyduck.com");
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Link copied" : "Copy the link"}
    </button>
  );
}
