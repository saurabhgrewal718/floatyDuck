import { chromium } from "playwright";
const b = await chromium.launch();
const ctxOpts = { viewport: { width: 1440, height: 900 } };

async function open(context) {
  const p = await context.newPage();
  // Record every source the page creates, before any of our code runs.
  await p.addInitScript(() => {
    window.__audio = { buffers: [], oscs: [], stops: [] };
    const AC = window.AudioContext;
    const wrap = (proto) => {
      const cbs = proto.createBufferSource;
      proto.createBufferSource = function () {
        const n = cbs.call(this);
        const start = n.start.bind(n);
        const stop = n.stop.bind(n);
        n.start = (...a) => { window.__audio.buffers.push(performance.now()); return start(...a); };
        n.stop = (...a) => { window.__audio.stops.push(performance.now()); return stop(...a); };
        return n;
      };
      const co = proto.createOscillator;
      proto.createOscillator = function () {
        const n = co.call(this);
        const start = n.start.bind(n);
        n.start = (...a) => { window.__audio.oscs.push(Math.round(n.frequency.value)); return start(...a); };
        return n;
      };
    };
    wrap(AC.prototype);
  });
  await p.goto(process.env.URL, { waitUntil: "networkidle" });
  return p;
}

const c1 = await b.newContext(ctxOpts);
const p = await open(c1);

const toggle = p.locator('header button[aria-label*="ound"]').first();
console.log("on load:", await toggle.getAttribute("aria-label"));

await toggle.click();
await p.waitForTimeout(400);
console.log("after click:", await toggle.getAttribute("aria-label"));

const g = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
const goTo = async (k, wait = 900) => {
  await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * k);
  await p.waitForTimeout(wait);
};
const read = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__audio)));

await p.evaluate(() => { window.__audio = { buffers: [], oscs: [], stops: [] }; });

await goTo(0.44);
let a = await read();
console.log(`water act  -> rain sources started: ${a.buffers.length}`, a.buffers.length === 1 ? "PASS" : "FAIL");

await goTo(0.64);
a = await read();
console.log(`eye act    -> rain stopped: ${a.stops.length >= 1 ? "yes" : "no"}, chime partials: [${a.oscs.join(", ")}]`,
  a.stops.length >= 1 && a.oscs.includes(528) && a.oscs.includes(792) ? "PASS" : "FAIL");

await p.evaluate(() => { window.__audio.oscs = []; });
await goTo(0.97);
a = await read();
const dings = a.oscs.filter((f) => f === 932).length;
console.log(`timer done -> dings at 932Hz: ${dings}`, dings === 3 ? "PASS" : "FAIL");

// Only one act audible at a time: exactly one rain source, and it was stopped.
a = await read();
console.log(`overlap    -> rain sources ${a.buffers.length}, stops ${a.stops.length}`,
  a.buffers.length === a.stops.length ? "PASS (every rain start was stopped)" : "FAIL");

// Turning it off must survive a reload.
await toggle.click();
await p.waitForTimeout(200);
console.log("after off:", await toggle.getAttribute("aria-label"));
const p2 = await open(c1);
console.log("after reload:", await p2.locator('header button[aria-label*="ound"]').first().getAttribute("aria-label"),
  "-- should still be Sound off");

await b.close();
