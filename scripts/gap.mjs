import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });
const g = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
// Fully open, before she travels.
await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * 0.22);
await p.waitForTimeout(700);
const m = await p.evaluate(() => {
  const hdr = document.querySelector("header").getBoundingClientRect();
  const mac = document.querySelector("[data-stage] canvas").parentElement.getBoundingClientRect();
  return { headerBottom: +hdr.bottom.toFixed(1), macTop: +mac.top.toFixed(1), gap: +(mac.top - hdr.bottom).toFixed(1) };
});
console.log(`header bottom ${m.headerBottom}  mac top ${m.macTop}  gap ${m.gap}px`,
  m.gap >= 40 ? "PASS" : "FAIL (too tight)");
await b.close();
