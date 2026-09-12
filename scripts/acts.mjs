import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const g = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  return { top: r.top + window.scrollY, span: r.height - window.innerHeight };
});
console.log("track span", Math.round(g.span));

const stage = p.locator("[data-stage]").first();
for (const [name, t, wait] of [
  ["1-water", 0.46, 3600],
  ["2-dark", 0.64, 1200],
  ["3-timer", 0.86, 900],
  ["4-fired", 0.96, 900],
]) {
  await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * t);
  await p.waitForTimeout(wait);
  await stage.screenshot({ path: `${OUT}/act-${name}.png` });
  console.log("captured", name);
}

// The sound must not be armed until someone asks for it.
await p.evaluate((y) => window.scrollTo(0, y), g.top + g.span * 0.85);
await p.waitForTimeout(400);
const btn = p.locator("button", { hasText: /dings|Sound on/ }).first();
console.log("sound default label:", (await btn.textContent())?.trim());
await btn.click();
await p.waitForTimeout(500);
console.log("after click:", (await btn.textContent())?.trim());
await b.close();
