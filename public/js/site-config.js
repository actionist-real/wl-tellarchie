// Pricing confirmed by the owner in chat. Original console screenshots were not independently verified.
// All amounts are USD.
export const site = {
  name: 'Super Intelligence Coder', tagline: 'Think. Build. Deploy. Use.', origin: 'https://superintelligencecoder.ai', app: 'https://app.superintelligencecoder.ai/',
  docs: 'https://docs.superintelligencecoder.ai/', support: 'support@superintelligencecoder.ai',
};
export const plans = {
  solo: [
    { id: 'solo-200', name: 'Starter', projects: 3, credits: 200, price: 29, cadence: 'monthly' },
    { id: 'solo-515', name: 'Pro', projects: 5, credits: 515, price: 59, cadence: 'monthly' },
    { id: 'solo-1030', name: 'Scale', projects: 10, credits: 1030, price: 119, cadence: 'monthly' },
  ],
  agency: [
    { id: 'agency-1100', name: 'Team', projects: 10, credits: 1100, price: 149, cadence: 'monthly' },
    { id: 'agency-2535', name: 'Studio', projects: 30, credits: 2535, price: 299, cadence: 'monthly' },
    { id: 'agency-4455', name: 'Scale', projects: 50, credits: 4455, price: 549, cadence: 'monthly' },
  ],
};
export const topUp = { pricePerCredit: 0.20, examplePrice: 20, exampleCredits: 100 };
export const benefits = {
  solo: [
    'The full AI builder with live preview', 'Publish to a live URL, or your own custom domain',
    'Deep AI reasoning for your builds', 'Code export and GitHub sync',
    '10 AI + 20 stock images per project', 'Version history and restore',
  ],
  agency: [
    'Everything in Solo', 'Invite clients to review and comment', 'Up to 15 team seats with roles',
    'Public, unlisted or private visibility', 'Android APK, Play Store and App Store kits',
    '25 AI + 50 stock images per project',
  ],
};
export function promptUrl(raw) {
  const prompt = String(raw ?? '').trim().slice(0, 2000);
  const url = new URL(site.app);
  if (prompt) url.searchParams.set('prompt', prompt);
  return url.href;
}
