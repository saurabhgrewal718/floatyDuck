import { chromium } from "playwright";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
await p.addInitScript(() => {
  window.__audio = { buffers: [], stops: [], oscs: [] };
  const proto = window.AudioContext.prototype;
  const cbs = proto.createBufferSource;
  proto.createBufferSource = function () {
    const n = cbs.call(this);
    const s = n.start.bind(n), st = n.stop.bind(n);
    n.start = (...a) => { window.__audio.buffers.push(1); return s(...a); };
    n.stop = (...a) => { window.__audio.stops.push(1); return st(...a); };
    return n;
  };
});
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const label = () => p.locator('header button[aria-label*="ound"]').first().getAttribute("aria-label");
console.log("on load (no gesture yet):", await label());

// Any click anywhere is the gesture -- not the toggle.
await p.locator("h1").click();
await p.waitForTimeout(400);
console.log("after clicking the headline:", await label(),
  (await label()) === "Sound on" ? "PASS (default-on took effect)" : "FAIL");

const g = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
await p.evaluate(() => { window.__audio = { buffers: [], stops: [], oscs: [] }; });

await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * 0.44);
await p.waitForTimeout(1000);
let a = await p.evaluate(() => window.__audio);
console.log("rain during water act:", a.buffers.length, a.buffers.length === 1 ? "PASS" : "FAIL");

// Scrolling right past the stage must silence it.
await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span + 4000);
await p.waitForTimeout(900);
a = await p.evaluate(() => window.__audio);
console.log("rain stopped after leaving the stage:", a.stops.length >= 1 ? "PASS" : "FAIL");

// Scrolling back in must start it again.
await p.evaluate(() => { window.__audio = { buffers: [], stops: [], oscs: [] }; });
await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * 0.44);
await p.waitForTimeout(1000);
a = await p.evaluate(() => window.__audio);
console.log("rain restarts on the way back:", a.buffers.length >= 1 ? "PASS" : "FAIL");
await b.close();
