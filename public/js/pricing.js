import { site, plans, benefits, topUp } from './site-config.js';
const defaults = { solo: 'solo-515', agency: 'agency-2535' };
const number = new Intl.NumberFormat('en-US');
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const grant = (plan) => `${number.format(plan.credits)} credits ${plan.cadence === 'once' ? 'once' : 'per month'}`;
const billing = () => 'Billed monthly · Cancel anytime';

export function pricingMarkup() {
  return `<div class="pricing-wrapper">
    <div class="section-intro"><h2>Simple, transparent pricing</h2>
      <p>Choose a Solo or Agency plan for your next project.</p></div>
    <div class="pricing-grid">${Object.entries(plans).map(([family, offers]) => {
      const tiers = offers.filter((tier) => tier.price > 0);
      const selected = tiers.find((tier) => tier.id === defaults[family]);
      const title = family === 'solo' ? 'Solo' : 'Agency';
      return `<article class="pricing-card ${family}-card" data-plan-family="${family}" aria-labelledby="${family}-title">
        <div class="plan-heading"><h3 id="${family}-title">${title}</h3>${family === 'agency' ? '<span class="plan-badge">For teams</span>' : ''}</div>
        <p class="plan-description">${family === 'solo' ? 'One builder, your own workspace.' : 'Build with your team. Bring clients into the process.'}</p>
        <div class="plan-summary" aria-live="polite" aria-atomic="true">
          <div class="plan-price"><span data-price>$${selected.price}</span><span data-cadence>/month</span></div>
          <p data-billing>${billing(selected)}</p><p class="plan-credits" data-credits><svg class="site-icon" data-lucide="coins" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" />
  <path d="M15 6h1v4" />
  <path d="m6.134 14.768.866-.5 2 3.464" />
  <circle cx="16" cy="8" r="6" /></svg><span data-credit-value>${grant(selected)}</span></p><p class="plan-credits" data-projects>${selected.projects} projects per workspace</p>
        </div>
        <div class="tier-options" role="group" aria-label="${title} credit allowance">${tiers.map((tier) => `<button type="button" data-tier="${tier.id}" aria-label="${escape(tier.name)}: ${number.format(tier.credits)} credits and ${tier.projects} projects for $${tier.price} per month" aria-pressed="${tier.id === selected.id}">${escape(tier.name)}</button>`).join('')}</div><p class="tier-caption">Choose your plan</p>
        <ul class="plan-benefits">${benefits[family].map((line) => `<li><svg class="benefit-check" data-lucide="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" /></svg>${escape(line)}</li>`).join('')}</ul>
        <a class="site-button ${family === 'solo' ? 'secondary' : 'primary'}" href="${site.app}" aria-label="Get started with ${title} on ${escape(site.name)}">Get started</a>
      </article>`;
    }).join('')}</div>
    <p class="pricing-note">All prices in USD. Choose your plan in ${escape(site.name)} after signing in.<br>Paid plans renew monthly. Top-up credits cost ${topUp.pricePerCredit.toFixed(2)} each, ${number.format(topUp.examplePrice)} buys ${number.format(topUp.exampleCredits)} credits.</p>
  </div>`;
}
export function initPricing() {
  document.querySelectorAll('[data-plan-family]').forEach((card) => {
    card.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tier]');
      if (!button) return;
      const plan = plans[card.dataset.planFamily].find((tier) => tier.id === button.dataset.tier);
      if (!plan) return;
      card.querySelectorAll('[data-tier]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      card.querySelector('[data-price]').textContent = `$${plan.price}`;
      card.querySelector('[data-cadence]').textContent = plan.price === 0 ? '' : '/month';
      card.querySelector('[data-billing]').textContent = billing(plan);
      card.querySelector('[data-credit-value]').textContent = grant(plan);
      card.querySelector('[data-projects]').textContent = `${plan.projects} projects per workspace`;
    });
  });
}
