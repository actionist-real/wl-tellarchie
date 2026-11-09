import './hero-shader.js';
import { promptUrl } from './site-config.js';
import { initPricing } from './pricing.js';
import './motion.js';

initPricing();
import './chrome.js';

document.querySelectorAll('[data-prompt-form]').forEach((form) => {
  const input = form.elements.prompt;
  function resizeInput() {
    input.style.height = '62px';
    input.style.height = `${Math.min(180, Math.max(62, input.scrollHeight))}px`;
  }
  input.addEventListener('input', resizeInput);
  resizeInput();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.assign(promptUrl(form.elements.prompt.value));
  });
  form.elements.prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); form.requestSubmit();
    }
  });
});

const disclosures = [...document.querySelectorAll('.agent-info')];
document.addEventListener('click', (event) => disclosures.forEach((details) => {
  if (!details.contains(event.target)) details.open = false;
}));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  disclosures.forEach((details) => { if (details.open) { details.open = false; details.querySelector('summary').focus(); } });
});

import './product-tour.js';
import './workspace.js';
import './lifecycle.js';

const dialog = document.querySelector('.image-dialog');
let previewTrigger;
document.querySelectorAll('[data-preview]').forEach((button) => {
  button.addEventListener('click', (event) => {
    const image = button.querySelector('img') || button.closest('.showcase-card, figure')?.querySelector('img');
    if (!image) return;
    event.preventDefault();
    previewTrigger = button;
    const preview = dialog.querySelector('img');
    preview.src = image.src; preview.alt = image.alt || button.getAttribute('aria-label');
    dialog.showModal();
  });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => previewTrigger?.focus());

// Diagram mascot: a light 2.5D float and tilt on the static illustration.
import './archi-mascot.js';

import './curved-gallery.js';

import './faq.js';
