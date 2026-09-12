import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const geom = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
console.log("track top", Math.round(geom.top), "span", Math.round(geom.span));

const stage = p.locator("[data-stage]").first();
const marks = [
  ["a-lid", 0.06],
  ["b-open", 0.19],
  ["c-big", 0.30],
  ["d-travel", 0.48],
  ["e-water", 0.80],
  ["f-end", 0.98],
];
for (const [name, t] of marks) {
  await p.evaluate((y) => window.scrollTo(0, y), geom.top + geom.span * t);
  await p.waitForTimeout(t > 0.6 ? 3600 : 500);
  await stage.screenshot({ path: `${OUT}/stg-${name}.png` });
  console.log("captured", name, "at p =", t);
}
await b.close();
