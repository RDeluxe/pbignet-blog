// Export the chosen variant (« Trait sur papier pointé ») alone:
// final/schema-harness.svg, standalone with Space Mono embedded, and
// final/schema-harness.png, 1200 px wide (600 displayed at 2x), paper background included.
// Usage: serve this research folder on 127.0.0.1:<port>, then
//   node source/export.ts http://127.0.0.1:<port>
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:4738';
const here = dirname(import.meta.filename);
const out = resolve(here, '..', 'final');
const VARIANT = 'trait';
const PAPER = '#f6f5f1';

function loadPlaywright(): any {
  const projects = join(homedir(), 'projects');
  const dirs = [process.cwd(), resolve(here, '../../..')];
  if (existsSync(projects)) dirs.push(...readdirSync(projects).map((d) => join(projects, d)));
  for (const dir of dirs) {
    const req = createRequire(join(dir, 'package.json'));
    for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
      try { return req(name); } catch { /* next */ }
    }
  }
  throw new Error('Playwright not found');
}

async function launch(pw: any) {
  const ws = process.env.HARNESS_PLAYWRIGHT_WS?.trim();
  if (ws) return pw.chromium.connect(ws, { exposeNetwork: '<loopback>' });
  try { return await pw.chromium.launch(); } catch (e) {
    const cache = join(homedir(), '.cache/ms-playwright');
    const d = readdirSync(cache).filter((x) => /^chromium-\d+$/.test(x)).sort().pop();
    if (!d) throw e;
    return pw.chromium.launch({ executablePath: join(cache, d, 'chrome-linux64/chrome') });
  }
}

const pw = loadPlaywright();
const browser = await launch(pw);
mkdirSync(out, { recursive: true });

// 1) the SVG, taken from the page, with the Space Mono @font-face rules inlined
const page = await browser.newPage();
await page.goto(`${base}/variantes.html?v=${VARIANT}`);
await page.evaluate(() => document.fonts.ready);
const svg: string = await page.evaluate(({ variant, paper }) => {
  const src = document.querySelector(`[data-variant="${variant}"] svg`) as SVGSVGElement;
  const svg = src.cloneNode(true) as SVGSVGElement;
  const [, , w, h] = svg.getAttribute('viewBox')!.split(/\s+/);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  const faces: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSFontFaceRule && /Space Mono/.test(rule.style.getPropertyValue('font-family'))) faces.push(rule.cssText);
    }
  }
  const NS = 'http://www.w3.org/2000/svg';
  const style = document.createElementNS(NS, 'style');
  style.textContent = faces.join('\n');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', w);
  bg.setAttribute('height', h);
  bg.setAttribute('fill', paper);
  const defs = svg.querySelector('defs')!;
  defs.prepend(style);
  defs.after(bg);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg) + '\n';
}, { variant: VARIANT, paper: PAPER });
writeFileSync(join(out, 'schema-harness.svg'), svg);

// 2) the PNG: the exported SVG itself, drawn at 600 px wide in a 2x viewport
const ctx = await browser.newContext({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
const p2 = await ctx.newPage();
await p2.goto(`${base}/variantes.html`);
await p2.setContent(`<html><body style="margin:0;background:${PAPER}"><img id="s" src="${base}/final/schema-harness.svg" style="display:block;width:600px"></body></html>`);
await p2.waitForFunction(() => (document.getElementById('s') as HTMLImageElement).complete);
await p2.waitForTimeout(300);
await p2.locator('#s').screenshot({ path: join(out, 'schema-harness.png') });
await browser.close();
console.log('ok', join(out, 'schema-harness.svg'), svg.length, join(out, 'schema-harness.png'));
