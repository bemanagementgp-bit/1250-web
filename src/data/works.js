// Proyectos migrados desde 1250.com.ar (ver scripts/scrape.mjs → content.json).
const content = require('./content.json');
const { meta: mediaMeta, hasManifest } = require('../media');

// Algunas imágenes ya estaban rotas en el sitio original (404): se omiten de la galería.
const available = (rel) => !hasManifest || !!mediaMeta(rel);

// Datos que el sitio original no tenía como campo: ubicación, destacados y traducciones faltantes.
const extras = {
  'rivadavia-seguros': {
    location: { es: 'Argentina', en: 'Argentina' },
    en: {
      description: [
        'Seguros Rivadavia began updating its Customer Service Centres to strengthen the brand experience and bring more coherence to its service spaces across the country. The challenge was to translate the attributes and values of a brand with more than 80 years of history into a contemporary spatial language — one that improves the experience of clients and staff, optimises how the spaces work, and sets consistent implementation criteria for future openings and refurbishments.',
      ],
    },
  },
  gasol: { location: { es: 'La Plata', en: 'La Plata' } },
  wejump: { location: { es: 'La Plata', en: 'La Plata' } },
  teodelinesias: { location: { es: 'City Bell', en: 'City Bell' } },
  tecnoimagen: { location: { es: 'Buenos Aires', en: 'Buenos Aires' } },
  'p96-crossfit-box': { location: { es: 'Barcelona, España', en: 'Barcelona, Spain' } },
  'femeba-inspire': { location: { es: 'La Plata', en: 'La Plata' } },
  'rincon-del-duende': { location: { es: 'Mar de las Pampas', en: 'Mar de las Pampas' } },
  'wild-hops-dystopia': { location: { es: 'La Plata', en: 'La Plata' } },
  attend: { location: { es: 'Posadas, Misiones', en: 'Posadas, Misiones' } },
  gringos: { location: { es: 'La Plata', en: 'La Plata' } },
  'tienda-ada': { location: { es: 'Villa Constitución, Santa Fe', en: 'Villa Constitución, Santa Fe' } },
  'dazzler-los-fuegos': { location: { es: 'La Plata', en: 'La Plata' } },
  'ola-tapas': { location: { es: 'Estrasburgo, Francia', en: 'Strasbourg, France' } },
  'wild-hops': { location: { es: 'La Plata', en: 'La Plata' } },
  'camara-argentina-de-comercio': { location: { es: 'Buenos Aires', en: 'Buenos Aires' } },
  'primer-congreso-de-periodismo-digital': { location: { es: 'Buenos Aires', en: 'Buenos Aires' } },
  'universidad-caece': { location: { es: 'Buenos Aires', en: 'Buenos Aires' } },
  fango: { location: { es: 'La Plata', en: 'La Plata' } },
  'corazon-de-tango': { location: { es: 'Núremberg, Alemania', en: 'Nuremberg, Germany' } },
  cortez: { location: { es: 'La Plata', en: 'La Plata' } },
  valkirias: { location: { es: 'La Plata', en: 'La Plata' } },
  bat: { location: { es: 'Buenos Aires', en: 'Buenos Aires' } },
  'le-sfogline': { location: { es: 'Bernal', en: 'Bernal' } },
  'gran-premio-25-de-mayo': { location: { es: 'San Isidro', en: 'San Isidro' } },
};

// Los mismos destacados que muestra la home original.
const FEATURED = ['rivadavia-seguros', 'gasol', 'x-boutique', 'wejump', 'teodelinesias', 'tecnoimagen', 'marfiles', 'p96-crossfit-box'];

const DISCIPLINES = {
  branding: /branding|identidad|identity|marca|brand design|re-?targeting/i,
  interiors: /interior|espacios|spaces|space design/i,
  naming: /naming/i,
  wayfinding: /señal|orientación|wayfinding|comunicación espacial|spatial communication/i,
  campaigns: /campaña|campaign|web|advertising/i,
  strategy: /estratégica|strategic|implementación|implementation/i,
};

const base = content.works.map((w, index) => {
  const allServices = [...w.es.services, ...w.en.services];
  return {
    ...w,
    index,
    featured: FEATURED.includes(w.slug),
    disciplines: Object.keys(DISCIPLINES).filter((d) => allServices.some((s) => DISCIPLINES[d].test(s))),
  };
});

function localize(w, lang) {
  const L = w[lang] || w.es;
  const x = extras[w.slug] || {};
  return {
    id: w.id,
    slug: w.slug,
    index: w.index,
    featured: w.featured,
    disciplines: w.disciplines,
    cover: w.cover,
    gallery: w.gallery.filter(available),
    // El sitio original usa "´" como apóstrofo (p. ej. Gringo´s).
    title: L.title.replace(/ - /g, ' — ').replace(/´/g, '’'),
    client: L.client.replace(/´/g, '’'),
    tagline: L.tagline,
    industry: L.industry,
    services: L.services,
    description: x[lang]?.description || L.description,
    location: x.location?.[lang] || 'Argentina',
  };
}

const cache = {};
function works(lang) {
  if (!cache[lang]) cache[lang] = base.map((w) => localize(w, lang));
  return cache[lang];
}

module.exports = {
  works,
  featured: (lang) => FEATURED.map((slug) => works(lang).find((w) => w.slug === slug)).filter(Boolean),
  getWork: (lang, slug) => works(lang).find((w) => w.slug === slug),
  nextWork: (lang, w) => works(lang)[(w.index + 1) % base.length],
  disciplines: Object.keys(DISCIPLINES),
};
