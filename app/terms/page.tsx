import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/links";
import Link from "next/link";
import s from "../legal.module.css";

export const metadata: Metadata = { title: "Terms — Floaty Duck" };

export default function Terms() {
  return (
    <main className={s.page}>
      <Link className={s.back} href="/">Floaty Duck</Link>
      <h1>Terms</h1>

      <h2>The short version</h2>
      <p>
        Floaty Duck is free to download and use. Some features unlock with a one-time
        purchase made inside the app. The purchase is for you, on your own Macs.
      </p>

      <h2>What you can do</h2>
      <ul>
        <li>Install and use the app on Macs you own.</li>
        <li>Keep using an unlocked copy for as long as it runs.</li>
      </ul>

      <h2>What you cannot do</h2>
      <ul>
        <li>Share or resell an unlock key.</li>
        <li>Redistribute the app as your own.</li>
      </ul>

      <h2>Reminders are not medical advice</h2>
      <p>
        Floaty reminds you to drink water and rest your eyes. She is a nudge on your
        desktop, not health care. Nothing in the app is medical advice, and it should not
        replace anything a doctor tells you.
      </p>

      <h2>No warranty</h2>
      <p>
        The app is provided as it is. It may have bugs, a reminder may fire late, and we
        are not liable for anything that follows from using it.
      </p>

      <h2>Getting in touch</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>

      <p className={s.updated}>Last updated 10 September 2026.</p>
    </main>
  );
}
