import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/links";
import { ConsentReset } from "@/components/ConsentReset";
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
        If you allow it, this site counts page views, presses of the download button, and
        how far the trailer is watched, using PostHog on its European servers. We look at
        it to see whether the page is doing its job.
      </p>
      <p>
        That is what the banner asks about. Until it is answered nothing is sent, and if
        you say no nothing is sent ever — the code that would do the counting is not even
        fetched. Say yes and it sets a cookie, which exists so that coming back tomorrow
        counts as you returning rather than as a stranger arriving.
      </p>
      <p>
        It also keeps a tally of where on the page people click and how far down they
        scroll, which is how we tell whether anything below the fold is being read. That
        is counted in positions, not pictures: there is no recording of your screen and
        nothing that could be played back.
      </p>
      <p>
        Your rough location — country, near enough — is worked out from your IP address.
        We do not follow you to other sites, and there is no mailing list and no form
        here, so there is nothing else of yours to give.
      </p>
      <p>
        <ConsentReset />
      </p>
      <p>
        We do not run a mailing list and we do not have a form. There is nothing here for
        you to give us.
      </p>

      <h2>Getting in touch</h2>
      <p>
        Questions to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <p className={s.updated}>Last updated 10 September 2026.</p>
    </main>
  );
}
