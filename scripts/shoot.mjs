// Visual check: scroll the whole page so every IntersectionObserver fires,
// then capture. Also reports any reveal that never became visible.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.env.URL ?? "http://localhost:3210/";
const OUT = process.env.OUT ?? "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
mkdirSync(OUT, { recursive: true });

const devices = [
  { name: "desk", width: 1440, height: 900, dsf: 2 },
  { name: "phone", width: 390, height: 844, dsf: 3 },
];

const browser = await chromium.launch();

for (const d of devices) {
  const page = await browser.newPage({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: d.dsf,
    isMobile: d.name === "phone",
    hasTouch: d.name === "phone",
  });
  await page.goto(URL, { waitUntil: "networkidle" });

  // Walk the page so every observer fires, then come back.
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += Math.floor(d.height * 0.6)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);

  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll(".line")]
      .filter((el) => getComputedStyle(el).opacity !== "1")
      .map((el) => el.textContent),
  );
  console.log(`${d.name}: ${hidden.length} unrevealed lines`, hidden.slice(0, 6));

  await page.screenshot({ path: `${OUT}/${d.name}.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log("done");
