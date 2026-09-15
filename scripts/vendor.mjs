// Copia GSAP y Lenis a public/vendor para servirlos como estáticos (local y en Vercel).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ['node_modules/gsap/dist/gsap.min.js', 'public/vendor/gsap/gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'public/vendor/gsap/ScrollTrigger.min.js'],
  ['node_modules/gsap/dist/SplitText.min.js', 'public/vendor/gsap/SplitText.min.js'],
  ['node_modules/gsap/dist/Flip.min.js', 'public/vendor/gsap/Flip.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'public/vendor/lenis/lenis.min.js'],
];

for (const [from, to] of files) {
  await fs.mkdir(path.dirname(path.join(ROOT, to)), { recursive: true });
  await fs.copyFile(path.join(ROOT, from), path.join(ROOT, to));
}
console.log(`✓ vendor: ${files.length} archivos → public/vendor`);
