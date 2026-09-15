/* global gsap, ScrollTrigger, SplitText, Flip, Lenis */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const html = document.documentElement;
const I18N = window.I18N || {};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
gsap.defaults({ ease: 'expo.out', duration: 1.2 });

/* ---------------------------------------------------------------- Smooth scroll */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: 'smooth' }));
$$('[data-scroll-top]').forEach((b) => b.addEventListener('click', () => scrollTo(0)));

/* ---------------------------------------------------------------- Transiciones entre páginas */
const cols = $$('[data-transition] .t-col');
const transitionIn = () => gsap.to(cols, { scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'expo.inOut', stagger: 0.05 });

function transitionOut(href) {
  lenis?.stop();
  gsap.set(cols, { transformOrigin: 'bottom' });
  gsap.to(cols, { scaleY: 1, duration: 0.8, ease: 'expo.inOut', stagger: 0.05, onComplete: () => location.assign(href) });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const target = new URL(a.href, location.href);
  if (a.target === '_blank' || target.origin !== location.origin || a.hasAttribute('download') || target.protocol === 'mailto:') return;
  if (target.pathname === location.pathname && target.hash) return;
  e.preventDefault();
  if (target.href === location.href) return;
  closeMenu();
  transitionOut(target.href);
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) { gsap.set(cols, { scaleY: 0 }); lenis?.start(); }
});

/* ---------------------------------------------------------------- Cursor */
const cursor = $('.cursor');
const follower = $('.cursor-follower');
if (finePointer && !reduced && cursor) {
  html.classList.add('has-cursor');
  const label = $('span', follower);
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.1, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.1, ease: 'power3' });
  const fx = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
  const fy = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });
  gsap.set(follower, { xPercent: -50, yPercent: -50 });

  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); fx(e.clientX); fy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const labeled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, summary, label');
    follower.classList.toggle('is-active', !!labeled);
    follower.classList.toggle('is-hover', !labeled && !!interactive);
    if (labeled) label.textContent = labeled.dataset.cursor;
  });
  document.documentElement.addEventListener('pointerleave', () => gsap.to([cursor, follower], { opacity: 0 }));
  document.documentElement.addEventListener('pointerenter', () => gsap.to([cursor, follower], { opacity: 1 }));
}

/* ---------------------------------------------------------------- Magnético */
if (finePointer && !reduced) {
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------------------------------------------------------------- Header: ocultar al bajar + color según la sección */
const header = $('[data-header]');
let lastY = 0;
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    const hide = y > 240 && y > lastY && !html.classList.contains('menu-open');
    gsap.to(header, { yPercent: hide ? -110 : 0, duration: 0.6, overwrite: true });
    lastY = y;
  },
});

function watchThemes() {
  const headerMid = () => (header.offsetHeight || 80) / 2;
  $$('[data-theme]').filter((el) => el !== header).forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top ${headerMid()}`,
      end: () => `bottom ${headerMid()}`,
      onToggle: (self) => { if (self.isActive) header.dataset.theme = section.dataset.theme; },
    });
  });
}

/* ---------------------------------------------------------------- Menú móvil */
const menu = $('[data-menu]');
const toggle = $('[data-menu-toggle]');
let themeBeforeMenu = 'dark';
function openMenu() {
  html.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true');
  themeBeforeMenu = header.dataset.theme;
  header.dataset.theme = 'brand';
  lenis?.stop();
  gsap.set(menu, { visibility: 'visible' });
  gsap.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' });
  gsap.fromTo($$('[data-menu-item]', menu), { yPercent: 110 }, { yPercent: 0, stagger: 0.07, delay: 0.35 });
}
function closeMenu() {
  if (!html.classList.contains('menu-open')) return;
  html.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  header.dataset.theme = themeBeforeMenu;
  lenis?.start();
  gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) });
}
toggle?.addEventListener('click', () => (html.classList.contains('menu-open') ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

/* ---------------------------------------------------------------- Reloj */
const clock = $('[data-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang, { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  const tick = () => (clock.textContent = `${clock.dataset.city} ${fmt.format(new Date())}`);
  tick();
  setInterval(tick, 30_000);
}

/* ---------------------------------------------------------------- Animaciones reutilizables */
function heroIntro(delay = 0) {
  const tl = gsap.timeline({ delay });
  const lines = $$('[data-hero-line]');
  if (lines.length) tl.from(lines, { yPercent: 118, rotate: 2.5, duration: 1.6, stagger: 0.1 }, 0);

  const pills = $$('[data-hero-pill]');
  if (pills.length) tl.from(pills, { width: 0, marginLeft: 0, marginRight: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.15 }, 0.5);

  $$('[data-split-hero]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words,chars', mask: 'chars', charsClass: 'split-char', wordsClass: 'inline-block' });
    tl.from(split.chars, { yPercent: 110, duration: 1.4, stagger: 0.022 }, 0);
  });

  const fades = $$('[data-hero-fade], [data-fade]');
  if (fades.length) tl.from(fades, { y: 24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.45);
  return tl;
}

function scrollAnimations() {
  $$('[data-split-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, stagger: 0.1, duration: 1.4, scrollTrigger: { trigger: el, start: 'top 85%' } }),
    });
  });

  $$('[data-scrub-words]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
      }),
    });
  });

  $$('[data-reveal]').forEach((el) => {
    gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 92%' } });
    const img = $('[data-parallax-img]', el);
    if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  $$('[data-stagger]').forEach((el) => {
    gsap.from(el.children, { y: 36, opacity: 0, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2.2, ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
  });

  const skewTargets = $$('[data-velocity-skew]');
  if (skewTargets.length) {
    const setSkew = gsap.quickTo(skewTargets, 'skewX', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({ onUpdate: (self) => setSkew(gsap.utils.clamp(-10, 10, self.getVelocity() / -260)) });
  }

  const mega = $('[data-footer-mega]');
  if (mega) gsap.fromTo(mega, { yPercent: 35 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: mega.parentElement, start: 'top bottom', end: 'bottom bottom', scrub: true } });

  $$('[data-service]').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      $$('[data-service]').forEach((o) => o !== d && (o.open = false));
      gsap.from($$('[data-service-body] > div > *, [data-service-body] li', d), { y: 20, opacity: 0, stagger: 0.035, duration: 0.9 });
      ScrollTrigger.refresh();
    });
  });
}

/* ---------------------------------------------------------------- Home */
function initHome() {
  // Imágenes que rotan dentro de la píldora del titular
  const pillImgs = $$('[data-pill-img]').map((img) => img.closest('picture') || img);
  if (pillImgs.length > 1 && !reduced) {
    gsap.set(pillImgs, { yPercent: (i) => (i ? 105 : 0) });
    let current = 0;
    setInterval(() => {
      const next = (current + 1) % pillImgs.length;
      gsap.to(pillImgs[current], { yPercent: -105, duration: 1, ease: 'expo.inOut' });
      gsap.fromTo(pillImgs[next], { yPercent: 105 }, { yPercent: 0, duration: 1, ease: 'expo.inOut' });
      current = next;
    }, 2200);
  }

  // Luz que sigue al cursor en el hero
  const spot = $('[data-spotlight]');
  const hero = $('[data-hero]');
  if (spot && finePointer && !reduced) {
    const sx = gsap.quickTo(spot, 'x', { duration: 1.2, ease: 'power3' });
    const sy = gsap.quickTo(spot, 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointerenter', () => gsap.to(spot, { opacity: 1, duration: 1 }));
    hero.addEventListener('pointerleave', () => gsap.to(spot, { opacity: 0, duration: 1 }));
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      sx(e.clientX - r.left);
      sy(e.clientY - r.top);
    });
  }

  if (hero && !reduced) {
    gsap.to('[data-scroll-line]', { yPercent: 200, duration: 1.6, ease: 'power2.inOut', repeat: -1 });
    gsap.to($('h1', hero), { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('[data-hero-mesh]', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  initHorizontal();
}

function initHorizontal() {
  const section = $('[data-hscroll]');
  if (!section) return;
  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('[data-hscroll-track]', section);
    const cards = $$('[data-hscroll-card]', section);
    const counter = $('[data-hscroll-current]', section);
    const distance = () => track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: '[data-hscroll-pin]',
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set('[data-hscroll-bar]', { scaleX: self.progress });
          counter.textContent = String(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)).padStart(2, '0');
        },
      },
    });

    cards.forEach((card) => {
      gsap.fromTo($('[data-hscroll-img]', card), { xPercent: -15 }, {
        xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
  });

  mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
    const pin = $('[data-hscroll-pin]', section);
    const track = $('[data-hscroll-track]', section);
    pin.classList.remove('h-[100svh]', 'overflow-hidden');
    pin.classList.add('section-y');
    track.classList.remove('w-max');
    track.classList.add('overflow-x-auto', 'snap-x', 'snap-mandatory', 'pb-6');
    $$('[data-hscroll-card]', section).forEach((c) => c.classList.add('snap-start'));
  });
}

function runPreloader() {
  const pre = $('[data-preloader]');
  if (!pre) return Promise.resolve();

  const seen = (() => { try { return sessionStorage.getItem('1250-intro'); } catch { return null; } })();
  if (seen || reduced) {
    pre.remove();
    return transitionIn().then(() => 0);
  }
  try { sessionStorage.setItem('1250-intro', '1'); } catch { /* storage bloqueado */ }

  gsap.set(cols, { scaleY: 0 });
  lenis?.stop();
  const path = $('[data-preloader-logo] path', pre);
  const len = path.getTotalLength();
  const count = $('[data-preloader-count]', pre);
  const obj = { v: 0 };

  return new Promise((resolve) => {
    gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: resolve })
      .set(path, { strokeDasharray: len, strokeDashoffset: len })
      .to(path, { strokeDashoffset: 0, duration: 2.1 }, 0)
      .to('[data-preloader-bar]', { scaleX: 1, duration: 2.1 }, 0)
      .to(obj, { v: 1250, duration: 2.1, onUpdate: () => (count.textContent = String(Math.round(obj.v)).padStart(4, '0')) }, 0)
      .to(path, { fill: 'currentColor', duration: 0.6, ease: 'power2.out' }, 1.9)
      .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.2 }, 2.4)
      .add(() => { pre.remove(); lenis?.start(); }, 3.5);
  });
}

/* ---------------------------------------------------------------- Proyectos */
function initWorks() {
  const chips = $$('[data-filter]');
  const panels = $$('[data-view-panel]');
  const viewBtns = $$('[data-view]');

  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    const items = $$('[data-work]');
    const state = Flip.getState(items);
    items.forEach((li) => { li.hidden = !(f === 'all' || li.dataset.disciplines.split('|').includes(f)); });
    Flip.from(state, {
      duration: 0.9, ease: 'expo.inOut', stagger: 0.02, absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.8 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.5 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }));

  viewBtns.forEach((btn) => btn.addEventListener('click', () => {
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    panels.forEach((p) => p.classList.toggle('hidden', p.dataset.viewPanel !== btn.dataset.view));
    const shown = $(`[data-view-panel="${btn.dataset.view}"]`);
    gsap.from($$('[data-work]:not([hidden])', shown).slice(0, 12), { y: 36, opacity: 0, stagger: 0.04, duration: 0.9 });
    // Las imágenes ocultas no se revelaron: las mostramos al cambiar de vista.
    $$('[data-reveal]', shown).forEach((el) => gsap.set(el, { clipPath: 'inset(0% 0 0 0)' }));
    ScrollTrigger.refresh();
  }));

  const preview = $('[data-list-preview]');
  if (preview && finePointer) {
    const px = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
    const py = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });
    const list = $('[data-list]');
    let active = null;
    list.addEventListener('pointermove', (e) => { px(e.clientX + 32); py(e.clientY - 180); });
    list.addEventListener('pointerover', (e) => {
      const row = e.target.closest('[data-list-row]');
      if (!row || row.dataset.listRow === active) return;
      active = row.dataset.listRow;
      gsap.to($$('[data-preview-img]', preview), { opacity: 0, duration: 0.3 });
      gsap.fromTo($(`[data-preview-img="${active}"]`, preview), { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.8 });
      gsap.to(preview, { opacity: 1, rotate: gsap.utils.random(-5, 5), duration: 0.5 });
    });
    list.addEventListener('pointerleave', () => { active = null; gsap.to(preview, { opacity: 0, duration: 0.4 }); });
  }
}

/* ---------------------------------------------------------------- Caso */
function initWork() {
  const cover = $('[data-work-cover]');
  if (!cover) return;
  gsap.fromTo($('img', cover), { scale: 1.3 }, { scale: 1.1, duration: 2.4 });
  if (reduced) return;
  gsap.to(cover, { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '[data-work-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('[data-work-hero] .container-x', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '[data-work-hero]', start: 'center center', end: 'bottom top', scrub: true } });
}

/* ---------------------------------------------------------------- Agencia */
function initAbout() {
  const cards = $$('[data-stack-card]');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.94, filter: 'brightness(0.7)', ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true } });
  });
}

/* ---------------------------------------------------------------- Servicio 360 */
function initAnchors() {
  $$('[data-anchor]').forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.6, offset: -20 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));
}

function initService() {
  initAnchors();

  const orbit = $('[data-orbit]');
  if (orbit && !reduced) {
    gsap.from(orbit, { scale: 0.6, opacity: 0, rotate: -40, duration: 2.4, delay: 0.3 });
    gsap.to(orbit, { rotate: 90, yPercent: 20, ease: 'none', scrollTrigger: { trigger: '[data-service-hero]', start: 'top top', end: 'bottom top', scrub: true } });
  }

  initMethod();
}

// Línea de progreso que avanza con el scroll y va encendiendo cada paso.
// data-method="vertical" la mantiene vertical en todos los tamaños.
function initMethod() {
  const method = $('[data-method]');
  if (!method) return;
  const alwaysVertical = method.dataset.method === 'vertical';
  const line = $('[data-method-line]', method);
  const steps = $$('[data-step]', method);
  const mm = gsap.matchMedia();

  const build = (prop) => {
    gsap.set(line, { scaleX: prop === 'scaleX' ? 0 : 1, scaleY: prop === 'scaleY' ? 0 : 1 });
    return gsap.to(line, {
      [prop]: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: $('ol', method),
        start: 'top 70%',
        end: 'bottom 60%',
        scrub: true,
        onUpdate: (self) => steps.forEach((s, i) => s.classList.toggle('is-active', self.progress >= i / steps.length + 0.02)),
      },
    });
  };

  if (alwaysVertical) {
    build('scaleY');
  } else {
    mm.add('(min-width: 1280px)', () => build('scaleX'));
    mm.add('(max-width: 1279px)', () => build('scaleY'));
  }

  if (reduced) steps.forEach((s) => s.classList.add('is-active'));
  else gsap.from(steps, { y: 50, opacity: 0, stagger: 0.1, duration: 1.2, scrollTrigger: { trigger: $('ol', method), start: 'top 85%' } });
}

/* ---------------------------------------------------------------- Landing espacios */
function initLanding() {
  initAnchors();
  initMethod();

  // Tira de locales: se desplaza en horizontal con el scroll.
  const strip = $('[data-lp-strip-track]');
  if (strip && !reduced) {
    gsap.fromTo(strip, { x: 0 }, {
      x: () => -Math.max(0, strip.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: '[data-lp-strip]', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }

  // Rubros: al pasar o tocar cada rubro cambia la imagen; en móvil rota solo.
  const sectors = $$('[data-sector]');
  const images = $$('[data-sector-img]');
  if (sectors.length) {
    let current = 0;
    let timer = null;
    const show = (i) => {
      if (i === current) return;
      sectors.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      gsap.to(images[current], { opacity: 0, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo(images[i], { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.1 });
      current = i;
    };
    sectors.forEach((b, i) => {
      b.addEventListener('pointerenter', () => { stopAuto(); show(i); });
      b.addEventListener('click', () => { stopAuto(); show(i); });
      b.addEventListener('focus', () => show(i));
    });
    const stopAuto = () => { clearInterval(timer); timer = null; };
    if (!reduced) {
      ScrollTrigger.create({
        trigger: '[data-sectors]',
        start: 'top 70%',
        end: 'bottom 30%',
        onToggle: (self) => {
          stopAuto();
          if (self.isActive && !finePointer) timer = setInterval(() => show((current + 1) % sectors.length), 2600);
        },
      });
    }
  }

  // CTA fijo en móvil: aparece después del hero y se oculta al llegar al formulario.
  const sticky = $('[data-sticky-cta]');
  if (sticky) {
    const toggleSticky = (visible) => sticky.classList.toggle('translate-y-[150%]', !visible);
    ScrollTrigger.create({
      trigger: '[data-hero]',
      start: 'bottom 80%',
      endTrigger: '#contacto',
      end: 'top bottom',
      onToggle: (self) => toggleSticky(self.isActive),
    });
  }

  // Formulario de leads
  const form = $('[data-lead-form]');
  if (!form) return;
  const L = window.LANDING || {};
  const params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach((k) => {
    const stored = (() => { try { return sessionStorage.getItem(`lp_${k}`); } catch { return null; } })();
    const value = params.get(k) || stored || '';
    if (params.get(k)) { try { sessionStorage.setItem(`lp_${k}`, value); } catch { /* storage bloqueado */ } }
    form.elements[k].value = value;
  });
  form.elements.referrer.value = document.referrer;

  const status = $('[data-form-status]', form);
  const submitLabel = $('[data-submit-label]', form);
  const success = $('[data-lead-success]', form);
  const defaultStatus = status.textContent;

  const REQUIRED = ['name', 'whatsapp', 'email', 'stage'];
  const setFieldError = (name, msg = '') => {
    const holder = $(`[data-error-for="${name}"]`, form);
    if (holder) { holder.textContent = msg; holder.classList.toggle('hidden', !msg); }
    const field = form.elements[name];
    if (field?.setAttribute) field.setAttribute('aria-invalid', String(!!msg));
  };
  const setErrors = (errors = {}) => REQUIRED.forEach((name) => setFieldError(name, errors[name]));

  const validate = () => {
    const errors = {};
    const v = (n) => (form.elements[n].value || '').trim();
    if (v('name').length < 2) errors.name = 'Ingresá tu nombre.';
    const digits = v('whatsapp').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) errors.whatsapp = 'Ingresá un WhatsApp válido, con código de área.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) errors.email = 'Ingresá un mail válido.';
    if (!form.querySelector('[name="stage"]:checked')) errors.stage = 'Elegí la etapa de tu proyecto.';
    return errors;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = validate();
    setErrors(errors);
    if (Object.keys(errors).length) {
      status.textContent = L.errors?.invalid || '';
      status.classList.add('text-red-700');
      const first = form.querySelector('[aria-invalid="true"]');
      first?.focus();
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
    const waUrl = whatsappUrl(payload);
    $('[data-wa-link]', form).href = waUrl;

    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    submitLabel.textContent = L.sending;
    status.textContent = defaultStatus;
    status.classList.remove('text-red-700');

    // El lead se registra en paralelo; keepalive evita que se corte si el navegador sale hacia WhatsApp.
    const saving = fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).then((res) => res.ok).catch(() => false);

    // En escritorio se abre en el mismo gesto del clic (evita el bloqueo de ventanas emergentes).
    // En móvil se redirige a la app de WhatsApp.
    if (finePointer) window.open(waUrl, '_blank', 'noopener');

    // Evento de conversión para GTM / Meta Pixel si están instalados.
    window.dataLayer?.push({ event: 'lead_espacios', stage: payload.stage, channel: 'whatsapp' });
    window.fbq?.('track', 'Lead', { content_name: 'espacios' });

    success.classList.remove('hidden');
    success.classList.add('flex');
    gsap.fromTo(success, { clipPath: 'inset(100% 0 0 0 round 24px)' }, { clipPath: 'inset(0% 0 0 0 round 24px)', duration: 1.1, ease: 'expo.inOut' });
    gsap.from($$(':scope > *', success), { y: 30, opacity: 0, stagger: 0.08, delay: 0.5 });
    success.focus();

    if (!finePointer) setTimeout(() => location.assign(waUrl), 900);

    const saved = await saving;
    if (!saved) console.warn('[lead] no se pudo registrar; el contacto sigue por WhatsApp');
    button.disabled = false;
    submitLabel.textContent = L.submit;
    form.reset();
  });

  function whatsappUrl(data) {
    const wa = L.whatsapp || {};
    const lb = L.labels || {};
    const lines = [
      wa.greeting,
      '',
      `${lb.name}: ${data.name}`,
      data.company && `${lb.company}: ${data.company}`,
      `${lb.stage}: ${data.stage}`,
      `${lb.whatsapp}: ${data.whatsapp}`,
      `${lb.email}: ${data.email}`,
      data.message && `${lb.message}: ${data.message}`,
    ].filter((l, i) => i === 1 || Boolean(l)); // la línea 1 es el espacio intencional tras el saludo
    return `https://wa.me/${wa.number}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Limpia el error de un campo apenas se corrige.
  form.addEventListener('input', (e) => {
    const { name } = e.target;
    if (REQUIRED.includes(name) && !validate()[name]) setFieldError(name);
  });
}

/* ---------------------------------------------------------------- Contacto */
function initContact() {
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const label = $('[data-copy-label]', btn);
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = I18N.copied;
    } catch {
      location.href = `mailto:${btn.dataset.copy}`;
    }
    setTimeout(() => (label.textContent = I18N.copy), 2000);
  }));

  const form = $('[data-contact-form]');
  if (!form) return;
  const status = $('[data-form-status]', form);
  const submitLabel = $('[data-submit-label]', form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = { ...Object.fromEntries(fd), interest: fd.getAll('interest') };
    submitLabel.textContent = I18N.sending;
    status.classList.remove('text-brand-600', 'text-red-700');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      status.textContent = json.message;
      status.classList.add('text-brand-600');
      submitLabel.textContent = `${I18N.sent} ✓`;
      form.reset();
      gsap.fromTo(form.querySelector('[type=submit]'), { scale: 0.9 }, { scale: 1, duration: 1, ease: 'elastic.out(1, 0.4)' });
    } catch (err) {
      status.textContent = err.message;
      status.classList.add('text-red-700');
      submitLabel.textContent = `${I18N.retry} →`;
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
    }
  });
}

/* ---------------------------------------------------------------- Boot */
const page = document.body.dataset.page;
const pageInit = { home: initHome, works: initWorks, work: initWork, about: initAbout, contact: initContact, service: initService, landing: initLanding }[page];

async function boot() {
  html.classList.add('ready');
  // Tema inicial del header: el de la primera sección.
  const first = $('main [data-theme], main[data-theme]');
  if (first) header.dataset.theme = first.dataset.theme;

  if (reduced) {
    gsap.set(cols, { scaleY: 0 });
    $('[data-preloader]')?.remove();
    pageInit?.();
    watchThemes();
    return;
  }

  const hasPreloader = page === 'home' && !!$('[data-preloader]');
  // Se evalúa antes de runPreloader, que marca la sesión como vista.
  const firstVisit = hasPreloader && !(() => { try { return sessionStorage.getItem('1250-intro'); } catch { return '1'; } })();
  const intro = hasPreloader ? runPreloader() : transitionIn();
  heroIntro(firstVisit ? 3 : 0.45);
  pageInit?.();
  scrollAnimations();
  watchThemes();
  await intro;
  ScrollTrigger.refresh();
}

if (document.fonts?.ready) document.fonts.ready.then(boot);
else boot();
