// Workspace section: a feature list beside a card that shows that feature's screen.
// The section stays hidden until data-ready is added to it, after its screens are in place, so the
// live page never shows a half-finished section. Autoplay runs while the section is in view.
const section = document.querySelector('[data-workspace]');
if (section) {
  const tabs = [...section.querySelectorAll('[data-ws-tab]')];
  const panels = [...section.querySelectorAll('[data-ws-panel]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stepMs = 6000;
  let selected = 0, timer = 0, inView = false;

  const select = (index) => {
    selected = index;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (!reduced.matches) panels[index].animate?.([{ opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 420, easing: 'cubic-bezier(.22,.68,.2,1)' });
  };
  const schedule = () => {
    clearTimeout(timer);
    if (inView && !document.hidden && !reduced.matches) timer = setTimeout(() => {
      // Check the position directly too, in case the visibility observer reports late.
      const box = section.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= innerHeight) { inView = false; return; }
      select((selected + 1) % tabs.length); schedule();
    }, stepMs);
  };

  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `ws-panel-${index}`);
    panels[index].id = `ws-panel-${index}`;
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', () => { select(index); schedule(); });
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowDown: index + 1, ArrowUp: index - 1, ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      const next = (keys[event.key] + tabs.length) % tabs.length;
      select(next); tabs[next].focus(); schedule();
    });
  });
  tabs.forEach((tab, i) => { tab.tabIndex = i === 0 ? 0 : -1; });

  // Switched on by data-ready in the markup once the four screens are in /images/workspace/.
  // (No probing for missing files, so visitors' consoles stay free of 404s.)
  if (section.hasAttribute('data-ready')) {
    section.hidden = false;
    new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; schedule(); }, { threshold: .3 }).observe(section);
    document.addEventListener('visibilitychange', schedule);
  }
}
