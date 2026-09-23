"use client";

/**
 * A mailto that gets counted.
 *
 * Small numbers, and worth having anyway: someone who opens their mail client is
 * further into caring about this than anyone who merely scrolled, and if that number
 * ever moves it is worth knowing which page sent them.
 */

import { track } from "@/lib/analytics";
import { SUPPORT_EMAIL } from "@/lib/links";

export function MailLink({
  where,
  children,
}: {
  where: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      onClick={() => track("support_email_clicked", { where })}
    >
      {children}
    </a>
  );
}
