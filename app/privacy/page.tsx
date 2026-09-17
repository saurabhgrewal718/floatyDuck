import type { Metadata } from "next";
import Link from "next/link";
import s from "../legal.module.css";

export const metadata: Metadata = { title: "Privacy — Floaty Duck" };

export default function Privacy() {
  return (
    <main className={s.page}>
      <Link className={s.back} href="/">Floaty Duck</Link>
      <h1>Privacy</h1>

      <h2>The app</h2>
      <p>
        Floaty Duck does not connect to the internet. It has no account, no analytics and
        no network code at all. Everything it knows about you — your reminders, your
        timers, your notes — is in one folder on your Mac:
      </p>
      <p>
        <code>~/Library/Application Support/com.saurabhgrewal.floatyduck/</code>
      </p>
      <p>
        Nothing in that folder is ever sent anywhere. Delete the folder and the app
        forgets everything. Nobody, including us, can read it.
      </p>

      <h2>This website</h2>
      <p>
        floatyduck.com counts anonymous page views using Vercel Analytics, so we can tell
        whether the page is working. It sets no cookies, it does not follow you to other
        sites, and it does not build a profile of you.
      </p>
      <p>
        We do not run a mailing list and we do not have a form. There is nothing here for
        you to give us.
      </p>

      <h2>Getting in touch</h2>
      <p>
        Questions to <a href="mailto:hello@floatyduck.com">hello@floatyduck.com</a>.
      </p>

      <p className={s.updated}>Last updated 10 September 2026.</p>
    </main>
  );
}
