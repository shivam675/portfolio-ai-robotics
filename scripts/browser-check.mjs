// Browser check for the SC-01 landing (spec 8.4). Needs the Vite dev server (window.__robot is DEV only):
// PORTFOLIO_URL=http://127.0.0.1:5174 node scripts/browser-check.mjs
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { profile } from '../src/data/profile.js';
import { CHAPTERS, DOCK, REDUCED_U } from '../src/robot/pose.js';

const url=(process.env.PORTFOLIO_URL||'http://127.0.0.1:5174').replace(/\/$/,'');
const shots='docs/redesign/screenshots';
const RU=String(+REDUCED_U.toFixed(4));
const BERTHS=['work','experience','about','contact'];
const HOLD_SHOTS=['u023','u049','u0748','u0975'];
const errors=[],missing=[],remote=[];
const launch=(args=[])=>chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox',...args]});
mkdirSync(shots,{recursive:true});

async function open(browser,width,height,reduced=false){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  const request=window.requestAnimationFrame.bind(window);
  window.__frames=0;
  window.requestAnimationFrame=callback=>{window.__frames++;return request(callback);};
 });
 page.on('pageerror',error=>errors.push(`${width}x${height}: ${error.message}`));
 page.on('response',response=>{if(response.status()>=400)missing.push(response.url());});
 page.on('request',request=>{if(!/^(data|blob):/.test(request.url())&&!request.url().startsWith(url))remote.push(request.url());});
 await page.goto(url);
 await page.waitForFunction(()=>document.querySelector('.robot-stage[data-u]'),null,{timeout:20000});
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('.headline-line > span').evaluateAll(spans=>Promise.all(spans.flatMap(span=>span.getAnimations()).map(animation=>animation.finished)));
 return page;
}
const state=page=>page.evaluate(()=>{
 const stage=document.querySelector('.robot-stage'),landing=document.querySelector('.landing');
 return {u:stage.dataset.u,apart:Number(stage.dataset.apart),host:stage.dataset.host,parent:stage.parentElement.dataset.robotSlot,gl:stage.hasAttribute('data-gl'),
  chapter:landing.dataset.chapter,copy:Number(getComputedStyle(landing.querySelector('.hero-copy')).opacity),readout:landing.querySelector('.robot-readout').textContent,
  canvas:document.querySelectorAll('canvas.robot-gl').length,otherCanvas:document.querySelectorAll('canvas:not(.robot-gl)').length,
  berthsShown:[...document.querySelectorAll('.robot-berth')].filter(berth=>getComputedStyle(berth).display!=='none').length,
  overflow:document.documentElement.scrollWidth>innerWidth};
});
const settle=page=>page.waitForFunction(()=>__robot.host!=='hero'||Math.abs(__robot.u-__robot.uT)<1e-9,null,{timeout:5000,polling:50});
const scrollToU=(page,u)=>page.evaluate(u=>{const landing=document.querySelector('.landing'),r=landing.getBoundingClientRect();scrollTo({top:scrollY+r.top+u*(r.height-innerHeight),behavior:'instant'});},u);
async function toU(page,u){await scrollToU(page,u);await page.waitForTimeout(120);await settle(page);}
const centre=(page,selector)=>page.evaluate(selector=>document.querySelector(selector).scrollIntoView({block:'center',behavior:'instant'}),selector);
const jump=async(page,selector)=>{
 await page.evaluate(selector=>{const element=document.querySelector(selector);scrollTo({top:element.getBoundingClientRect().top+scrollY-64,behavior:'instant'});},selector);
 await page.waitForTimeout(700);
};
// rAF calls in one second, measured after one more second of quiet.
const idleFrames=page=>page.evaluate(async()=>{await new Promise(r=>setTimeout(r,1000));const n=window.__frames;await new Promise(r=>setTimeout(r,1000));return window.__frames-n;});
const click=(page,selector)=>page.evaluate(selector=>document.querySelector(selector).click(),selector); // element.click(): Playwright's click scrolls sticky controls
const inView=(page,selector)=>page.locator(selector).evaluate(element=>{const r=element.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});

async function common(page,width){
 assert.equal(await page.getByRole('heading',{level:1,name:'AI, put to work.',exact:true}).count(),1);
 assert.equal(await page.locator('h1 .headline-line > span').count(),2,'masked headline lines');
 assert.equal(await page.locator('.landing').evaluate(element=>getComputedStyle(element).backgroundColor),'rgb(16, 16, 16)');
 assert.equal(await page.locator('.project-preview').count(),4,'every featured project is in the index');
 assert.equal(await page.locator('.project-chapter').count(),4);
 assert.ok(await page.locator('.preview-image img, .project-slide img, .mobile-project-media img').evaluateAll(images=>images.every(image=>getComputedStyle(image).filter==='grayscale(1)')),'project media is monochrome');
 const contact=page.getByRole('link',{name:'Let’s talk'});
 assert.ok(await contact.isVisible(),`contact navigation is reachable at ${width}px`);
 assert.ok(await contact.evaluate(element=>element.getBoundingClientRect().height>=44),'contact target is at least 44px high');
 const report=JSON.parse(readFileSync('src/robot/robot.json','utf8')).report;
 assert.equal(await page.locator('.robot-stage').count(),1,'one stage node');
 assert.equal(await page.locator('.robot-stage [data-part]').count(),report.static,'static part count matches robot.json');
 assert.equal(await page.locator('.robot-stage [data-p]').count(),report.live,'live part count matches robot.json');
 assert.equal((await state(page)).otherCanvas,0,'no canvas besides the floor light');
 assert.ok(!(await state(page)).overflow,`no sideways scroll at ${width}`);
}
async function projects(page,width){
 for(const project of profile.projects){
  await jump(page,`#${project.id}`);
  assert.ok(await page.locator(`#${project.id} a[href="${project.repository}"]`).count());
  if(width>=900){
   assert.equal(await page.locator('.stage-top span').last().textContent(),project.name);
   assert.equal(await page.locator('.project-selector a[aria-current]').getAttribute('href'),`#${project.id}`);
  } else assert.ok(await page.locator(`#${project.id} .mobile-project-media img`).isVisible());
 }
}

async function pinned(browser,width,height){
 const page=await open(browser,width,height),tag=`${width}x${height}`;
 await common(page,width);
 let s=await state(page);
 assert.equal(s.u,'0');assert.equal(s.chapter,'0');assert.equal(s.host,'hero');
 assert.ok(s.canvas<=1,'at most one floor-light canvas');
 assert.equal(await page.locator('.robot-stage').getAttribute('role'),'img');
 assert.ok(await page.locator('.story-rail button').evaluateAll(buttons=>buttons.length===4&&buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'rail buttons are 44 x 44');
 if(width===1440)await page.screenshot({path:`${shots}/robot-u000.png`});

 // Scrub down and back up; record where captions change against the eased u.
 const changes=await page.evaluate(async()=>{
  const landing=document.querySelector('.landing'),top=scrollY+landing.getBoundingClientRect().top,span=landing.offsetHeight-innerHeight,seen=[];
  let chapter=landing.dataset.chapter;
  for(const down of [true,false])for(let i=0;i<=160;i++){
   scrollTo({top:top+(down?i:160-i)/160*span,behavior:'instant'});
   await new Promise(r=>setTimeout(r,16));
   if(landing.dataset.chapter!==chapter){seen.push([chapter,landing.dataset.chapter,__robot.u]);chapter=landing.dataset.chapter;}
  }
  return seen;
 });
 const down=changes.filter(([a,b])=>b>a).map(([,b])=>b).join(''),up=changes.filter(([a,b])=>b<a).map(([,b])=>b).join('');
 assert.equal(down,'1234',`${tag} chapters in order going down: ${JSON.stringify(changes)}`);
 assert.equal(up,'3210',`${tag} chapters in reverse going up: ${JSON.stringify(changes)}`);
 for(const [a,b,u] of changes)if(a!=='0'&&b!=='0'){
  const [from,to]=CHAPTERS[Math.min(a,b)-1].hold;
  assert.ok(u>=from-.01&&u<=to+.01,`${tag} caption ${a}->${b} changed at u ${u.toFixed(3)}, outside the hold ${from}-${to}`);
 }
 await settle(page);
 s=await state(page);
 assert.equal(s.u,'0','back at the top');assert.equal(s.copy,1,'headline returns');

 // Holds: each rail jump value shows its own chapter.
 for(const [i,chapter] of CHAPTERS.entries()){
  await toU(page,chapter.jump);
  s=await state(page);
  assert.equal(s.chapter,String(i+1),`${tag} u ${chapter.jump} shows chapter ${i+1}`);
  assert.equal(s.copy,0,'headline has left from Language on');
  if(width===1440){await page.waitForTimeout(300);await page.screenshot({path:`${shots}/robot-${HOLD_SHOTS[i]}.png`});}
 }
 await toU(page,.40);
 s=await state(page);
 assert.equal(s.chapter,'2');assert.ok(s.apart>.5,`apart at .40 is ${s.apart}`);
 await toU(page,.86);
 assert.match((await state(page)).readout,/^J1/);
 await toU(page,.99);
 await page.waitForTimeout(300); // caption crossfade
 s=await state(page);
 assert.equal(s.chapter,'4');assert.equal(s.copy,0);
 const caption=await page.evaluate(()=>{
  const item=document.querySelector('.story-caption[data-chapter="4"]'),arm=document.querySelector('.robot-arm'),b=arm.getBBox(),m=arm.getScreenCTM(),c=item.getBoundingClientRect();
  const a={left:m.a*b.x+m.e,right:m.a*(b.x+b.width)+m.e,top:m.d*b.y+m.f,bottom:m.d*(b.y+b.height)+m.f};
  return {opacity:Number(getComputedStyle(item).opacity),current:item.getAttribute('aria-current'),hits:c.left<a.right&&c.right>a.left&&c.top<a.bottom&&c.bottom>a.top};
 });
 assert.equal(caption.opacity,1,'caption 4 is visible');assert.equal(caption.current,'step');
 assert.ok(!caption.hits,'caption 4 clears the arm');
 assert.equal((await state(page)).canvas,(await state(page)).gl?1:0,'one floor-light canvas once WebGL is up');
 await toU(page,0);
 s=await state(page);
 assert.equal(s.u,'0');assert.equal(s.copy,1);
 assert.equal(await page.locator('h1').evaluate(element=>Number(getComputedStyle(element).opacity)),1);
 assert.equal(await idleFrames(page),0,`${tag} no rAF while idle in the hero`);

 // Rail: every button lands on its own chapter and marks it current.
 for(const [i,chapter] of CHAPTERS.entries()){
  await click(page,`.story-rail button[data-chapter="${i+1}"]`);
  await page.waitForFunction(({n,jump})=>document.querySelector('.landing').dataset.chapter===n&&Math.abs(__robot.uT-jump)<.003&&Math.abs(__robot.u-__robot.uT)<1e-9,{n:String(i+1),jump:chapter.jump},{timeout:6000,polling:50});
  assert.equal(await page.locator('.story-rail button[aria-current="step"]').getAttribute('data-chapter'),String(i+1));
  assert.equal(await page.locator('.story-caption[aria-current="step"]').getAttribute('data-chapter'),String(i+1));
 }

 // Skip intro is instant: it never scrubs through the story.
 await toU(page,0);
 await page.evaluate(()=>{const landing=document.querySelector('.landing');window.__chapters=[];new MutationObserver(()=>window.__chapters.push([landing.dataset.chapter,+__robot.u.toFixed(3),__robot.host,Math.round(scrollY)])).observe(landing,{attributes:true,attributeFilter:['data-chapter']});});
 await page.locator('.skip-intro').focus();await page.keyboard.press('Enter'); // real input: a scripted element.click() races the scroll-behavior reset
 await page.waitForTimeout(800);
 const written=await page.evaluate(()=>window.__chapters);
 assert.ok(written.every(([chapter])=>chapter==='4'),`skip intro writes only the last chapter: ${JSON.stringify(written)}`);
 assert.ok(await inView(page,'#work-title'),'skip intro lands on the work heading');
 assert.equal(await page.evaluate(()=>location.hash),'#work');

 // Berths.
 for(const name of BERTHS){
  if(name==='contact')await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  else await centre(page,`[data-robot-slot=${name}]`);
  const fits=await page.locator(`[data-robot-slot=${name}]`).evaluate(berth=>berth.dataset.fit!=='no');
  if(fits)await page.waitForFunction(({name,u})=>__robot.host===name&&document.querySelector('.robot-stage').dataset.u===u,{name,u:String(DOCK[name])},{timeout:4000,polling:50})
   .catch(async()=>assert.fail(`${tag} robot did not dock in ${name}: ${JSON.stringify(await state(page))}`));
  const b=await page.evaluate(name=>{
   const berth=document.querySelector(`[data-robot-slot=${name}]`),stage=document.querySelector('.robot-stage'),r=berth.getBoundingClientRect();
   const box={left:r.left-24,right:r.right+24,top:r.top-24,bottom:r.bottom+24};
   const hits=[...berth.closest('section').querySelectorAll('h1,h2,h3,p,a,li,summary,button,svg')].filter(el=>!el.contains(berth)&&!berth.contains(el))
    .filter(el=>{const q=el.getBoundingClientRect();return q.width&&q.height&&q.left<box.right&&q.right>box.left&&q.top<box.bottom&&q.bottom>box.top;}).map(el=>el.outerHTML.slice(0,80));
   return {fit:berth.dataset.fit!=='no',parent:stage.parentElement===berth,hidden:berth.getAttribute('aria-hidden'),stageHidden:stage.getAttribute('aria-hidden'),role:stage.getAttribute('role'),
    pointer:getComputedStyle(berth).pointerEvents,apart:stage.dataset.apart,hits};
  },name);
  assert.equal(b.hidden,'true');assert.equal(b.pointer,'none');
  if(!b.fit){console.log(`  ${tag} ${name}: data-fit=no`);continue;}
  assert.ok(b.parent,`${tag} stage sits in the ${name} berth`);
  assert.equal(b.stageHidden,'true');assert.equal(b.role,null);assert.equal(b.apart,'0');
  assert.deepEqual(b.hits,[],`${tag} ${name} berth touches text`);
  if(width===1440)await page.screenshot({path:`${shots}/robot-${name}.png`});
  if(name==='work'){await page.waitForTimeout(1000);assert.equal(await idleFrames(page),0,`${tag} no rAF while parked`);}
 }

 // A jump from the Anatomy chapter to #contact (native smooth anchor scroll) lands in the contact berth, assembled, within 1.5 s, then docks.
 await toU(page,.40);
 if(await page.locator('[data-robot-slot=contact]').evaluate(berth=>berth.dataset.fit!=='no')){
  const t0=Date.now();
  await click(page,'.header a[href="#contact"]');
  await page.waitForFunction(()=>__robot.host==='contact'&&document.querySelector('.robot-stage').dataset.apart==='0',null,{timeout:1500,polling:50})
   .catch(async()=>assert.fail(`${tag} #contact jump did not reach the berth in 1.5 s: ${JSON.stringify(await state(page))}`));
  const landed=Date.now()-t0;
  await page.waitForFunction(()=>document.querySelector('.robot-stage').dataset.u==='2',null,{timeout:1500,polling:50});
  console.log(`  ${tag} #contact jump: in the berth after ${landed} ms, docked after ${Date.now()-t0} ms`);
 }

 if(width===1440){
  // Pause freezes the robot while text follows the scroll; Resume follows again; clicks never move the page.
  await toU(page,.3);
  let y=await page.evaluate(()=>scrollY);
  await click(page,'.motion-button');
  assert.match(await page.locator('.motion-button').textContent(),/Resume motion/);
  assert.equal(await page.evaluate(()=>scrollY),y,'pause does not scroll');
  const frozen=(await state(page)).u;
  await scrollToU(page,.86);
  await page.waitForTimeout(800);
  s=await state(page);
  assert.equal(s.u,frozen,'pause freezes the robot');assert.equal(s.chapter,'4','captions follow the scroll while paused');assert.match(s.readout,/^J1/);
  assert.equal(await page.locator('img[src*="-motion.webp"]').count(),0,'pause stops project motion');
  y=await page.evaluate(()=>scrollY);
  await click(page,'.motion-button');
  assert.match(await page.locator('.motion-button').textContent(),/Pause motion/);
  await settle(page);
  assert.equal(await page.evaluate(()=>scrollY),y,'resume does not scroll');
  assert.ok(Math.abs(Number((await state(page)).u)-.86)<.01,'resume follows the scroll');
  // Paused arrival snaps to the berth pose, no fade.
  await click(page,'.motion-button');
  await centre(page,'[data-robot-slot=work]');
  await page.waitForTimeout(400);
  s=await state(page);
  assert.equal(s.host,'work');assert.equal(s.u,String(DOCK.work));
  assert.ok(!(await page.locator('.robot-stage').evaluate(stage=>stage.classList.contains('robot-arriving'))),'paused arrival has no fade');
  await click(page,'.motion-button');

  // Display type enters from the edge, settles, and holds still when paused.
  const word=page.locator('.type-row').first();
  const placeWord=async fraction=>{await word.evaluate((e,f)=>scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight*f,behavior:'instant'}),fraction);await page.waitForTimeout(1800);};
  const flight=()=>word.evaluate(e=>Number(e.style.getPropertyValue('--flight')));
  await placeWord(.65);assert.ok(await flight()>.2,'display type enters from outside the frame');
  await placeWord(.22);assert.ok(Math.abs(await flight())<.001,'display type settles');
  await click(page,'.motion-button');
  await placeWord(.65);
  assert.equal(await word.locator('span').evaluate(e=>getComputedStyle(e).transform),'none','pause stabilizes the moving text');
  await click(page,'.motion-button');
  await page.locator('.project-preview').first().focus();
  assert.equal(await page.locator('.preview-card').first().evaluate(e=>getComputedStyle(e).transform),'none','keyboard focus makes a flying preview usable');

  await projects(page,width);

  // A live switch to reduced motion gives the still frame and the in-flow layout.
  await toU(page,.40);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(u=>document.querySelector('.robot-stage').dataset.u===u,RU,{timeout:3000,polling:50});
  const live=await page.evaluate(()=>{const landing=document.querySelector('.landing');return {reduced:landing.classList.contains('landing-reduced'),short:landing.offsetHeight<2.5*innerHeight,sticky:getComputedStyle(document.querySelector('.hero-sticky')).position,canvas:[...document.querySelectorAll('canvas')].filter(c=>getComputedStyle(c).display!=='none').length};});
  assert.deepEqual(live,{reduced:true,short:true,sticky:'relative',canvas:0},'live reduced switch');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.hero-sticky')).position==='sticky',null,{timeout:3000});
  await toU(page,.86);
  assert.match((await state(page)).readout,/^J1/,'motion resumes after the live switch');
 }
 assert.ok(!(await state(page)).overflow,`no sideways scroll at ${tag}`);
 await page.context().close();
}

async function inflow(browser,width,height){
 const page=await open(browser,width,height),tag=`${width}x${height}`;
 await common(page,width);
 let s=await state(page);
 assert.equal(s.canvas+s.otherCanvas,0,`${tag} no canvas in flow`);
 assert.equal(s.berthsShown,0,`${tag} no berth displayed`);
 assert.equal(await page.locator('.hero-sticky').evaluate(element=>getComputedStyle(element).position),'relative');
 if(width===390){
  await centre(page,'.robot-slot');
  await page.waitForTimeout(150);await settle(page);
  await page.screenshot({path:`${shots}/robot-390.png`});
  await projects(page,width);
  await page.locator('#easyrtg summary').click();
  assert.ok(await page.locator('#easyrtg details').getAttribute('open')!==null,'project details open at 390');
 }
 await jump(page,'#contact');
 s=await state(page);
 assert.equal(s.parent,'hero',`${tag} the stage stays in the hero slot`);assert.equal(s.host,'hero');
 assert.equal(s.berthsShown,0);
 assert.equal(await idleFrames(page),0,`${tag} no rAF while idle`);
 assert.ok(!s.overflow,`no sideways scroll at ${tag}`);
 await page.context().close();
}

async function short(browser){
 const page=await open(browser,1280,600);
 assert.equal(await page.locator('.hero-sticky').evaluate(element=>getComputedStyle(element).position),'relative');
 assert.equal((await state(page)).canvas,0);
 await page.getByRole('link',{name:'View selected work'}).click();
 await page.waitForTimeout(1200);
 assert.ok(await page.locator('#work-title').evaluate(element=>{const r=element.getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight;}),'the work link skips the reveal on a short screen');
 assert.ok(!(await state(page)).overflow);
 await page.context().close();
}

async function reducedRun(browser){
 const page=await open(browser,320,640,true);
 await common(page,320);
 let s=await state(page);
 assert.equal(s.u,RU,'reduced motion shows the still frame');assert.ok(s.apart>.5,'the still frame is the open assembly');
 assert.equal(s.canvas+s.otherCanvas,0);assert.equal(s.berthsShown,0);
 const motion=page.locator('.motion-button');
 assert.ok(await motion.isDisabled());assert.match(await motion.textContent(),/Reduced motion/);
 const inspect=page.locator('.assembly-control');
 await centre(page,'.robot-slot');
 await page.screenshot({path:`${shots}/robot-reduced-320.png`});
 const shows=u=>page.waitForFunction(u=>document.querySelector('.robot-stage').dataset.u===u,u,{timeout:1000,polling:20}); // instant, but written on the next frame
 await inspect.focus();await page.keyboard.press('Enter');
 await shows('0');assert.equal(await inspect.getAttribute('aria-pressed'),'false','Enter assembles');
 await page.keyboard.press('Space');
 await shows(RU);assert.equal(await inspect.getAttribute('aria-pressed'),'true','Space opens it again');
 await jump(page,'#easyrtg');
 assert.equal(await page.locator('img[src*="-motion.webp"]').count(),0);
 assert.equal(await page.locator('a[href^="mailto:im.shivam.chavan@gmail.com"]').count(),2);
 assert.ok(await page.getByText('University of Birmingham, Dubai').isVisible());
 const pdf=await page.request.get(`${url}/shivam-chavan-resume.pdf`);
 assert.equal(pdf.status(),200);assert.ok(pdf.headers()['content-type'].includes('pdf'));
 await page.context().close();
}

async function noWebGL(){
 const browser=await launch(['--disable-3d-apis']);
 try{
  const page=await open(browser,1440,900);
  await toU(page,.65);
  const s=await state(page);
  assert.ok(!s.gl,'no data-gl without WebGL');assert.equal(s.canvas+s.otherCanvas,0,'the unused canvas is removed');
  assert.ok(Math.abs(Number(s.u)-.65)<.01,'the drawing still follows the scroll');
 }finally{await browser.close();}
}

const browser=await launch();
try{
 for(const [width,height] of [[1440,900],[1280,800],[1024,768]]){await pinned(browser,width,height);console.log(`ok pinned ${width}x${height}`);}
 for(const [width,height] of [[768,1024],[390,844],[320,640]]){await inflow(browser,width,height);console.log(`ok in-flow ${width}x${height}`);}
 await short(browser);console.log('ok 1280x600');
 await reducedRun(browser);console.log('ok reduced 320');
}finally{await browser.close();}
await noWebGL();console.log('ok no WebGL');
assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.deepEqual(remote,[]);
console.log('PASS: stage and part counts, chapters both ways with captions in holds, headline exit and return, rail, skip intro, pause, idle frames, berths at 3 sizes, #contact jump, in-flow and reduced layouts, Inspect keys, live reduced switch, no-WebGL run, no sideways scroll, links, PDF, local-only requests, clean console.');
