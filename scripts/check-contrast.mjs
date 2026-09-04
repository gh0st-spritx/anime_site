/**
 * Measures real text contrast against the composited background.
 *
 * axe-core reports colour-contrast as "incomplete" whenever text sits over an
 * image, because it cannot know the effective background. This samples the
 * actual rendered pixels behind each glyph run instead.
 *
 * Inputs are produced by the capture step: for each sample point, a JSON file
 * of Range-derived glyph rectangles and a screenshot with the copy and the
 * particle canvas hidden.
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';

const dir = process.argv[2];
const points = process.argv.slice(3).map(Number);

const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
};
const parseColor = (s) => s.match(/(\d+(?:\.\d+)?)/g).slice(0, 3).map(Number);

/** WCAG large text: >=24px, or >=18.66px when bold. */
const threshold = (size, weight) =>
  size >= 24 || (size >= 18.66 && Number(weight) >= 700) ? 3.0 : 4.5;

const failures = [];

for (const n of points) {
  const rectFile = `${dir}/g-${n}.json`;
  const shot = `${dir}/bh-${n}.png`;
  if (!existsSync(rectFile) || !existsSync(shot)) continue;

  let rects;
  try {
    rects = JSON.parse(JSON.parse(readFileSync(rectFile, 'utf8')));
  } catch {
    continue;
  }
  if (!rects.length) continue;

  const image = sharp(shot);
  const meta = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  let worst = Infinity;
  let worstTag = '';
  let worstNeed = 4.5;

  for (const r of rects) {
    const fg = lum(...parseColor(r.color));
    const x0 = Math.max(0, r.x);
    const y0 = Math.max(0, r.y);
    const x1 = Math.min(meta.width, r.x + r.w);
    const y1 = Math.min(meta.height, r.y + r.h);
    if (x1 <= x0 || y1 <= y0) continue;

    const values = [];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * meta.width + x) * ch;
        values.push(lum(data[i], data[i + 1], data[i + 2]));
      }
    }
    values.sort((a, b) => a - b);

    // 95th percentile, not the single brightest pixel: one antialiased speck
    // is not what determines whether a line of text can be read.
    const background = values[Math.floor(values.length * 0.95)];
    const contrast = ratio(fg, background);
    const need = threshold(r.size, r.weight);

    if (contrast < need) {
      failures.push({ n, tag: String(r.tag).slice(0, 24), contrast, need });
    }
    if (contrast < worst) {
      worst = contrast;
      worstTag = String(r.tag).slice(0, 24);
      worstNeed = need;
    }
  }

  const verdict = worst >= worstNeed ? 'PASS' : 'FAIL';
  console.log(
    `sample ${String(n).padStart(2)}  worst ${worst.toFixed(2)}:1  needs ${worstNeed}:1  (${worstTag})  ${verdict}`,
  );
}

console.log('');
if (failures.length === 0) {
  console.log('All measured text meets WCAG AA against its real background.');
} else {
  console.log(`${failures.length} failing text run(s):`);
  for (const f of failures) {
    console.log(
      `  sample ${f.n}  ${f.tag.padEnd(24)} ${f.contrast.toFixed(2)}:1  (needs ${f.need}:1)`,
    );
  }
  process.exitCode = 1;
}
