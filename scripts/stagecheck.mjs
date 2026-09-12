import { chromium } from "playwright";
const b = await chromium.launch();

// 1. Normal: the track is tall and the stage pins.
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.env.URL, { waitUntil: "networkidle" });
const norm = await p.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const st = document.querySelector("[data-stage]");
  return { h: t.getBoundingClientRect().height, pos: getComputedStyle(st).position };
});
console.log("track height:", Math.round(norm.h), "| stage position:", norm.pos,
  norm.h > 3000 && norm.pos === "sticky" ? "PASS" : "FAIL");

// The canvas backing store must match its CSS box, or she stretches.
const ratio = await p.evaluate(() => {
  const c = document.querySelector("[data-stage] canvas");
  // Layout size, not the transformed rect -- the lid is rotated at rest.
  return { css: c.offsetWidth / c.offsetHeight, store: c.width / c.height };
});
console.log("canvas aspect css", ratio.css.toFixed(3), "store", ratio.store.toFixed(3),
  Math.abs(ratio.css - ratio.store) < 0.02 ? "PASS" : "FAIL");

// 2. Reduced motion: no pin, no tall track.
const rm = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
const p2 = await rm.newPage();
await p2.goto(process.env.URL, { waitUntil: "networkidle" });
await p2.waitForTimeout(600);
const red = await p2.evaluate(() => {
  const t = document.querySelector("[data-stage-track]");
  const st = document.querySelector("[data-stage]");
  const mac = document.querySelector("[data-stage] canvas").parentElement;
  return {
    h: t.getBoundingClientRect().height,
    pos: getComputedStyle(st).position,
    transform: getComputedStyle(mac).transform,
  };
});
console.log("reduced track height:", Math.round(red.h), "| position:", red.pos,
  red.h < 2000 && red.pos === "static" ? "PASS" : "FAIL");
console.log("reduced lid untransformed:", red.transform === "none" ? "PASS" : `FAIL (${red.transform})`);
await b.close();
