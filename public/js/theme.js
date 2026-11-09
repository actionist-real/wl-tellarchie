// Apply the saved theme before first paint. Storage can be disabled in private browsing.
(() => {
  let theme = 'dark';
  try { if (localStorage.getItem('tellarchi-theme') === 'light') theme = 'light'; } catch {}
  document.documentElement.classList.add(theme);
  document.documentElement.classList.remove(theme === 'dark' ? 'light' : 'dark');
  document.documentElement.setAttribute('toggle-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121212' : '#f6fafb');
  // Hold the hero on a neutral first frame until the hero shader takes over (js/hero-shader.js
  // clears this). With JavaScript off neither class is set, so the CSS fallback shows.
  const root = document.documentElement;
  // hero-wait keeps the neutral background until the shader starts or reports it cannot run;
  // hero-pending hides the content, and the timer reveals it even if scripts are slow or fail.
  root.classList.add('hero-wait', 'hero-pending');
  setTimeout(() => root.classList.remove('hero-pending'), 4000);
})();
