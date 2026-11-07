import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Abbas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const {plans,site,topUp}=await import('./public/js/site-config.js');
assert.equal(site.support,'support@superintelligencecoder.ai'); assert.equal(site.docs,'https://docs.superintelligencecoder.ai/'); assert.equal(topUp.pricePerCredit,0.20);
const expected=[['Starter',29,200,3],['Pro',59,515,5],['Scale',119,1030,10],['Team',149,1100,10],['Studio',299,2535,30],['Scale',549,4455,50]];
assert.deepEqual([...plans.solo,...plans.agency].map(p=>[p.name,p.price,p.credits,p.projects]),expected);
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Abbas/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
assert.equal(await page.title(),'Super Intelligence Coder | Think. Build. Deploy. Use.');
assert.equal(await page.locator('a[href*="bjcrum"]').count(),0);
assert.equal(await page.locator('[data-free-offer]').count(),0);
for(const [family,tiers] of Object.entries(plans))for(const plan of tiers){const card=page.locator(`[data-plan-family="${family}"]`);await card.locator(`[data-tier="${plan.id}"]`).click();assert.equal(await card.locator('[data-price]').innerText(),`$${plan.price}`);assert.equal(await card.locator('[data-plan-name]').innerText(),plan.name);assert.equal(await card.locator('[data-projects]').innerText(),`${plan.projects} projects per workspace`);assert.equal(await card.locator('[data-credits]').innerText(),`${plan.credits.toLocaleString('en-US')} credits per month`);}
await page.locator('#pricing').screenshot({path:'pricing-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.locator('#pricing').screenshot({path:'pricing-mobile.png'});
for(const route of ['/legal','/legal/terms','/legal/privacy','/legal/refund','/legal/cookies','/legal/acceptable-use']){await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'domcontentloaded'});assert.match(await page.title(),/Super Intelligence Coder/);assert.doesNotMatch(await page.locator('body').innerText(),/bjcrum/i);assert.equal(await page.locator('a[href*="bjcrum"]').count(),0);}
assert.deepEqual(errors,[]);
await browser.close();
console.log('PASS: six tier selections, owner-confirmed prices/credits/project limits, title, support/docs configuration, all six legal routes, no old text/link branding, no browser script errors. Desktop/mobile pricing screenshots saved.');

