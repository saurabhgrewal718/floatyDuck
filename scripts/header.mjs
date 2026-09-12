import { chromium } from "playwright";
const URL = process.env.URL ?? "http://localhost:3215/";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();

// Desktop header, at rest and after scrolling (the hairline should appear).
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
await p.goto(URL, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.locator("header").screenshot({ path: `${OUT}/hdr-top.png` });
await p.evaluate(() => window.scrollTo(0, 1200));
await p.waitForTimeout(600);
await p.locator("header").screenshot({ path: `${OUT}/hdr-scrolled.png` });
await p.screenshot({ path: `${OUT}/hdr-context.png` });

// Phone header.
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await m.goto(URL, { waitUntil: "networkidle" });
await m.waitForTimeout(400);
await m.locator("header").screenshot({ path: `${OUT}/hdr-phone.png` });
await b.close();
console.log("captured");
