import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(m.type().toUpperCase() + ":", m.text()); });
await p.addInitScript(() => {
  window.addEventListener("unhandledrejection", (e) => {
    console.error("UNHANDLED: " + (e.reason && (e.reason.message || e.reason)));
  });
});
await p.goto(process.env.URL, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const st = await p.evaluate(() => {
  const c = new (window.AudioContext)();
  return { freshState: c.state, sr: c.sampleRate };
});
console.log("a fresh AudioContext in this browser:", JSON.stringify(st));
await b.close();
