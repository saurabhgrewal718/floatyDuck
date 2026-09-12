import { chromium } from "playwright";
const URL = process.env.URL ?? "http://localhost:3214/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: "networkidle" });

const canvas = page.locator(".floatyButton canvas");
const t = () => canvas.evaluate((el) => getComputedStyle(el).transform);

// 1. She bobs on her own.
const a = await t();
await page.waitForTimeout(700);
const b = await t();
console.log("bob:", a !== b ? "PASS (transform advancing)" : `FAIL (${a})`);

// 2. She squashes when poked, and settles back.
await canvas.dispatchEvent("pointerdown");
await page.waitForTimeout(70);
const squashed = await t();
const sy = Number(squashed.split("(")[1]?.split(",")[3]);
console.log("poke:", sy < 0.985 ? `PASS (scaleY ${sy.toFixed(3)})` : `FAIL (scaleY ${sy})`);
await page.waitForTimeout(900);
const settledY = Number((await t()).split("(")[1]?.split(",")[3]);
console.log("settle:", Math.abs(settledY - 1) < 0.02 ? `PASS (scaleY ${settledY.toFixed(3)})` : `FAIL (${settledY})`);

// 3. Her eye moves when the pointer crosses her.
const box = await canvas.boundingBox();
const pixels = () => canvas.evaluate((el) => el.toDataURL());
// Both points must stay inside the viewport or no pointermove is dispatched at all.
await page.mouse.move(40, 40);
await page.waitForTimeout(300);
const look0 = await pixels();
await page.mouse.move(
  Math.min(1435, box.x + box.width - 4),
  Math.min(895, box.y + box.height - 4),
);
await page.waitForTimeout(300);
const look1 = await pixels();
console.log("gaze:", look0 !== look1 ? "PASS (frame redrawn)" : "FAIL (eye never moved)");
console.log("  (bytes)", look0.length, look1.length);

// 4. Reduced motion leaves her still.
const rm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
const p2 = await rm.newPage();
await p2.goto(URL, { waitUntil: "networkidle" });
const c2 = p2.locator(".floatyButton canvas");
const r1 = await c2.evaluate((el) => getComputedStyle(el).transform);
await p2.waitForTimeout(700);
const r2 = await c2.evaluate((el) => getComputedStyle(el).transform);
const lines = await p2.evaluate(() => [...document.querySelectorAll(".line")].every((el) => getComputedStyle(el).opacity === "1"));
console.log("reduced-motion still:", r1 === r2 ? "PASS" : `FAIL (${r1} -> ${r2})`);
console.log("reduced-motion copy visible:", lines ? "PASS" : "FAIL");

await browser.close();
