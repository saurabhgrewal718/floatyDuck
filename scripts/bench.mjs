import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const out = await p.evaluate(() => {
  const W = 1040, H = 650, DPR = 2, PIXELS = 200, DROPS = 18;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W * DPR; c.height = H * DPR;
    const x = c.getContext("2d");
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.imageSmoothingEnabled = false;
    return [c, x];
  };

  // A: what the code does now -- a fillRect per art pixel, fillText per droplet.
  const [, a] = mk();
  const rects = Array.from({ length: PIXELS }, (_, i) => [i % 18, (i / 18) | 0]);
  const drawA = () => {
    a.clearRect(0, 0, W, H);
    const dp = 36;
    a.fillStyle = "#fee761";
    for (const [x, y] of rects) a.fillRect(400 + x * dp, 200 + y * dp, dp, dp);
    a.font = '20px "Apple Color Emoji", sans-serif';
    a.textBaseline = "middle"; a.textAlign = "center";
    for (let i = 0; i < DROPS; i++) a.fillText("💧", 60, 40 + i * 32);
  };

  // B: pre-rendered sprites, one drawImage each.
  const [, bx] = mk();
  const duck = document.createElement("canvas");
  duck.width = 18 * 36 * DPR; duck.height = 18 * 36 * DPR;
  const dctx = duck.getContext("2d");
  dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  dctx.fillStyle = "#fee761";
  for (const [x, y] of rects) dctx.fillRect(x * 36, y * 36, 36, 36);
  const drop = document.createElement("canvas");
  drop.width = 26 * DPR; drop.height = 26 * DPR;
  const pctx = drop.getContext("2d");
  pctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  pctx.font = '20px "Apple Color Emoji", sans-serif';
  pctx.textBaseline = "middle"; pctx.textAlign = "center";
  pctx.fillText("💧", 13, 13);
  const drawB = () => {
    bx.clearRect(0, 0, W, H);
    bx.drawImage(duck, 400, 200, 18 * 36, 18 * 36);
    for (let i = 0; i < DROPS; i++) bx.drawImage(drop, 47, 27 + i * 32, 26, 26);
  };

  const time = (fn) => {
    for (let i = 0; i < 30; i++) fn();
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) fn();
    return (performance.now() - t0) / 300;
  };

  return { a: +time(drawA).toFixed(3), b: +time(drawB).toFixed(3) };
});

console.log(`fillRect + fillText : ${out.a} ms/frame`);
console.log(`sprite blits        : ${out.b} ms/frame`);
console.log(`-> ${(out.a / out.b).toFixed(1)}x cheaper; budget at 120Hz is 8.33 ms`);
await b.close();
