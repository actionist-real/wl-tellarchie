// Diagram mascot: a slow float plus a gentle tilt toward the cursor.
// The image is untouched without JS, with reduced motion, or while off screen.
const section = document.querySelector('#diagram-section');
const mascots = section ? [...section.querySelectorAll('.workflow-robot-static')] : [];
if (section && mascots.length) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0, visible = false;

  mascots.forEach(img => {
    img.style.transformOrigin = '50% 85%';
    img.style.willChange = 'transform';
  });

  function render(time) {
    current.x += (target.x - current.x) * .08;
    current.y += (target.y - current.y) * .08;
    const float = Math.sin(time * .0016) * 3;
    const transform = `translate3d(${(current.x * 6).toFixed(2)}px, ${(float + current.y * 4).toFixed(2)}px, 0) rotate(${(current.x * 4).toFixed(2)}deg)`;
    mascots.forEach(img => { img.style.transform = transform; });
    frame = requestAnimationFrame(render);
  }
  function sync() {
    const run = visible && !document.hidden && !reduced.matches;
    if (run && !frame) frame = requestAnimationFrame(render);
    if (!run && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (reduced.matches) mascots.forEach(img => { img.style.transform = ''; });
  }

  // -1..1 from the section's centre, so the tilt follows the cursor across the whole diagram.
  section.addEventListener('pointermove', event => {
    const box = section.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    target.y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
  }, { passive: true });
  section.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); sync(); }).observe(section);
  }
}
