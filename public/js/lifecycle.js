// Lifecycle steps: rise in once when first seen; the vignettes animate only while in view.
const section = document.querySelector('[data-lifesteps]');
if (section && 'IntersectionObserver' in window) {
  section.classList.add('is-ready');
  new IntersectionObserver((entries) => {
    const visible = entries[entries.length - 1].isIntersecting;
    if (visible) section.classList.add('is-shown');
    section.classList.toggle('is-active', visible && !document.hidden);
  }, { threshold: .2 }).observe(section);
  document.addEventListener('visibilitychange', () => { if (document.hidden) section.classList.remove('is-active'); });
}
