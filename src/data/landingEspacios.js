// Landing de captación de leads para diseño de locales comerciales.
// Estructura y textos: 1250_LandingEspacios.pdf. Imágenes: proyectos de interiorismo del sitio.
module.exports = {
  // Canal de contacto de la landing: los leads se envían por WhatsApp.
  whatsapp: {
    number: '5492213641486',
    display: '+54 9 221 364-1486',
    greeting: '¡Hola 1250! Quiero transformar mi local comercial.',
  },
  meta: {
    title: 'Diseño de locales comerciales — 1250',
    description: 'Transformamos tu local comercial en una experiencia de marca. Estrategia, identidad y diseño espacial para retail, gastronomía, oficinas, salud y entretenimiento.',
  },
  hero: {
    eyebrow: 'Diseño de locales comerciales',
    lines: ['Transformamos', 'tu local comercial', 'en una <em>experiencia</em>', 'de marca.'],
    intro: 'No diseñamos espacios comunes. Diseñamos locales comerciales con foco en la <strong>experiencia de marca y de usuario</strong> que te ayudan a posicionarte mejor y a vender tus productos y servicios con claridad.',
    cta: 'Quiero transformar mi local',
    secondary: 'Cómo trabajamos',
    strip: ['x-boutique', 'teodelinesias', 'gringos', 'las-camelias', 'p96-crossfit-box'],
  },
  pillars: {
    eyebrow: 'Nuestro enfoque',
    title: 'Un local que <em>vende</em> empieza por una buena estrategia.',
    items: [
      { title: 'Estrategia', text: 'Analizamos juntos los objetivos comerciales de tu empresa y las funciones del espacio en tu ecosistema comercial.' },
      { title: 'Identidad de marca', text: 'Estudiamos tu identidad de marca actual o desarrollamos una nueva y definimos la forma ideal de llevarla al espacio.' },
      { title: 'Diseño espacial', text: 'Definimos el programa funcional y resolvemos el diseño arquitectónico e industrial de todos los componentes.' },
    ],
  },
  stages: {
    eyebrow: 'Proceso',
    title: '¿Cómo son nuestras <em>etapas</em> de trabajo?',
    items: [
      { title: 'Relevamiento y análisis', text: 'Recopilamos y analizamos toda la información disponible sobre tu local, tu negocio y la imagen de tu empresa.' },
      { title: 'Anteproyecto', note: 'La idea', text: 'Desarrollamos el programa espacial y el proyecto de interiorismo que mejor responda a las necesidades de tu marca y tu negocio en el espacio.' },
      { title: 'Proyecto', text: 'Una vez aprobado el anteproyecto desarrollamos todos los planos técnicos necesarios para llevar a cabo la implementación del proyecto de interiorismo, mobiliario y cartelería.' },
    ],
  },
  proof: {
    stat: 200,
    statLabel: 'Espacios diseñados',
    eyebrow: 'Rubros',
    sectors: [
      { name: 'Retail', work: 'x-boutique' },
      { name: 'Gastronomía', work: 'wild-hops-dystopia' },
      { name: 'Oficinas', work: 'tecnoimagen' },
      { name: 'Salud', work: 'marfiles' },
      { name: 'Entretenimiento', work: 'wejump' },
    ],
    gallery: ['ola-tapas', 'casa-roma', 'tienda-ada', 'attend', 'dazzler-los-fuegos', 'ermides-pottery-store-workshop', 'panoramix', 'rincon-del-duende'],
  },
  form: {
    eyebrow: 'Hablemos de tu espacio',
    title: 'Si estás por abrir o remodelar tu espacio es el momento de hacerlo con una <em>mirada estratégica</em>.',
    reassurance: ['Respuesta en menos de 48 h hábiles', 'Primera conversación sin costo', 'Te contactamos por WhatsApp'],
    fields: {
      name: { label: 'Nombre y apellido', placeholder: 'Escribí acá' },
      whatsapp: { label: 'WhatsApp', hint: 'Acá vamos a contactarte', placeholder: 'Ejemplo: +54 9 221 123 4567' },
      email: { label: 'Mail', placeholder: 'tu@empresa.com' },
      company: { label: 'Empresa', placeholder: 'Escribí acá' },
      stage: { label: 'Etapa del proyecto', placeholder: 'Elegí una opción' },
      message: { label: 'Contanos un poco más', placeholder: 'Rubro, ubicación, metros, fechas… (opcional)' },
    },
    stages: ['Estoy por abrir un local nuevo', 'Quiero remodelar mi local actual', 'Estoy buscando local', 'Tengo varias sucursales para unificar', 'Todavía estoy explorando'],
    submit: 'Enviar por WhatsApp',
    sending: 'Abriendo WhatsApp…',
    success: {
      title: '¡Gracias! Ya casi está.',
      text: 'Abrimos WhatsApp con tus datos cargados: solo tenés que tocar enviar. Si no se abrió, usá el botón.',
      button: 'Abrir WhatsApp',
    },
    errors: {
      invalid: 'Revisá los campos marcados.',
      server: 'Hubo un problema al registrar tus datos, pero podés escribirnos igual por WhatsApp.',
    },
    privacy: 'Al enviar se abre WhatsApp con tu consulta. Usamos tus datos solo para contactarte por este proyecto.',
  },
  stickyCta: 'Quiero transformar mi local',
};
