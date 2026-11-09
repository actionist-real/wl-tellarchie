// Brand details and live pricing for Tell Archi.
// Source: the Tell Archi partner console (Branding and Pricing tabs). All amounts are USD.
// Only tiers switched on in the console are listed. Update here, then regenerate the
// static pricing markup in index.html with pricingMarkup() from pricing.js.
export const site = {
  name: 'Tell Archi', tagline: 'Describe your app, get it built and deployed instantly', origin: 'https://www.tellarchie.com', app: 'https://app.tellarchie.com/',
  docs: 'https://app.tellarchie.com/docs', support: 'support@tellarchie.com', // Placeholder address until a real support mailbox is confirmed.
};
export const plans = [
  {
    id: 'launch', name: 'Launch', promo: '+150 bonus credits when you join', price: 200, credits: 1350, allowance: 'every month', featured: true,
    billing: 'Billed monthly', cta: 'Start building', listLabel: 'Everything you need to ship',
    points: [
      'Full AI builder with live preview', 'Publish to a live URL or your domain', 'Tell Archi Max included on every build',
      'Export your code or sync with GitHub', '10 AI + 20 stock images per project', 'Version history with one-click restore',
    ],
  },
  {
    id: 'free', name: 'Free', price: 0, credits: 50, allowance: 'every 30 days', featured: false,
    billing: 'No card required', cta: 'Start free', listLabel: 'What is included',
    points: ['Full Solo access', 'Unlimited projects', 'Access continues after the credits run out'],
    note: 'Unused credits expire at each refill.',
  },
];
export const topUp = { pricePerCredit: 0.20, examplePrice: 20, exampleCredits: 100 };
export function promptUrl(raw) {
  const prompt = String(raw ?? '').trim().slice(0, 2000);
  const url = new URL(site.app);
  if (prompt) url.searchParams.set('prompt', prompt);
  return url.href;
}
