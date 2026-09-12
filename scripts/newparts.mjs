import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const vid = p.locator("section").nth(1);
await vid.scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
await vid.screenshot({ path: `${OUT}/video.png` });

const sec = p.locator("section").filter({ hasText: "Nothing leaves" }).first();
await sec.scrollIntoViewIfNeeded();
await p.waitForTimeout(800);
await sec.screenshot({ path: `${OUT}/security.png` });

// Section order sanity.
const order = await p.evaluate(() =>
  [...document.querySelectorAll("main > section")].map((el) => {
    const h = el.querySelector("h1, h2, h3");
    return (h?.textContent || el.className).replace(/\s+/g, " ").trim().slice(0, 42);
  }),
);
console.log("sections:", JSON.stringify(order, null, 1));
await b.close();
