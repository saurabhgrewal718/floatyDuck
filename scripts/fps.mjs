import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const res = await p.evaluate(async () => {
  const t = document.querySelector("[data-stage-track]");
  const r = t.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const span = r.height - window.innerHeight;

  // Drive the scroll through the whole sequence and time every frame.
  const frames = [];
  await new Promise((done) => {
    const START = performance.now();
    const DUR = 2600;
    let prev = START;
    const step = (now) => {
      frames.push(now - prev);
      prev = now;
      const k = Math.min(1, (now - START) / DUR);
      window.scrollTo(0, top + span * k);
      if (k < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  });

  const d = frames.slice(2).sort((a, b) => a - b);
  const pct = (q) => d[Math.floor(d.length * q)];
  return {
    n: d.length,
    median: +pct(0.5).toFixed(2),
    p95: +pct(0.95).toFixed(2),
    worst: +d[d.length - 1].toFixed(2),
    over8: d.filter((x) => x > 8.4).length,
    over16: d.filter((x) => x > 16.8).length,
  };
});
console.log(JSON.stringify(res, null, 2));
console.log(`median ${res.median}ms -> ~${Math.round(1000 / res.median)}fps | frames over 8.4ms: ${res.over8}/${res.n} | over 16.8ms: ${res.over16}`);
await b.close();
