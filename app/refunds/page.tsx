import type { Metadata } from "next";
import Link from "next/link";
import s from "../legal.module.css";

export const metadata: Metadata = { title: "Refunds — Floaty Duck" };

export default function Refunds() {
  return (
    <main className={s.page}>
      <Link className={s.back} href="/">Floaty Duck</Link>
      <h1>Refunds</h1>

      <p>
        The app is free to download, so you can use Floaty and decide whether you want
        the rest before paying anything.
      </p>

      <h2>If you buy the unlock and change your mind</h2>
      <p>
        Email <a href="mailto:hello@floatyduck.com">hello@floatyduck.com</a> within 14
        days of buying and you get your money back. You do not need to give a reason.
      </p>

      <h2>What we need from you</h2>
      <ul>
        <li>The email address you bought with.</li>
        <li>Nothing else.</li>
      </ul>

      <p>
        Refunds go back to the card you paid with and usually take a few working days to
        appear, depending on your bank.
      </p>

      <p className={s.updated}>Last updated 10 September 2026.</p>
    </main>
  );
}
