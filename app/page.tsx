import { CopyLink } from "@/components/CopyLink";
import { MacStage } from "@/components/MacStage";
import { VideoHolder } from "@/components/VideoHolder";
import Link from "next/link";
import { Floaty } from "@/components/Floaty";
import { Reveal } from "@/components/Reveal";
import { DOWNLOAD } from "@/lib/links";
import s from "./page.module.css";

function Download({ quiet = false }: { quiet?: boolean }) {
  return (
    <div className={s.download}>
      <a className={quiet ? s.buttonQuiet : s.button} href={DOWNLOAD}>
        Download for Mac
      </a>
      <p className={s.requirement}>
        Free. macOS 12 or later, on Apple Silicon and Intel.
      </p>
      <div className={s.onPhone}>
        <p className={s.onPhoneLine}>Open floatyduck.com on your Mac to download her.</p>
        <CopyLink className={s.copy} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <main>
        {/* ------------------------------------------------------- hero ---- */}
        <section className={s.hero}>
          <div className={s.heroText}>
            <Reveal as="h1" className="display">
              <span className="line">Someone to sit</span>
              <span className="line">with you.</span>
            </Reveal>
            <Reveal className={s.heroSub}>
              <p className="lead">
                When it&rsquo;s time to drink, water goes up the side of your screen.
                When it&rsquo;s time to rest your eyes, she shuts hers.
              </p>
            </Reveal>
            <Download />
          </div>
          <div className={s.heroDuck}>
            <Floaty size={396} />
            <p className={s.pokeHint}>Go on, poke her.</p>
          </div>
        </section>

        {/* ------------------------------------------------------ video ---- */}
        {/* Source lives in VIDEO, in lib/links.ts. */}
        <VideoHolder />

        {/* ------------------------------------- three acts, one screen ---- */}
        <MacStage />

        {/* --------------------------------------------------- her, real ---- */}
        <section className={s.proof}>
          <div className={s.proofText}>
            <Reveal as="h2" className="headline">
              <span className="line">And the rest of it,</span>
              <span className="line">in one window.</span>
            </Reveal>
            <p className="body">
              Every reminder she keeps, in folders you name. Fixed times for the start and
              end of your day, spread ones for everything else.
            </p>
          </div>
          {/* TODO: replace with a real screenshot of the Reminders window, light theme. */}
          <div className={s.shotPlaceholder} role="img" aria-label="The Reminders window">
            <span>Reminders window screenshot goes here</span>
          </div>
        </section>

        {/* ------------------------------------------------------- yours ---- */}
        <section className={s.yours}>
          <Reveal as="h2" className="headline">
            <span className="line">Make her yours.</span>
          </Reveal>
          <div className={s.columns}>
            <div>
              <h3 className={s.colName}>Free, always</h3>
              <ul className={s.list}>
                <li>Floaty herself</li>
                <li>Water, spread across your day</li>
                <li>Eye rest every twenty minutes</li>
                <li>The start and the end of your day</li>
                <li>Quick timers</li>
                <li>Light or dark, following your Mac</li>
              </ul>
            </div>
            <div>
              <h3 className={s.colName}>Once, and then forever</h3>
              <ul className={s.list}>
                <li>As many reminders as you like</li>
                <li>Folders of your own</li>
                <li>Your own duck in place of hers</li>
                <li>Your own sounds</li>
              </ul>
              <p className="fine">Unlock it from inside the app, whenever you want to.</p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- privacy ---- */}
        <section className={s.privacy}>
          <Reveal as="h2" className="display">
            <span className="line">Nothing leaves</span>
            <span className="line">your Mac.</span>
          </Reveal>
          <div className={s.claims}>
            <div className={s.claim}>
              <h3 className={s.claimName}>No network code</h3>
              <p>
                No fetch, no HTTP permission granted, no server anywhere. She has
                nothing to send and nowhere to send it.
              </p>
            </div>
            <div className={s.claim}>
              <h3 className={s.claimName}>No account</h3>
              <p>
                Nothing to sign up for and no email needed. Even the paid unlock is
                checked on your own machine, not against ours.
              </p>
            </div>
            <div className={s.claim}>
              <h3 className={s.claimName}>Signed and notarised</h3>
              <p>
                Notarised by Apple under a Developer ID, so Gatekeeper lets her open
                without a warning and you can verify who built her.
              </p>
            </div>
          </div>
          <p className={s.path}>~/Library/Application&nbsp;Support/com.saurabhgrewal.floatyduck/</p>
          <p className="fine">
            That folder is all of it: your reminders, your timers, your notes. This website
            counts anonymous visits so we know whether it works. The app never does.
          </p>
        </section>

        {/* --------------------------------------------------------- cta ---- */}
        <section className={s.cta}>
          <Reveal as="h2" className="headline">
            <span className="line">She&rsquo;s waiting.</span>
          </Reveal>
          <Download quiet />
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.ticks} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={s.tick} />
          ))}
        </div>
        <p className={s.wordmark}>Floaty Duck</p>
        <nav className={s.footerNav}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
          <a href="mailto:hello@floatyduck.com">Support</a>
        </nav>
      </footer>
    </>
  );
}
