import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.addInitScript(() => {
  window.__log = { resumes: [], pointerdowns: 0, ctxCreated: 0 };
  const AC = window.AudioContext;
  const Wrapped = function (...a) {
    window.__log.ctxCreated++;
    const c = new AC(...a);
    const r = c.resume.bind(c);
    c.resume = () =>
      r().then(
        () => { window.__log.resumes.push("ok:" + c.state); },
        (e) => { window.__log.resumes.push("rej:" + (e && e.name)); },
      );
    return c;
  };
  Wrapped.prototype = AC.prototype;
  window.AudioContext = Wrapped;
  window.addEventListener("pointerdown", () => { window.__log.pointerdowns++; }, true);
});
await p.goto(process.env.URL, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
console.log("before click:", JSON.stringify(await p.evaluate(() => window.__log)));

await p.locator("h1").click();
await p.waitForTimeout(600);
console.log("after  click:", JSON.stringify(await p.evaluate(() => window.__log)));
console.log("label:", await p.locator('header button[aria-label*="ound"]').first().getAttribute("aria-label"));
await b.close();
