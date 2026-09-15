// Genera <picture> responsive a partir de src/data/media.json (creado por `npm run images`).
// Si una imagen no está optimizada todavía, se sirve el original local desde /imgs.
const fs = require('node:fs');
const path = require('node:path');

const MANIFEST = path.join(__dirname, 'data/media.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch { /* sin optimizar aún */ }

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function meta(rel) {
  return manifest[rel] || null;
}

function ratio(rel) {
  const m = manifest[rel];
  return m ? m.w / m.h : 1.5;
}

function pic(rel, { alt = '', sizes = '100vw', cls = '', imgCls = '', eager = false, attrs = '' } = {}) {
  const m = manifest[rel];
  const loading = eager ? 'eager" fetchpriority="high' : 'lazy';
  if (!m) {
    return `<picture class="${cls}"><img src="/imgs/${esc(rel)}" alt="${esc(alt)}" loading="${loading}" decoding="async" class="${imgCls}" ${attrs}></picture>`;
  }
  const base = `/media/${rel.replace(/\.(jpe?g|png)$/i, '')}`;
  const set = (ext) => m.sizes.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
  const fallback = m.sizes.find((w) => w >= 1080) || m.sizes.at(-1);
  return `<picture class="${cls}">`
    + `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`
    + `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
    + `<img src="${base}-${fallback}.jpg" width="${m.w}" height="${m.h}" alt="${esc(alt)}" loading="${loading}" decoding="async" class="${imgCls}" style="background:url(${m.lqip}) center/cover" ${attrs}>`
    + `</picture>`;
}

module.exports = { pic, meta, ratio, esc, hasManifest: Object.keys(manifest).length > 0 };
