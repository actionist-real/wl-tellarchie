// Progressive motion: CSS keeps every section readable before JavaScript runs.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 810px) and (min-height: 680px)');
const compact = matchMedia('(max-width: 809px)');
const root = document.documentElement;
const section = document.querySelector('#diagram-section');
const track = section?.querySelector('.framer-18iq3g');
const steps = [...(section?.querySelectorAll('[data-workflow-step]') || [])];
const lines = [...(section?.querySelectorAll('[data-workflow-line]') || [])];
const dots = [...(section?.querySelectorAll('.workflow-progress span') || [])];
const animations = new Set();
const clamp = (value) => Math.max(0, Math.min(1, value));

function animate(element, frames, options = {}) {
  if (preference.matches || !element?.animate) return;
  const animation = element.animate(frames, {
    easing: 'cubic-bezier(.22,.68,.2,1)',
    ...options,
  });
  animations.add(animation);
  animation.finished.catch(() => {}).finally(() => animations.delete(animation));
}

// Preserve emphasis and complete words while revealing individual characters.
function splitHeading(heading) {
  if (heading.dataset.motionSplit) return [...heading.querySelectorAll('.motion-char')];
  heading.dataset.motionSplit = 'true';
  heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const word of node.textContent.split(/(\s+)/)) {
      if (!word || /^\s+$/.test(word)) {
        fragment.append(document.createTextNode(word));
        continue;
      }
      const wrapper = document.createElement('span');
      wrapper.className = 'motion-word';
      wrapper.setAttribute('aria-hidden', 'true');
      for (const letter of word) {
        const character = document.createElement('span');
        character.className = 'motion-char';
        character.style.fontWeight = 'inherit';
        character.textContent = letter;
        wrapper.append(character);
      }
      fragment.append(wrapper);
    }
    node.replaceWith(fragment);
  }
  return [...heading.querySelectorAll('.motion-char')];
}

function revealHeading(heading, lifecycle = false, offset = 0) {
  if (preference.matches || !heading?.animate) return;
  const characters = splitHeading(heading);
  const mobile = compact.matches;
  const duration = lifecycle ? (mobile ? 420 : 580) : (mobile ? 480 : 680);
  const stagger = lifecycle
    ? Math.min(16, (mobile ? 400 : 620) / Math.max(1, characters.length - 1))
    : (mobile ? 13 : 20);
  characters.forEach((character, index) => animate(character,
    [
      { opacity: 0, filter: `blur(${lifecycle ? 8 : 10}px)`, transform: `translateY(${mobile ? 6 : 12}px)` },
      { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' },
    ],
    { duration, delay: offset + index * stagger, fill: 'backwards' }));
}

// The hero shader's light blooms first; the text follows, as in the reference.
const heroLead = document.documentElement.classList.contains('hero-shader-on') && !preference.matches ? 350 : 0;
revealHeading(document.querySelector('.hero-title'), false, heroLead);
document.querySelectorAll('#hero .hero-description, #hero .framer-vocpb, #hero .prompt-card').forEach((element, index) => {
  animate(element,
    [{ opacity: 0, translate: `0 ${compact.matches ? 12 : 20}px` }, { opacity: 1, translate: '0 0' }],
    { duration: compact.matches ? 480 : 720, delay: heroLead + 250 + index * 130, fill: 'backwards' });
});

// Reveal each card independently; its inner control owns the hover transform.
if ('IntersectionObserver' in window) {
  const actions = new Map();
  const reveals = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      reveals.unobserve(target);
      actions.get(target)?.();
      actions.delete(target);
    });
  }, { threshold: .16, rootMargin: '0px 0px -3% 0px' });
  function observe(selector, effect) {
    document.querySelectorAll(selector).forEach((element, index) => {
      actions.set(element, () => effect(element, index));
      reveals.observe(element);
    });
  }
  function rise(element, delay = 0) {
    animate(element,
      [{ opacity: 0, translate: `0 ${compact.matches ? 14 : 28}px` }, { opacity: 1, translate: '0 0' }],
      { duration: compact.matches ? 450 : 700, delay, fill: 'backwards' });
  }
  observe('.lifecycle-title', (element) => revealHeading(element, true));
  observe('#why .section-heading, #made .section-heading, #faq .section-heading, .pricing-wrapper, #final .section-heading', (element) => rise(element));
  observe('.benefit-card', (element, index) => rise(element, compact.matches ? 0 : (index % 2) * 85));
  observe('.showcase-card', (element, index) => rise(element, compact.matches ? 0 : (index % 2) * 100));

  // Reference-style entrance (Code Lab, Kora): content arrives soft and sharpens as it settles.
  function blurRise(element, delay = 0, blur = 8) {
    animate(element,
      [{ opacity: 0, filter: `blur(${blur}px)`, translate: `0 ${compact.matches ? 10 : 16}px` }, { opacity: 1, filter: 'blur(0)', translate: '0 0' }],
      { duration: compact.matches ? 450 : 700, delay, fill: 'backwards' });
  }
  // Media frames come into focus without moving (Morva).
  function sharpen(element, delay = 0) {
    animate(element, [{ opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0)' }],
      { duration: compact.matches ? 500 : 900, delay, fill: 'backwards' });
  }
  // Followers after a leader; the step shrinks on long lists so they stay brisk.
  function cascade(parent, selector, start = 0, step = 90) {
    const items = [...parent.querySelectorAll(selector)];
    const gap = Math.min(step, 600 / Math.max(1, items.length));
    items.forEach((item, index) => blurRise(item, start + index * (compact.matches ? gap * .6 : gap)));
    return start + items.length * gap;
  }

  // Diagram heading: same character reveal the other section titles use.
  observe('#diagram-section h2', (element) => revealHeading(element));

  // Workspace: eyebrow, title, intro, then the tab list and the media frame.
  observe('#workspace .ws-heading', (heading) => {
    blurRise(heading.querySelector('.eyebrow'));
    revealHeading(heading.querySelector('h2'), false, 80);
    blurRise(heading.querySelector('p'), 280);
  });
  observe('#workspace .ws-body', (body) => {
    cascade(body, '.ws-tab', 0, 80);
    sharpen(body.querySelector('.ws-card'), 120);
  });

  // Why: each card's illustration settles just after the card itself (its rise is unchanged).
  observe('#why .why-visual', (visual) => {
    const card = visual.closest('.benefit-card');
    const index = [...document.querySelectorAll('#why .benefit-card')].indexOf(card);
    blurRise(visual, (compact.matches ? 0 : (index % 2) * 85) + 150, 6);
  });
  observe('#why .why-cta', (element) => blurRise(element));

  // Templates: heading leads, cards follow in reading order, images sharpen, CTA last.
  observe('#templates .tpl-heading', (heading) => {
    blurRise(heading.querySelector('.eyebrow'));
    revealHeading(heading.querySelector('h2'), false, 80);
    blurRise(heading.querySelector('p'), 280);
  });
  observe('#templates .tpl-grid', (grid) => {
    const cards = [...grid.querySelectorAll('.tpl-card')];
    const top = cards[0]?.offsetTop;
    const columns = Math.max(1, cards.filter((card) => card.offsetTop === top).length);
    cards.forEach((card, index) => {
      const delay = compact.matches ? (index % 2) * 70 : (index % columns) * 90 + Math.floor(index / columns) * 120;
      blurRise(card, delay, 6);
      sharpen(card.querySelector('.tpl-media'), delay + 60);
    });
  });
  observe('#templates .tpl-cta', (element) => blurRise(element, 120));

  // Pricing: inside the wrapper's existing rise, plans cascade and their lists read in one by one (Whizzy).
  observe('#pricing .pricing-shell', (shell) => {
    shell.querySelectorAll('.price-plan').forEach((plan, index) => {
      const start = 120 + index * 140;
      blurRise(plan, start, 6);
      cascade(plan, '.price-list li', start + 320, 60);
    });
    cascade(shell, '.price-facts li', 520, 80);
  });

  // FAQ items follow the heading.
  observe('#faq .faq-list', (list) => cascade(list, '.faq-item', 100, 70));

  // Final CTA: the room settles into place, then the note.
  observe('#final .final-surface', (surface) => {
    const grid = surface.querySelector('.room-perspective-grid');
    if (grid) {
      const target = getComputedStyle(grid).opacity;
      animate(grid, [{ opacity: 0, scale: '1.04' }, { opacity: target, scale: '1' }], { duration: 1400, fill: 'backwards' });
    }
    blurRise(surface.querySelector('.final-note'), 600);
  });

  // Footer columns.
  observe('.site-footer', (footer) => cascade(footer, '.footer-top > *, .footer-bottom', 0, 90));

  // Continuous decorative loops pause while their section is offscreen.
  const offscreen = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => target.classList.toggle('is-offscreen', !isIntersecting));
  }, { rootMargin: '100px 0px' });
  document.querySelectorAll('#pricing, #why').forEach((element) => offscreen.observe(element));

  // One statement lights up word by word as it scrolls through the viewport (Morva).
  function lightWords(element) {
    if (!element) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part || /^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); continue; }
        const word = document.createElement('span');
        word.className = 'motion-lit-word';
        word.textContent = part;
        fragment.append(word);
        words.push(word);
      }
      node.replaceWith(fragment);
    }
    let visible = false, queued = false;
    function paint() {
      queued = false;
      if (preference.matches) { words.forEach((word) => word.style.removeProperty('opacity')); return; }
      const box = element.getBoundingClientRect();
      // Starts lighting as the line enters the lower 85% of the screen, fully lit by 45%.
      const progress = clamp((innerHeight * .85 - box.top) / (innerHeight * .4));
      words.forEach((word, index) => {
        const lit = clamp(progress * words.length - index);
        word.style.opacity = String(.25 + .75 * lit);
      });
    }
    const queue = () => { if (visible && !queued) { queued = true; requestAnimationFrame(paint); } };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; queue(); }).observe(element);
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue, { passive: true });
    preference.addEventListener('change', () => { queued = false; paint(); });
    paint();
  }
  lightWords(document.querySelector('#workspace .ws-heading p'));

  // CSS animations keep their place while the decorative region is offscreen.
  const visibility = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => target.classList.toggle('is-in-view', isIntersecting));
  }, { threshold: 0 });
  document.querySelectorAll('#hero, #diagram-section').forEach((element) => visibility.observe(element));
} else {
  document.querySelectorAll('#hero, #diagram-section').forEach((element) => element.classList.add('is-in-view'));
}

// CSS owns the decorative cycles. Visibility only pauses them, preserving phase;
// without this controller (or with reduced motion), the lighting stays static.
const composers = [...document.querySelectorAll('[data-prompt-form]')];
const visibleComposers = new Set();
function updateComposerMotion() {
  composers.forEach((composer) => {
    composer.classList.toggle('composer-motion', !preference.matches);
    composer.classList.toggle('is-energized', !preference.matches && !document.hidden && visibleComposers.has(composer));
  });
}
if ('IntersectionObserver' in window) {
  const composerVisibility = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visibleComposers.add(target);
      else visibleComposers.delete(target);
    });
    updateComposerMotion();
  });
  composers.forEach((composer) => composerVisibility.observe(composer));
}
document.addEventListener('visibilitychange', updateComposerMotion);
preference.addEventListener('change', updateComposerMotion);

// A decorative placeholder never changes user input or the accessible label.
const examples = [
  'Build a booking app for my business',
  'Create a client portal for my agency',
  'Build an app with payments and a dashboard',
];
document.querySelectorAll('[data-prompt-form] textarea').forEach((input) => {
  const fallback = input.placeholder;
  let timer, example = 0, count = 0, removing = false, stopped = false;
  function stop() {
    stopped = true;
    clearTimeout(timer);
    input.placeholder = fallback;
  }
  function tick() {
    if (stopped || preference.matches || input.value || document.activeElement === input) return stop();
    const bounds = input.getBoundingClientRect();
    if (document.hidden || !bounds.width || bounds.bottom < 0 || bounds.top > innerHeight) {
      timer = setTimeout(tick, 800);
      return;
    }
    const text = examples[example];
    count += removing ? -1 : 1;
    input.placeholder = `${text.slice(0, count)}│`;
    let delay = removing ? 25 : 65;
    if (count === text.length) { removing = true; delay = 2100; }
    if (count === 0) { removing = false; example = (example + 1) % examples.length; delay = 450; }
    timer = setTimeout(tick, delay);
  }
  input.addEventListener('focus', stop, { once: true });
  input.addEventListener('input', stop, { once: true });
  preference.addEventListener('change', stop);
  if (!preference.matches && !input.value && document.activeElement !== input) timer = setTimeout(tick, 1200);
});

// The export uses filled arrows through <use>. Trace local copies of their
// outlines without changing shared symbols or the complete static fallback.
const traces = lines.map((line) => {
  const use = line.querySelector('use');
  const reference = use?.getAttribute('href');
  const symbol = reference?.startsWith('#') ? document.getElementById(reference.slice(1)) : null;
  const source = symbol?.querySelector('path');
  const container = line.querySelector('svg');
  if (!source || !container) return null;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', symbol.getAttribute('viewBox') || '0 0 100 100');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('workflow-trace');
  const path = source.cloneNode(false);
  path.removeAttribute('id');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--brand-logo-light, #01ebfd)');
  path.setAttribute('stroke-width', '.7');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1 1';
  path.style.strokeDashoffset = '1';
  svg.style.display = 'none';
  svg.append(path);
  container.append(svg);
  return { svg, path };
});

let scheduled = false;
function update() {
  scheduled = false;
  if (!section?.classList.contains('motion-workflow') || !track) return;
  const bounds = track.getBoundingClientRect();
  const progress = clamp(-bounds.top / Math.max(1, bounds.height - innerHeight));
  const stage = progress * steps.length;
  const current = Math.min(steps.length - 1, Math.floor(stage));
  steps.forEach((step, index) => {
    const phase = clamp(stage - index + 1);
    step.style.opacity = String(.2 + .8 * phase);
    step.classList.toggle('is-active', index === current);
    dots[index]?.classList.toggle('active', phase >= .5);
  });
  lines.forEach((line, index) => {
    const phase = clamp(stage - index);
    line.style.opacity = String(.12 + .88 * phase);
    if (traces[index]) traces[index].path.style.strokeDashoffset = String(1 - phase);
  });
}
function schedule() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
}
function configure() {
  root.classList.toggle('motion-enabled', !preference.matches);
  const active = Boolean(section && track && desktop.matches && !preference.matches);
  section?.classList.toggle('motion-workflow', active);
  traces.forEach((trace) => { if (trace) trace.svg.style.display = active ? '' : 'none'; });
  if (!active) {
    [...steps, ...lines].forEach((element) => element.style.removeProperty('opacity'));
    steps.forEach((step) => step.classList.remove('is-active'));
    dots.forEach((dot) => dot.classList.remove('active'));
  }
  if (preference.matches) {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }
  schedule();
}
preference.addEventListener('change', configure);
desktop.addEventListener('change', configure);
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
configure();

