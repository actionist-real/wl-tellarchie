# Super Intelligence Coder website

Static marketing website for Super Intelligence Coder.

- Tagline: Think. Build. Deploy. Use.
- Website: https://superintelligencecoder.ai
- App: https://app.superintelligencecoder.ai/
- Documentation: https://docs.superintelligencecoder.ai/
- Support: support@superintelligencecoder.ai

## Local preview

With Node.js 18 or newer installed, run `node server.mjs` from this folder.
Open http://127.0.0.1:4173/. Use `node server.mjs 4174` for a different port.
No dependency installation or build is required. Use the server because assets
and JavaScript modules use root-relative URLs.

## Editing

`public/index.html` contains the homepage and initial pricing markup.
`public/js/site-config.js` is the source of truth for brand details, plan prices,
monthly credit allowances, project limits, top-ups, and existing benefits.
`public/js/pricing.js` generates matching markup and handles tier selection.
After changing pricing configuration, synchronize the initial homepage markup
using `pricingMarkup()` so the site works before JavaScript runs.

Prices were confirmed by the owner in chat; the original partner-console
screenshots were not available for independent verification. All prices are USD.
Solo tiers: Starter $29 / 200 credits / 3 projects; Pro $59 / 515 / 5;
Scale $119 / 1,030 / 10. Agency tiers: Team $149 / 1,100 / 10;
Studio $299 / 2,535 / 30; Scale $549 / 4,455 / 50. Plans renew monthly.
Top-ups cost $0.20 per credit; $20 buys 100 credits.

Shared styles live in `public/css/` and `public/tailwind.css`. The brand stylesheet
contains theme colors and the glossy buttons and glass header. The SVG at
`public/images/main favicon.svg` is used exclusively as the favicon. Visible
branding uses a separate image. Legal pages live under `public/legal/`.

Use `public/` as the deployment document root with directory-index routing.
The included server is for local previews. Authentication, billing, the app,
and documentation are external destinations, not implemented in this project.

## Source attribution

This project was adapted from a public BJCRUM frontend export captured from
https://bjcrum.com on 6 October 2026. It has since been rebranded and edited;
current files are not byte-for-byte copies. `export-manifest.json` records the
original capture and checksums, not the current customized files. Internal
export identifiers and third-party library/license notices are retained.
Screenshots depicting third-party interfaces remain unchanged.

Device bezel PNGs: https://github.com/Alqemist-labs/mockup-studio (Apple Design Resources). Screen artwork uses the supplied desktop.png and mobile.png.
