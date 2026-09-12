import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.goto(process.env.URL, { waitUntil: "networkidle" });
const g = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * 0.85);
await p.waitForTimeout(3800);
await p.locator("[data-stage]").screenshot({ path: `${OUT}/stg-phone.png` });
const fits = await p.evaluate(() => {
  const st = document.querySelector("[data-stage]");
  return { stage: st.getBoundingClientRect().height, vh: window.innerHeight, overflow: document.documentElement.scrollWidth > window.innerWidth };
});
console.log("stage h", Math.round(fits.stage), "vh", fits.vh, "h-overflow:", fits.overflow ? "FAIL" : "PASS");
await b.close();
