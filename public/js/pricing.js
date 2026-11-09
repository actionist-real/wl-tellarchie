import { site, plans, topUp } from './site-config.js';
const number = new Intl.NumberFormat('en-US');
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name, paths, cls = 'site-icon') => `<svg class="${cls}" data-lucide="${name}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
const icons = {
  check: icon('check', '<path d="M20 6 9 17l-5-5"/>', 'price-check'),
  info: icon('info', '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  coins: icon('coins', '<path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/><path d="M15 6h1v4"/><path d="m6.134 14.768.866-.5 2 3.464"/><circle cx="16" cy="8" r="6"/>'),
  wallet: icon('wallet', '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'),
  infinity: icon('infinity', '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>'),
  dollar: icon('circle-dollar-sign', '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>'),
  arrow: icon('arrow-right', '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
};

function planMarkup(plan) {
  const perCredit = plan.price > 0 ? ` · about $${(plan.price / plan.credits).toFixed(2)} per credit` : '';
  return `<article class="price-plan price-plan--${plan.featured ? 'featured' : 'base'}" data-plan="${plan.id}" aria-labelledby="plan-${plan.id}-title">
        <header class="price-head"><h3 id="plan-${plan.id}-title">${escape(plan.name)}</h3>${plan.promo ? `<span class="price-promo">${escape(plan.promo)}</span>` : ''}</header>
        <p class="price-amount"><span class="price-currency">$</span><span class="price-value">${number.format(plan.price)}</span><span class="price-cadence">${plan.price > 0 ? '/ month' : 'forever'}</span></p>
        <p class="price-meta">${icons.coins}<span><strong>${number.format(plan.credits)} credits</strong> ${escape(plan.allowance)}${perCredit}</span></p>
        <a class="site-button ${plan.featured ? 'primary' : 'secondary'} price-cta" href="${site.app}" aria-label="${escape(plan.cta)} with the ${escape(plan.name)} plan on ${escape(site.name)}">${escape(plan.cta)}${icons.arrow}</a>
        <p class="price-billing">${escape(plan.billing)}</p>
        <p class="price-list-label">${escape(plan.listLabel)}</p>
        <ul class="price-list">${plan.points.map((line) => `<li>${icons.check}<span>${escape(line)}</span></li>`).join('')}</ul>
        ${plan.note ? `<p class="price-note">${icons.info}<span>${escape(plan.note)}</span></p>` : ''}
      </article>`;
}

// Static markup for the pricing section. index.html carries a copy so the section works before JavaScript runs.
export function pricingMarkup() {
  const facts = [
    [icons.coins, `Top-ups at <strong>$${topUp.pricePerCredit.toFixed(2)}</strong> / credit`],
    [icons.wallet, `<strong>$${number.format(topUp.examplePrice)}</strong> buys ${number.format(topUp.exampleCredits)} credits`],
    [icons.infinity, '<strong>Unlimited</strong> projects'],
    [icons.dollar, 'Prices in <strong>USD</strong>'],
  ];
  return `<div class="pricing-wrapper">
    <div class="section-intro"><span class="pricing-eyebrow">Pricing</span><h2>Start free. Build on credits.</h2>
      <p>One plan when you are ready to ship, and top-ups whenever a project needs more.</p></div>
    <div class="pricing-shell">
      ${plans.map(planMarkup).join('\n      ')}
      <ul class="price-facts" aria-label="Credits and billing">${facts.map(([svg, text]) => `<li>${svg}<span>${text}</span></li>`).join('')}</ul>
    </div>
  </div>`;
}

// No interactive tiers: each live plan has its own card.
export function initPricing() {}
