// Genera variantes responsive (AVIF/WebP/JPG) desde assets/raw → public/media.
// Escribe src/data/media.json con dimensiones para evitar saltos de layout.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'assets/raw');
const OUT = path.join(ROOT, 'public/media');
const MANIFEST = path.join(ROOT, 'src/data/media.json');
const WIDTHS = [640, 1080, 1920];
const force = process.argv.includes('--force');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return out.flat();
}

const exists = (p) => fs.access(p).then(() => true, () => false);

const files = (await walk(RAW)).filter((f) => /\.(jpe?g|png)$/i.test(f));
const manifest = {};
let done = 0;

sharp.concurrency(4);
const queue = [...files];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const file = queue.shift();
    const rel = path.relative(RAW, file).replace(/\\/g, '/');
    const base = rel.replace(/\.(jpe?g|png)$/i, '');
    try {
      const img = sharp(file, { failOn: 'none' }).rotate();
      const { width, height } = await img.metadata();
      const widths = WIDTHS.filter((w) => w < width).concat(width > WIDTHS.at(-1) ? [] : [width]);
      const sizes = [...new Set(widths.length ? widths : [width])];
      // AVIF + WebP en todos los tamaños; un único JPG de respaldo (el más cercano a 1080).
      const fallback = sizes.find((w) => w >= 1080) || sizes.at(-1);
      for (const w of sizes) {
        const target = path.join(OUT, `${base}-${w}`);
        await fs.mkdir(path.dirname(target), { recursive: true });
        const resized = sharp(file, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
        const jobs = [];
        if (force || !(await exists(`${target}.avif`))) jobs.push(resized.clone().avif({ quality: 50, effort: 4 }).toFile(`${target}.avif`));
        if (force || !(await exists(`${target}.webp`))) jobs.push(resized.clone().webp({ quality: 74 }).toFile(`${target}.webp`));
        if (w === fallback) {
          if (force || !(await exists(`${target}.jpg`))) jobs.push(resized.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${target}.jpg`));
        } else {
          await fs.rm(`${target}.jpg`, { force: true });
        }
        await Promise.all(jobs);
      }
      // Placeholder borroso diminuto en base64 para la carga progresiva.
      const lqip = await sharp(file, { failOn: 'none' }).resize(24).blur().webp({ quality: 40 }).toBuffer();
      manifest[rel] = { w: width, h: height, sizes, lqip: `data:image/webp;base64,${lqip.toString('base64')}` };
    } catch (err) {
      console.warn(`\n  ${rel}: ${err.message}`);
    }
    done++;
    if (done % 20 === 0 || done === files.length) process.stdout.write(`\r  ${done}/${files.length}`);
  }
}));

await fs.writeFile(MANIFEST, JSON.stringify(manifest));
console.log(`\n✓ ${Object.keys(manifest).length} imágenes → public/media`);
