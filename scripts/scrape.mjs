// Migración del sitio original (1250.com.ar): textos ES/EN + imágenes a local.
// Uso: npm run scrape   (flags: --no-images, --force)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://1250.com.ar';
const OUT_JSON = path.join(ROOT, 'src/data/content.json');
const RAW_DIR = path.join(ROOT, 'assets/raw');
const args = new Set(process.argv.slice(2));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s = '') => s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

/* ------------------------------------------------------------------ sesión por idioma */
// El sitio guarda el idioma en la sesión PHP: pedimos ?lang=X sin seguir redirecciones y reutilizamos la cookie.
async function session(lang) {
  const res = await fetch(`${ORIGIN}/?lang=${lang}`, { redirect: 'manual' });
  const cookie = (res.headers.getSetCookie?.() || [res.headers.get('set-cookie')])
    .filter(Boolean).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error(`Sin cookie de sesión para ${lang}`);
  // Algunos servidores requieren tocar la home con la cookie para fijar el idioma.
  await fetch(`${ORIGIN}/?lang=${lang}`, { headers: { cookie }, redirect: 'manual' });
  return async (p) => {
    for (let attempt = 1; ; attempt++) {
      try {
        const r = await fetch(ORIGIN + p, { headers: { cookie }, redirect: 'follow' });
        if (!r.ok) throw new Error(`${r.status} ${p}`);
        return cheerio.load(await r.text());
      } catch (err) {
        if (attempt >= 3) throw err;
        await sleep(500 * attempt);
      }
    }
  };
}

/* ------------------------------------------------------------------ parsers */
function paragraphs($, el) {
  const htmlStr = $(el).html() || '';
  return htmlStr
    .split(/<br\s*\/?>/i)
    .map((chunk) => clean(cheerio.load(`<div>${chunk}</div>`)('div').text()))
    .filter(Boolean);
}

function parseWork($) {
  const meta = {};
  $('.resumen span').each((_, span) => {
    let text = '';
    let node = span.nextSibling;
    while (node && node.name !== 'span') {
      if (node.type === 'text') text += node.data;
      node = node.nextSibling;
    }
    meta[clean($(span).text()).toLowerCase()] = clean(text);
  });
  const pick = (...keys) => keys.map((k) => meta[k]).find((v) => v !== undefined) || '';
  const gallery = [];
  $('.clip_galeria img').each((_, img) => gallery.push($(img).attr('src')));
  $('.clip_galeria iframe, .clip_galeria video source').each((_, v) => gallery.push($(v).attr('src')));
  return {
    title: clean($('.col_principal h1').first().text()),
    tagline: clean($('.col_principal p').first().text()),
    client: pick('cliente', 'client'),
    industry: pick('industria', 'industry'),
    services: pick('servicios', 'services').split(/\s*\/\s*/).filter(Boolean),
    description: paragraphs($, $('.descricion').first()),
    cover: $('.ClipPortada img').first().attr('src'),
    gallery,
  };
}

function parseAbout($) {
  // Cada bloque de servicio es un título en mayúsculas seguido de párrafo y lista con bullets "•".
  const text = clean($('body').text());
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const claimIdx = lines.findIndex((l) => /^(AYUDAMOS|WE HELP)/.test(l));
  const claim = [lines[claimIdx], lines[claimIdx + 1]].join(' ');
  const intro = lines[claimIdx + 2];
  const services = [];
  for (let i = claimIdx + 3; i < lines.length; i++) {
    const l = lines[i];
    if (/^(Cuál es tu idea|What.?s your idea)/i.test(l)) break;
    if (l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(l) && !l.startsWith('•')) {
      services.push({ title: l, body: '', items: [] });
    } else if (services.length) {
      const s = services.at(-1);
      if (l.startsWith('•')) s.items.push(...l.split('•').map((x) => x.trim().replace(/\.$/, '')).filter(Boolean));
      else s.body = s.body ? `${s.body} ${l}` : l;
    }
  }
  return { claim, intro, services };
}

function parseContact($) {
  const lines = clean($('body').text()).split('\n').map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((l) => /^(Tenés|You have)/i.test(l));
  return { headline: lines[start], lines: lines.slice(start, start + 20) };
}

function parseWorksIndex($) {
  const list = [];
  $('a[href*="/work/"]').each((_, a) => {
    const m = $(a).attr('href').match(/\/work\/([^/]+)\/(\d+)/);
    if (m && !list.some((w) => w.slug === m[1])) list.push({ slug: m[1], id: +m[2] });
  });
  return list;
}

/* ------------------------------------------------------------------ imágenes */
async function download(url, dest) {
  if (!args.has('--force')) {
    try { await fs.access(dest); return 'skip'; } catch { /* no existe */ }
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status}`);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
      return 'ok';
    } catch (err) {
      if (attempt >= 3) return `error ${err.message}`;
      await sleep(600 * attempt);
    }
  }
}

async function pool(items, size, fn) {
  let i = 0;
  let done = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
      done++;
      if (done % 25 === 0 || done === items.length) process.stdout.write(`\r  ${done}/${items.length}`);
    }
  });
  await Promise.all(workers);
  process.stdout.write('\n');
}

/* ------------------------------------------------------------------ main */
const toLocal = (url) => (url ? new URL(url, ORIGIN).pathname.replace(/^\/imgs\//, '').split('?')[0] : null);

console.log('→ Sesiones ES/EN');
const es = await session('Spanish');
const en = await session('English');

console.log('→ Índice de proyectos');
const index = parseWorksIndex(await es('/works'));
console.log(`  ${index.length} proyectos`);

console.log('→ Casos');
const works = [];
for (const { slug, id } of index) {
  const [wEs, wEn] = await Promise.all([es(`/work/${slug}/${id}`), en(`/work/${slug}/${id}`)]);
  const a = parseWork(wEs);
  const b = parseWork(wEn);
  works.push({
    id,
    slug,
    cover: toLocal(a.cover) || `works/${id}/big0000.jpg`,
    gallery: a.gallery.filter((g) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(g)).map(toLocal),
    videos: a.gallery.filter((g) => !/\.(jpe?g|png|gif|webp)(\?|$)/i.test(g)),
    es: { title: a.title, tagline: a.tagline, client: a.client, industry: a.industry, services: a.services, description: a.description },
    en: {
      title: b.title || a.title,
      tagline: b.tagline || a.tagline,
      client: b.client || a.client,
      industry: b.industry || a.industry,
      services: b.services.length ? b.services : a.services,
      description: b.description.length ? b.description : a.description,
    },
  });
  process.stdout.write(`\r  ${works.length}/${index.length} ${slug.padEnd(40)}`);
}
process.stdout.write('\n');

console.log('→ Agencia y contacto');
const [aboutEs, aboutEn, contactEs, contactEn] = await Promise.all([es('/about'), en('/about'), es('/contact'), en('/contact')]);

const content = {
  scrapedAt: new Date().toISOString(),
  source: ORIGIN,
  about: { es: parseAbout(aboutEs), en: parseAbout(aboutEn) },
  contact: { es: parseContact(contactEs), en: parseContact(contactEn) },
  works,
};
await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, JSON.stringify(content, null, 2));
console.log(`  guardado ${path.relative(ROOT, OUT_JSON)}`);

if (!args.has('--no-images')) {
  const files = new Set(['agencia.jpg', '1250.jpg', 'logo-negro.svg', 'logo-blanco.svg']);
  works.forEach((w) => { files.add(w.cover); w.gallery.forEach((g) => files.add(g)); });
  console.log(`→ Imágenes (${files.size})`);
  const errors = [];
  await pool([...files], 8, async (rel) => {
    const status = await download(`${ORIGIN}/imgs/${rel}`, path.join(RAW_DIR, rel));
    if (status.startsWith('error')) errors.push(`${rel} ${status}`);
  });
  if (errors.length) console.warn(`  ${errors.length} con error:\n  ${errors.join('\n  ')}`);
}
console.log('✓ Listo. Ejecutá `npm run images` para generar las versiones optimizadas.');
