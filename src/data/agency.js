const content = require('./content.json');

const sentenceCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('es');

// El usuario pidió no usar "consultora de diseño" como descriptor.
const stripDescriptor = (s = '') => s.replace(/^(Somos una consultora de diseño|We are a design consultant(cy)?)\.\s*/i, '');

function about(lang) {
  const a = content.about[lang] || content.about.es;
  return {
    claim: sentenceCase(a.claim),
    intro: stripDescriptor(a.intro),
    services: a.services.map((s, i) => {
      const [lead, ...rest] = s.body.split(/(?<=\.)\s+/);
      return { n: String(i + 1).padStart(2, '0'), title: sentenceCase(s.title), lead, body: rest.join(' '), items: s.items };
    }),
  };
}

module.exports = {
  email: 'hello@1250.com.ar',
  address: {
    lines: ['Paseo Gonnet', 'Cno. Centenario y calle 493', 'Oficina 1'],
    city: 'Manuel B. Gonnet',
    region: { es: 'Buenos Aires, Argentina', en: 'Buenos Aires, Argentina' },
    coords: '34°52′S 58°01′W',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Paseo+Gonnet+Camino+Centenario+y+493+Manuel+B.+Gonnet',
  },
  founders: [
    { name: 'Emilio Laquidara', role: 'Co-Founder', email: 'emilio@1250.com.ar' },
    { name: 'Leandro Paez', role: 'Co-Founder', email: 'leandro@1250.com.ar' },
  ],
  socials: [
    { name: 'Instagram', handle: '1250.design', url: 'https://www.instagram.com/1250.design/' },
    { name: 'Behance', handle: '1250studio', url: 'https://www.behance.net/1250studio/' },
    { name: 'LinkedIn', handle: '1250studio', url: 'https://www.linkedin.com/company/1250studio/' },
    { name: 'Facebook', handle: '1250.studio', url: 'https://www.facebook.com/1250.studio/' },
  ],
  about,
};
