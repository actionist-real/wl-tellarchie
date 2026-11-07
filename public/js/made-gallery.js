// Webflow reference: https://webflow.com/ #MadeinWebflow, captured 7 October 2026.
// Local reference mechanics with the supplied workspace frame and reversible previews.
const gallery = document.querySelector('#made .made-gallery');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let enginePromise;
let visible = false;

function loadEngine() {
  return enginePromise ||= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/js/made-slider-engine.js';
    script.onload = resolve;
    script.onerror = () => { script.remove(); enginePromise = null; reject(new Error('Gallery enhancement unavailable')); };
    document.head.append(script);
  });
}
function restore() {
  gallery._mw?.destroy();
  gallery.classList.remove('is-enhanced');
  ['data-webgl-canvas', 'data-mw-ready', 'data-mw-gl', 'data-mw-open'].forEach(attr => gallery.removeAttribute(attr));
  gallery.removeAttribute('style');
  gallery.querySelectorAll('.made-card, .made-card img').forEach(el => el.removeAttribute('style'));
}
async function configure() {
  if (!gallery) return;
  if (preference.matches) return restore();
  if (!visible || gallery._mw) return;
  try {
    await loadEngine();
    if (preference.matches || gallery._mw) return;
    gallery.classList.add('is-enhanced');
    gallery.setAttribute('data-webgl-canvas', '');
    const engine = window.MwSlider.init(gallery);
    if (!engine?.gl?.ok) restore();
  } catch { restore(); }
}
if (gallery) {
  // Keyboard focus reveals its card while WebGL supplies the visual row.
  gallery.addEventListener('focusin', event => {
    const card = event.target.closest('.made-card');
    if (!gallery.hasAttribute("data-mw-open") && card && card.matches(':focus-visible') && gallery._mw) { gallery._mw.goTo([...gallery.querySelectorAll('.made-card')].indexOf(card)); gallery._mw.debugStep(16.7); }
  });
  gallery.addEventListener('dragstart', event => event.preventDefault());
  // A pointer focus must not snap the row before dragging. Keyboard focus still reveals its card.
  let dragStart, dragDistance = 0, suppressClick = false;
  gallery.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragDistance = 0; suppressClick = false;
  }, true);
  addEventListener('pointermove', event => {
    if (dragStart?.id === event.pointerId) dragDistance = Math.max(dragDistance, Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y));
  }, { passive: true });
  const finishDrag = event => {
    if (dragStart?.id !== event.pointerId) return;
    suppressClick = dragDistance >= 6 || event.type === 'pointercancel';
    dragStart = null;
  };
  addEventListener('pointerup', finishDrag);
  addEventListener('pointercancel', finishDrag);
  gallery.addEventListener('click', event => {
    if (event.detail && suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { visible = true; observer.disconnect(); configure(); }
    }, { rootMargin: '400px' });
    observer.observe(gallery);
  } else { visible = true; configure(); }
  preference.addEventListener('change', configure);
}

// A single preview owns focus; the renderer keeps ownership of the unfolding physics.
if (gallery) {
  const cards = [...gallery.querySelectorAll('.made-card')];
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'made-preview-close';
  close.dataset.webglClose = '';
  close.setAttribute('aria-label', 'Close template preview');
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  gallery.append(close);
  const fallback = document.createElement('div');
  fallback.className = 'made-workspace-fallback';
  fallback.hidden = true;
  fallback.innerHTML = '<div class="made-workspace-art"><img alt=""></div><img class="made-workspace-frame" src="/images/For%20masking.png" alt="Super Intelligence Coder workspace">';
  gallery.append(fallback);
  let trigger, focused = false, fallbackOpen = false, positionFrame = 0;
  const inertElements = new Map();
  function isolate() {
    for (let branch = gallery; branch.parentElement && branch !== document.body; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling === branch || ['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) continue;
        if (!inertElements.has(sibling)) inertElements.set(sibling, sibling.inert);
        sibling.inert = true;
      }
    }
    for (const card of cards) { inertElements.set(card, card.inert); card.inert = true; }
    gallery.setAttribute('role', 'dialog');
    gallery.setAttribute('aria-modal', 'true');
    gallery.setAttribute('aria-label', `Preview: ${trigger?.querySelector('img')?.alt || 'template'}`);
  }
  function restoreFocus() {
    cancelAnimationFrame(positionFrame);
    for (const [element, inert] of inertElements) element.inert = inert;
    inertElements.clear();
    gallery.removeAttribute('role');
    gallery.removeAttribute('aria-modal');
    gallery.setAttribute('aria-label', 'Template gallery');
    close.hidden = true;
    focused = false;
    // Wait for the fold to finish so focusing the button cannot snap the row.
    const source = trigger;
    const returnFocus = () => {
      if (gallery.hasAttribute('data-mw-open') || fallbackOpen) return;
      if (gallery._mw && gallery._mw.state().activeIndex >= 0) { requestAnimationFrame(returnFocus); return; }
      source?.focus({ preventScroll: true });
    };
    requestAnimationFrame(returnFocus);
  }
  function positionClose() {
    if (!gallery.hasAttribute('data-mw-open')) return;
    const index = gallery._mw?.state().activeIndex;
    const card = cards[index];
    if (card) {
      const rect = card.getBoundingClientRect(), stage = gallery.getBoundingClientRect();
      close.style.left = `${Math.max(0, rect.left - stage.left + 8)}px`;
      close.style.top = `${Math.max(0, rect.top - stage.top + 8)}px`;
      if (!focused) { close.focus({ preventScroll: true }); focused = true; }
    }
    positionFrame = requestAnimationFrame(positionClose);
  }
  function positionFallbackClose() {
    if (!fallbackOpen) return;
    const margin = innerWidth <= 767 ? 12 : 24;
    fallback.style.width = `${Math.max(1, Math.min(gallery.clientWidth - 2 * margin, (Math.min(gallery.clientHeight, innerHeight) - 2 * margin) * 7122 / 3717))}px`;
    let rect = fallback.getBoundingClientRect();
    if (rect.top < margin || rect.bottom > innerHeight - margin) gallery.scrollIntoView({ block: 'center', behavior: 'instant' });
    rect = fallback.getBoundingClientRect();
    const stage = gallery.getBoundingClientRect();
    close.style.left = `${rect.left - stage.left + 8}px`;
    close.style.top = `${rect.top - stage.top + 8}px`;
  }
  addEventListener('resize', positionFallbackClose, { passive: true });
  function openFallback(card) {
    trigger = card;
    const original = card.querySelector('img');
    const image = fallback.querySelector('.made-workspace-art img');
    image.src = original.currentSrc || original.src || original.dataset.mwHeldSrc;
    image.alt = original.alt;
    fallbackOpen = true;
    fallback.hidden = false;
    gallery.classList.add('is-fallback-open');
    close.hidden = false;
    close.removeAttribute('style');
    positionFallbackClose();
    isolate(); close.focus({ preventScroll: true });
  }
  function closePreview() {
    if (fallbackOpen) {
      fallbackOpen = false; fallback.hidden = true;
      gallery.classList.remove('is-fallback-open');
      restoreFocus();
    } else gallery._mw?.close();
  }
  gallery.addEventListener('pointerdown', event => {
    const card = event.target.closest('.made-card');
    if (card) trigger = card;
  }, true);
  close.hidden = true;
  close.addEventListener('click', closePreview);
  gallery.addEventListener('click', event => {
    const card = event.target.closest('.made-card');
    if (!card) return;
    trigger = card;
    if (!gallery._mw || !gallery._mw.gl?.ok) {
      event.preventDefault(); event.stopImmediatePropagation();
      // The engine's DOM fallback cannot composite the workspace; use the static version.
      if (gallery._mw) restore();
      openFallback(card);
    }
  }, true);
  gallery.addEventListener('keydown', event => {
    const card = event.target.closest('.made-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) trigger = card;
    if (!fallbackOpen && !gallery.hasAttribute('data-mw-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closePreview(); }
    if (event.key === 'Tab') { event.preventDefault(); event.stopImmediatePropagation(); close.focus({ preventScroll: true }); }
  }, true);
  new MutationObserver(() => {
    if (gallery.hasAttribute('data-mw-open')) {
      trigger ||= cards[gallery._mw?.state().activeIndex];
      close.hidden = false;
      isolate(); cancelAnimationFrame(positionFrame); positionClose();
    } else if (!fallbackOpen && inertElements.size) restoreFocus();
  }).observe(gallery, { attributes: true, attributeFilter: ['data-mw-open'] });
  gallery.addEventListener('webglcontextlost', () => {
    const active = gallery._mw?.state().activeIndex;
    const card = gallery.hasAttribute('data-mw-open') && cards[active];
    queueMicrotask(() => {
      if (inertElements.size) restoreFocus();
      restore();
      if (card) openFallback(card);
    });
  }, true);
  preference.addEventListener('change', () => {
    if (!fallbackOpen && inertElements.size) restoreFocus();
  });
}