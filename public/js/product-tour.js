// The tour is one framed screen of the builder.
// - The heading rises in when the section is first seen.
// - The brand grain at the stage bottom fades in once (CSS .is-shown).
// - The stage tilts back in 3D and straightens with scroll progress, as in Framer's scroll
//   transforms: progress 0 when its top meets the viewport bottom, 1 when its top reaches 38%
//   from the top. Only the --tilt custom property is written; CSS derives the transform.
const tour = document.querySelector('[data-product-tour]');
if (tour && !tour.hasAttribute('data-tour-ready')) {
  tour.setAttribute('data-tour-ready', '');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const heading = document.querySelector('#features .section-heading');
  const stage = tour.querySelector('.tour-stage');
  const backdrop = stage?.querySelector('.tour-backdrop');
  if (backdrop && !backdrop.querySelector('.tour-grain')) {
    const grain = document.createElement('span');
    grain.className = 'tour-grain';
    backdrop.append(grain);
  }

  let entered = false;
  const entrance = () => {
    if (entered) return;
    entered = true;
    stage?.classList.add('is-shown');
    if (!reduced.matches && heading?.animate) {
      heading.animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }],
        { duration: 550, easing: 'cubic-bezier(.22,.68,.2,1)' });
    }
  };

  // Scroll-driven tilt.
  let frame = 0, near = false;
  const ease = (x) => x;   // linear in scroll, as measured on the reference Framer site
  const update = () => {
    frame = 0;
    if (!stage) return;
    if (reduced.matches) { stage.style.setProperty('--tilt', '1'); return; }
    const top = stage.getBoundingClientRect().top;
    const vh = innerHeight;
    const start = vh, end = vh * 0.38;   // flat once the stage top reaches 38% down the viewport
    const p = Math.min(1, Math.max(0, (start - top) / (start - end)));
    stage.style.setProperty('--tilt', ease(p).toFixed(4));
  };
  const request = () => { if (!frame && near) frame = requestAnimationFrame(update); };
  stage?.classList.add('has-tilt');
  update();
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { near = true; request(); }, { passive: true });
  reduced.addEventListener('change', update);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      near = entries[entries.length - 1].isIntersecting;
      if (near) request();
    }, { rootMargin: '25% 0px 25% 0px' }).observe(tour);
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { entrance(); seen.disconnect(); }
    }, { threshold: .2 });
    seen.observe(tour);
  } else { near = true; entrance(); update(); }
}
