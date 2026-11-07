const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
function labelTheme() {
  const light = root.classList.contains('light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#fbf9f3' : '#1B211D');
  themeButton.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
  themeButton.setAttribute('aria-pressed', String(light));
}
labelTheme();
themeButton.addEventListener('click', () => {
  const theme = root.classList.contains('dark') ? 'light' : 'dark';
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.setAttribute('toggle-theme', theme);
  try { localStorage.setItem('superintelligencecoder-theme', theme); } catch {}
  labelTheme();
});

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(returnFocus = false) {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = mobileNav.hidden;
  mobileNav.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
mobileNav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true); });
document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 810px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });


function updateHeader() { document.querySelector('.site-header')?.classList.toggle('is-scrolled', scrollY > 30); }
addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear());

// The reference enables liquid refraction only in Chromium.
if (window.chrome && !/Firefox|FxiOS/.test(navigator.userAgent)) {
  document.querySelectorAll(".header-glass").forEach(layer => layer.classList.add("sb-liquid"));
}
