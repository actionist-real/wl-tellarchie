// Progressive enhancement: every chapter and its image link work without JS.
const tour = document.querySelector('[data-product-tour]');
if (tour && !tour.hasAttribute('data-tour-ready')) {
  const tabs = [...tour.querySelectorAll('[data-tour-tab]')];
  const panels = [...tour.querySelectorAll('[data-tour-panel]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 700px)');
  const animations = new Set();
  let selected = 0;
  let entered = false;
  let elapsed = 0, lastTime = 0, playbackFrame = 0, inView = false, hovered = false;
  const slideDuration = 6000;
  let userPaused = false;
  const video = tour.querySelector('[data-tour-video]');
  const videoPanel = video?.closest('[data-tour-panel]');
  let videoManuallyPaused = false, pendingVideoPauses = 0;
  function pauseVideo() {
    if (video && !video.paused) { pendingVideoPauses++; video.pause(); }
  }
  function syncVideo() {
    if (!video) return;
    if (panels[selected] !== videoPanel || !inView || document.hidden || userPaused) return pauseVideo();
    if (!preference.matches && !videoManuallyPaused && video.paused) video.play().catch(() => {});
  }
  video?.addEventListener('pause', () => {
    if (pendingVideoPauses) pendingVideoPauses--;
    else videoManuallyPaused = true;
  });
  video?.addEventListener('play', () => {
    videoManuallyPaused = false;
    if (panels[selected] !== videoPanel || !inView || document.hidden) pauseVideo();
  });
  video?.addEventListener('loadedmetadata', () => {
    if (video.videoWidth && video.videoHeight) video.parentElement.style.setProperty('--image-ratio', video.videoWidth + '/' + video.videoHeight);
    syncVideo();
  });
  const fullscreen = tour.querySelector('[data-tour-video-fullscreen]');
  fullscreen?.addEventListener('click', async event => {
    if (!video?.requestFullscreen) return;
    event.preventDefault();
    try { await video.requestFullscreen(); }
    catch { window.location.assign(fullscreen.href); }
  });

  function animate(element, keyframes, options) {
    if (preference.matches || !element?.animate) return null;
    const animation = element.animate(keyframes, { easing: 'cubic-bezier(.22,.68,.2,1)', ...options });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  }
  function settle() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
    panels.forEach((panel, index) => { panel.hidden = index !== selected; });
  }
  function setSemantics() {
    tabs.forEach((tab, index) => {
      const active = index === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[index].setAttribute('aria-hidden', String(!active));
      panels[index].inert = !active;
    });
  }
  function select(index) {
    elapsed = 0;
    tabs.forEach(tab => tab.style.setProperty("--tour-progress", "0"));
    if (index === selected) return;
    const previous = selected;
    settle();
    selected = index;
    setSemantics();
    syncVideo();
    if (compact.matches) {
      const row = tabs[selected].parentElement;
      row.scrollTo({left: Math.max(0, tabs[selected].offsetLeft - row.clientWidth / 2 + tabs[selected].offsetWidth / 2), behavior: preference.matches ? "instant" : "smooth"});
    }
    const old = panels[previous];
    const next = panels[selected];
    next.hidden = false;
    const exit = animate(old, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
    if (exit) exit.finished.then(() => { if (selected !== previous) old.hidden = true; }).catch(() => {});
    else old.hidden = true;
    animate(next, [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: compact.matches ? 240 : 350 });
  }

  tour.querySelector('.tour-tabs').setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', event => { event.preventDefault(); select(index); });
    tab.addEventListener('keydown', event => {
      const destinations = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      const next = destinations[event.key];
      select(next);
      tabs[next].focus();
    });
  });
  setSemantics();
  settle();
  tour.setAttribute('data-tour-ready', '');

  const heading = document.querySelector('#features .section-heading');
  function entrance() {
    if (entered) return;
    entered = true;
    animate(heading, [{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration: 550 });
    animate(panels[selected].querySelector('.tour-frame'), [
      { opacity: 0, translate: `0 ${compact.matches ? 10 : 24}px`, scale: '.985' },
      { opacity: 1, translate: '0 0', scale: '1' },
    ], { duration: compact.matches ? 420 : 650, delay: 100, fill: 'backwards' });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); entrance(); }
    }, { threshold: .2 });
    observer.observe(heading);
  }
  preference.addEventListener('change', () => { if (preference.matches) settle(); });
  function paused() {
    return preference.matches || !inView || document.hidden || hovered || tour.contains(document.activeElement) || !!document.querySelector('dialog[open]');
  }
  function tick(time) {
    if (!paused() && lastTime) {
      elapsed += time - lastTime;
      if (elapsed >= slideDuration) select((selected + 1) % tabs.length);
    }
    lastTime = time;
    tabs[selected].style.setProperty('--tour-progress', String(preference.matches ? 1 : Math.min(elapsed / slideDuration, 1)));
    if (inView && !document.hidden && !preference.matches) playbackFrame = requestAnimationFrame(tick);
    else { playbackFrame = 0; lastTime = 0; }
  }
  function resume() {
    if (!playbackFrame && inView && !document.hidden && !preference.matches) playbackFrame = requestAnimationFrame(tick);
    if (preference.matches) tabs[selected].style.setProperty('--tour-progress', '1');
  }
  tour.addEventListener('pointerenter', () => { hovered = true; });
  tour.addEventListener('pointerleave', () => { hovered = false; lastTime = 0; resume(); });
  tour.addEventListener('focusout', () => { lastTime = 0; resume(); });
  document.addEventListener('visibilitychange', () => { lastTime = 0; syncVideo(); resume(); });
  preference.addEventListener('change', () => { lastTime = 0; if (preference.matches) pauseVideo(); syncVideo(); resume(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries.some(e => e.isIntersecting); lastTime = 0; syncVideo(); resume(); }, {threshold:.25}).observe(tour);
  } else { inView = true; syncVideo(); resume(); }
  const pauseButton = document.createElement('button');
  pauseButton.type = 'button'; pauseButton.className = 'tour-playback'; pauseButton.textContent = 'Pause slideshow'; pauseButton.setAttribute('aria-pressed', 'false');
  const automaticPause = paused;
  paused = () => userPaused || automaticPause();
  pauseButton.addEventListener('click', () => { userPaused = !userPaused; syncVideo(); pauseButton.textContent = userPaused ? 'Resume slideshow' : 'Pause slideshow'; pauseButton.setAttribute('aria-pressed', String(userPaused)); });
  tour.querySelector('.tour-stage').append(pauseButton);

}

// One shared decorative embed with a static, content-safe fallback.
if (tour) {
  const iframe = tour.querySelector('[data-tour-background]');
  const backdrop = iframe?.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let near = false, timer, probe, generation = 0;
  function reset() {
    clearTimeout(timer); probe?.abort(); probe = null;
    backdrop?.classList.remove('is-loaded'); iframe?.removeAttribute('src');
  }
  async function updateBackground() {
    if (!iframe) return;
    if (motion.matches || !near) { generation++; reset(); return; }
    if (iframe.hasAttribute('src') || probe) return;
    const current = ++generation;
    probe = new AbortController();
    const timeout = setTimeout(() => probe?.abort(), 10000);
    try {
      const response = await fetch(iframe.dataset.src, {mode:'no-cors', signal:probe.signal});
      if (response.type !== 'opaque' && !response.ok) throw new Error('Background unavailable');
      if (current !== generation || motion.matches || !near) return;
      iframe.src = iframe.dataset.src;
      timer = setTimeout(() => { generation++; reset(); }, 15000);
    } catch { if (current === generation) reset(); }
    finally { clearTimeout(timeout); if (current === generation) probe = null; }
  }
  iframe?.addEventListener('load', () => {
    if (!iframe.hasAttribute('src') || motion.matches) return;
    clearTimeout(timer); backdrop.classList.add('is-loaded');
  });
  iframe?.addEventListener('error', () => { generation++; reset(); });
  motion.addEventListener('change', updateBackground);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      near = entries.some(entry => entry.isIntersecting); updateBackground();
    }, {rootMargin:'400px'});
    observer.observe(tour);
  } else { near = true; updateBackground(); }
}
