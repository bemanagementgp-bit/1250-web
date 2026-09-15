const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');
const compression = require('compression');

const agency = require('./src/data/agency');
const data = require('./src/data/works');
const service360 = require('./src/data/service360');
const { LANGS, routes, url, t } = require('./src/i18n');
const { pic, ratio, meta } = require('./src/media');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(compression());
app.use(express.json({ limit: '20kb' }));

const longCache = { maxAge: isProd ? '30d' : 0, immutable: isProd };
app.use('/media', express.static(path.join(__dirname, 'public/media'), longCache));
app.use('/imgs', express.static(path.join(__dirname, 'assets/raw'), longCache));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '1d' : 0 }));

app.locals.agency = agency;
app.locals.pic = pic;
app.locals.ratio = ratio;
app.locals.media = meta;
app.locals.year = new Date().getFullYear();

// Redirecciones desde las URLs del sitio original.
app.get('/', (req, res, next) => (req.query.lang === 'English' ? res.redirect(301, '/en') : next()));
app.get('/works', (req, res) => res.redirect(301, url('es', 'works')));
app.get('/about', (req, res) => res.redirect(301, url('es', 'about')));
app.get('/contact', (req, res) => res.redirect(301, url('es', 'contact')));
app.get('/work/:slug{/:id}', (req, res) => res.redirect(301, url('es', 'work', req.params.slug)));

for (const lang of LANGS) {
  const T = t[lang];
  const all = data.works(lang);

  const render = (res, view, page, locals = {}, slug) => res.render(view, {
    lang,
    t: T,
    page,
    url: (p, s) => url(lang, p, s),
    alt: Object.fromEntries(LANGS.map((l) => [l, url(l, page, slug)])),
    totalWorks: all.length,
    about: agency.about(lang),
    service360: service360[lang],
    ...locals,
  });

  app.get(routes.home[lang], (req, res) => render(res, 'index', 'home', { title: T.meta.home, featured: data.featured(lang), works: all }));

  app.get(routes.works[lang], (req, res) => render(res, 'works', 'works', { title: T.meta.works, works: all, disciplines: data.disciplines }));

  app.get(routes.work[lang], (req, res, next) => {
    const work = data.getWork(lang, req.params.slug);
    if (!work) return next();
    render(res, 'work', 'work', {
      title: `${work.title} — 1250`,
      description: work.description[0],
      ogImage: `/media/${work.cover.replace(/\.(jpe?g|png)$/i, '')}-1080.jpg`,
      work,
      next: data.nextWork(lang, work),
    }, work.slug);
  });

  app.get(routes.service[lang], (req, res) => {
    const S = service360[lang];
    render(res, 'service', 'service', { title: S.meta, description: S.description, S });
  });

  app.get(routes.about[lang],(req, res) => render(res, 'about', 'about', { title: T.meta.about, works: all }));

  app.get(routes.contact[lang], (req, res) => render(res, 'contact', 'contact', { title: T.meta.contact }));
}

app.get('/api/works', (req, res) => res.json(data.works(req.query.lang === 'en' ? 'en' : 'es')));

// Guarda consultas en storage/messages.jsonl (en Vercel el disco es de solo lectura: se usa /tmp, que es efímero,
// y la consulta queda en los logs). Conectar un proveedor de email (p. ej. Resend o nodemailer) para producción.
const STORAGE_DIR = process.env.VERCEL ? path.join(os.tmpdir(), '1250') : path.join(__dirname, 'storage');
app.post('/api/contact', async (req, res) => {
  const body = req.body || {};
  const T = t[body.lang === 'en' ? 'en' : 'es'].contact;
  const clean = (v, max) => String(v ?? '').trim().slice(0, max);
  const entry = {
    at: new Date().toISOString(),
    lang: body.lang === 'en' ? 'en' : 'es',
    name: clean(body.name, 120),
    email: clean(body.email, 200),
    company: clean(body.company, 120),
    interest: (Array.isArray(body.interest) ? body.interest : []).map((i) => clean(i, 40)).slice(0, 10),
    message: clean(body.message, 4000),
  };
  if (!entry.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email) || entry.message.length < 10) {
    return res.status(422).json({ ok: false, error: T.invalid });
  }
  try {
    if (process.env.VERCEL) console.log('[contact]', JSON.stringify(entry));
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.appendFile(path.join(STORAGE_DIR, 'messages.jsonl'), JSON.stringify(entry) + '\n');
    res.json({ ok: true, message: T.success });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: `${T.error} ${agency.email}` });
  }
});

// JSON mal formado u otros errores: nunca exponer el stack al cliente.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ ok: false, error: 'Bad request' });
  }
  console.error(err);
  res.status(500).send('Error');
});

app.use((req, res) => {
  const lang = req.path.startsWith('/en') ? 'en' : 'es';
  res.status(404).render('404', {
    lang, t: t[lang], page: '404', title: t[lang].meta.notFound,
    url: (p, s) => url(lang, p, s), alt: { es: '/', en: '/en' }, totalWorks: data.works(lang).length,
  });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`1250 → http://localhost:${PORT}`));
}

module.exports = app;
