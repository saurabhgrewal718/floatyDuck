import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-saurabhgrewal-Documents-Personal-macPetWeb/30447c15-57c7-4db8-a643-9b86800cf696/scratchpad";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(process.env.URL, { waitUntil: "networkidle" });

const sec = p.locator("section").filter({ hasText: "Nothing leaves" }).first();
await sec.scrollIntoViewIfNeeded();
await p.waitForTimeout(900);

// Every child of the privacy section must share one centre axis.
const centres = await sec.evaluate((el) => {
  const box = el.getBoundingClientRect();
  return {
    section: +(box.left + box.width / 2).toFixed(1),
    children: [...el.children].map((c) => {
      const r = c.getBoundingClientRect();
      return { tag: c.tagName, centre: +(r.left + r.width / 2).toFixed(1) };
    }),
  };
});
const off = centres.children.filter((c) => Math.abs(c.centre - centres.section) > 1);
console.log("section centre", centres.section);
for (const c of centres.children) console.log(" ", c.tag, c.centre);
console.log(off.length === 0 ? "PASS all children share one axis" : `FAIL ${off.length} off-axis`);

// The fine print must actually be constrained (the :global fix).
const fineW = await sec.locator(".fine").first().evaluate((el) => el.getBoundingClientRect().width);
console.log("fine print width", Math.round(fineW), fineW <= 520 ? "PASS (<= 32rem)" : "FAIL (unconstrained)");

await sec.screenshot({ path: `${OUT}/privacy.png` });

// Triad: her visible left edge should line up with the label beneath her.
const triad = p.locator("section").filter({ hasText: "Eye rest" }).first();
await triad.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await triad.screenshot({ path: `${OUT}/triad.png` });
await b.close();
