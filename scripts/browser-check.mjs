import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { profile } from '../src/data/profile.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const errors=[],missing=[],remote=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)missing.push(response.url());});
page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:5173')&&!request.url().startsWith('data:'))remote.push(request.url());});
mkdirSync('docs/redesign/screenshots',{recursive:true});
const jump=async selector=>{
 await page.evaluate(selector=>{const element=document.querySelector(selector);scrollTo({top:element.getBoundingClientRect().top+scrollY-64,behavior:'instant'});},selector);
 await page.waitForTimeout(700);
};
try{
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').textContent(),'AI, putto work.');
  assert.equal(await page.locator('.project-chapter').count(),4);
  assert.equal(await page.locator('.plotter, .mobile-pad, canvas').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  await page.screenshot({path:`docs/redesign/screenshots/hero-${width}.png`});
  for(const project of profile.projects){
   await jump(`#${project.id}`);
   assert.ok(await page.locator(`#${project.id} a[href="${project.repository}"]`).count());
   if(width>=900){
    assert.equal(await page.locator('.stage-top span').last().textContent(),project.name);
    assert.ok(await page.locator('.project-selector a[aria-current]').getAttribute('href')===`#${project.id}`);
    await page.locator('.project-stage').screenshot({path:`docs/redesign/screenshots/${project.id}-${width}.png`});
   } else {
    assert.ok(await page.locator(`#${project.id} .mobile-project-media img`).isVisible());
   }
  }
  await page.locator('#easyrtg summary').click();
  assert.ok(await page.locator('#easyrtg details').getAttribute('open')!==null);
  await page.getByRole('button',{name:'Pause motion'}).click();
  assert.equal(await page.locator('img[src*="-motion.webp"]').count(),0);
  await page.getByRole('button',{name:'Resume motion'}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5173');
 await jump('#easyrtg');
 assert.equal(await page.locator('img[src*="-motion.webp"]').count(),0);
 assert.ok(await page.getByRole('button',{name:'Reduced motion'}).isDisabled());
 assert.equal(await page.locator('a[href^="mailto:im.shivam.chavan@gmail.com"]').count(),2);
 assert.ok(await page.getByText('University of Birmingham, Dubai').isVisible());
 const pdf=await page.request.get('http://127.0.0.1:5173/shivam-chavan-resume.pdf');
 assert.equal(pdf.status(),200);assert.ok(pdf.headers()['content-type'].includes('pdf'));
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.deepEqual(remote,[]);
 console.log('PASS: 4 project chapters, scroll selection, 4 responsive widths, real repo links, disclosures, pause/resume, reduced motion, PDF, local-only requests, and clean console.');
}finally{await browser.close();}
