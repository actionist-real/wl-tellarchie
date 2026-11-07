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

function revealHeading(heading, lifecycle = false) {
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
    { duration, delay: index * stagger, fill: 'backwards' }));
}

revealHeading(document.querySelector('.hero-title'));
document.querySelectorAll('#hero .hero-description, #hero .framer-vocpb, #hero .prompt-card').forEach((element, index) => {
  animate(element,
    [{ opacity: 0, translate: `0 ${compact.matches ? 12 : 20}px` }, { opacity: 1, translate: '0 0' }],
    { duration: compact.matches ? 480 : 720, delay: 250 + index * 130, fill: 'backwards' });
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
  path.setAttribute('stroke', 'var(--brand-logo-light, #F9B54D)');
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

// Pointer-driven hero grid. Its mask cuts out content before the retained blur.
(() => {
  const hero = document.querySelector('#hero');
  const grid = hero?.querySelector('.hero-shimmer');
  const highlight = grid?.querySelector('.shimmer-highlight');
  if (!hero || !grid || !highlight) return;
  const canHover = matchMedia('(hover:hover) and (pointer:fine)');
  const protectedElements = [...hero.querySelectorAll('.hero-title,.hero-description,.framer-vocpb,.site-button.primary,.prompt-card,.framer-1uqwldy')];
  let frame = 0, pointer = null;
  function hide() { pointer = null; grid.classList.remove('is-hovered'); }
  function updateMask() {
    const bounds = grid.getBoundingClientRect();
    const boxes = protectedElements.map(el => el.getBoundingClientRect()).filter(b => b.width && b.height);
    if (!bounds.width || !boxes.length) return;
    const left = Math.max(0, Math.min(...boxes.map(b => b.left - bounds.left)) - 24);
    const right = Math.min(bounds.width, Math.max(...boxes.map(b => b.right - bounds.left)) + 24);
    const top = Math.max(0, Math.min(...boxes.map(b => b.top - bounds.top)) - 24);
    const bottom = Math.min(bounds.height, Math.max(...boxes.map(b => b.bottom - bounds.top)) + 24);
    // Blur only the mask boundary; the expanded black rectangle remains opaque inside.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}"><defs><filter id="feather" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter><mask id="cut" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" rx="24" fill="black" filter="url(#feather)"/><rect x="${left+12}" y="${top+12}" width="${Math.max(0,right-left-24)}" height="${Math.max(0,bottom-top-24)}" fill="black"/></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#cut)"/></svg>`;
    const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    grid.style.maskImage = mask; grid.style.webkitMaskImage = mask;
    grid.style.maskSize = '100% 100%'; grid.style.webkitMaskSize = '100% 100%';
  }
  function move(event) {
    if (!canHover.matches || preference.matches || event.pointerType === 'touch') return hide();
    pointer = {x:event.clientX,y:event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!pointer) return;
      const b = grid.getBoundingClientRect();
      highlight.style.transform = `translate(${pointer.x-b.left-180}px,${pointer.y-b.top-180}px)`;
      grid.classList.add('is-hovered');
    });
  }
  hero.addEventListener('pointermove',move,{passive:true});
  hero.addEventListener('pointerleave',hide);
  window.addEventListener('blur',hide);
  window.addEventListener('scroll',hide,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  canHover.addEventListener('change',hide); preference.addEventListener('change',hide);
  const observer = new ResizeObserver(updateMask);
  observer.observe(hero); protectedElements.forEach(el => observer.observe(el));
  window.addEventListener('resize',()=>{hide();updateMask();});
  document.fonts?.ready.then(updateMask);
  updateMask();
})();
