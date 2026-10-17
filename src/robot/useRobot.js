import { useEffect, useRef } from 'react';
import { clamp, follow, separationAt } from '../anatomy/motion.js';
import { CHAPTERS, DOCK, REDUCED_U, chapterAt, groupsOf, readoutAt, stateAt } from './pose.js';

// Same condition as the pinned CSS block and the berth media query in styles.css.
const PINNED='(min-width:900px) and (min-height:741px) and (prefers-reduced-motion:no-preference)';
const MOVE_MS=700;
const GROUPS=['yaw','sh','el','wr','fA','fB','pan','capJ2','capJ3'];
const LIFTED=['battery','compute','top'];
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight;};
const smooth=t=>t*t*(3-2*t);

// Berth fit check (spec 3.1): centre absolute berths, hide any that would touch text.
export function fitBerths(){
  for(const berth of document.querySelectorAll('.robot-berth')){
    berth.removeAttribute('data-fit');berth.style.left='';
    const style=getComputedStyle(berth);
    if(style.display==='none')continue;
    if(style.position==='absolute'){
      const first=berth.previousElementSibling.getBoundingClientRect(),last=berth.nextElementSibling.getBoundingClientRect();
      berth.style.left=`${(first.right+last.left-berth.offsetWidth)/2-berth.parentElement.getBoundingClientRect().left}px`;
    }
    const r=berth.getBoundingClientRect(),section=berth.closest('section');
    const s=section.getBoundingClientRect(),box={left:r.left-24,right:r.right+24,top:r.top-24,bottom:r.bottom+24};
    const inside=r.left>=s.left+24&&r.right<=s.right-24&&r.top>=s.top+24&&r.bottom<=s.bottom-24;
    const hit=[...section.querySelectorAll('h1,h2,h3,p,a,li,summary,button,svg')].some(el=>!el.contains(berth)&&!berth.contains(el)&&overlaps(el.getBoundingClientRect(),box));
    if(!inside||hit)berth.dataset.fit='no';
  }
}

// One stage node, one rAF loop (spec 5.2). Text (chapter, captions, rail, readout) works before the stage has loaded.
export default function useRobot({motion,reduced}){
  const props=useRef({motion,reduced});
  const sync=useRef(null);
  props.current={motion,reduced};
  useEffect(()=>{
    const landing=document.querySelector('.landing');
    const slot=landing.querySelector('[data-robot-slot=hero]');
    const berths=[...document.querySelectorAll('.robot-berth')];
    const captions=[...landing.querySelectorAll('.story-caption')],rail=[...landing.querySelectorAll('.story-rail button')];
    const count=landing.querySelector('.rail-count'),readout=landing.querySelector('.robot-readout'),inspect=landing.querySelector('.assembly-control');
    const pinned=matchMedia(PINNED);
    let disposed=false,raf=0,last=0,needFit=true,force=true;
    let still=REDUCED_U,uT=0,u=0,anim=null,host='hero',hostEl=slot;
    let data=null,ctrl=null,stage=null,armSvg=null,pieces=null,light=null,lightTried=false,lightModule=null;
    let ema=0,half=false,tick=0,lastG=null,lastShares=null,lastBrain='',lastU='',lastApart='';
    let chapter=-1,text='',lastExit='',lastP='',pressed='';

    const loadLight=()=>lightModule??=import('./floor-light.js');
    const hosts=()=>pinned.matches?[slot,...berths.filter(b=>b.dataset.fit!=='no')]:[slot];
    const kick=()=>{if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame);};

    function target(){
      if(props.current.reduced)return still;
      if(pinned.matches){const r=landing.getBoundingClientRect();return separationAt(r.top,r.height,innerHeight);}
      return REDUCED_U*clamp((.92*innerHeight-slot.getBoundingClientRect().top)/(.62*innerHeight));
    }
    // Crop vars for the current host: pinned hero = whole viewBox, in-flow hero = phone crop, berth = dock crop.
    function place(){
      const crop=host!=='hero'?data.crop.dock:pinned.matches?data.crop.hero:data.crop.phone;
      ['x','y','w','h'].forEach((k,i)=>stage.style.setProperty(`--crop-${k}`,crop[i]));
    }
    function moveTo(el){
      const arriving=props.current.motion&&visible(el);
      anim=null;hostEl=el;host=el.dataset.robotSlot;
      el.append(stage);
      stage.dataset.host=host;
      if(host==='hero'){
        u=uT;stage.setAttribute('role','img');stage.setAttribute('aria-label',data.label);stage.removeAttribute('aria-hidden');
      }else{
        const to=DOCK[host];
        u=props.current.motion?Math.max(1,Math.min(to+.25,Math.max(to-.25,u))):to;
        stage.removeAttribute('role');stage.removeAttribute('aria-label');stage.setAttribute('aria-hidden','true');
      }
      // Re-attaching restarts the CSS animation, so the class alone gives the 200 ms arrival fade.
      stage.classList.toggle('robot-arriving',host!=='hero'&&arriving);
      place();force=true;
      io.disconnect();io.observe(el);
    }
    // Host rule (3.2) and berth trigger (3.3).
    function route(now){
      const list=hosts();
      if(!list.includes(hostEl)||!visible(hostEl)){
        let best=hostEl,distance=Infinity;
        for(const el of list){const r=el.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-innerHeight/2);if(d<distance){distance=d;best=el;}}
        if(best!==hostEl)moveTo(best);
      }
      if(host==='hero')return;
      const to=DOCK[host];
      if(u!==to&&anim?.to!==to&&hostEl.getBoundingClientRect().top<.8*innerHeight){
        if(props.current.motion)anim={from:u,to,t0:now};else{u=to;anim=null;}
      }
    }
    function createLight(){
      lightTried=true;
      loadLight().then(({createFloorLight})=>{
        if(disposed)return;
        const canvas=document.createElement('canvas');
        canvas.className='robot-gl';canvas.setAttribute('aria-hidden','true');
        stage.querySelector('.robot-body').before(canvas);
        light=createFloorLight(canvas,data.gl);
        if(light)stage.dataset.gl='';else canvas.remove();
        kick();
      });
    }
    function draw(pin){
      const s=stateAt(u),g=groupsOf(s.values);
      let more=false;
      if(force||!lastG||GROUPS.some(k=>Math.abs(g[k]-lastG[k])>1e-3)){
        // Half-rate lever (5.1): when the live layer is slow, render it on alternate frames.
        if(half&&!force&&tick++%2)more=true;
        else{
          const st=ctrl.set(g,{detail:host==='hero'?1:0});
          ema=ema?.9*ema+.1*st.ms:st.ms;half=ema>14||(half&&ema>=9);lastG=g;
        }
      }
      if(force||LIFTED.some(k=>Math.abs(s.shares[k]-lastShares[k])>1e-4)){
        for(const [el,piece] of pieces)el.setAttribute('transform',`translate(0 ${(data.zPx*data.travel[piece]*s.shares[piece]).toFixed(2)})`);
        armSvg.style.transform=s.shares.top?`translateY(${(100*data.zPx*data.travel.top*s.shares.top/data.H).toFixed(3)}%)`:'';
        lastShares=s.shares;
      }
      const brain=s.lit.toFixed(3),du=String(+u.toFixed(4)),apart=String(+s.shares.top.toFixed(3));
      if(brain!==lastBrain)stage.style.setProperty('--brain',lastBrain=brain);
      if(du!==lastU)stage.dataset.u=lastU=du;
      if(apart!==lastApart)stage.dataset.apart=lastApart=apart;
      force=false;
      if(pin&&host==='hero'){if(light)light.draw(s);else if(!lightTried)createLight();}
      return more;
    }
    function paintText(ui){
      const exit=pinned.matches?stateAt(ui).exit.toFixed(4):'0',p=ui.toFixed(4),c=chapterAt(ui);
      if(exit!==lastExit)landing.style.setProperty('--exit',lastExit=exit);
      if(p!==lastP)landing.style.setProperty('--p',lastP=p);
      if(c!==chapter){
        chapter=c;landing.dataset.chapter=c;count.textContent=`0${c} / 04`;
        for(const el of [...captions,...rail])Number(el.dataset.chapter)===c?el.setAttribute('aria-current','step'):el.removeAttribute('aria-current');
      }
      const next=readoutAt(ui);
      if(next!==text)readout.textContent=text=next;
      const on=String(still===REDUCED_U);
      if(on!==pressed)inspect.setAttribute('aria-pressed',pressed=on);
    }
    function frame(now){
      raf=0;
      const dt=last?Math.min((now-last)/1000,1/30):1/60;last=now;
      if(needFit){needFit=false;fitBerths();}
      const {motion}=props.current,pin=pinned.matches;
      uT=target();
      if(stage)route(now);
      let more=false;
      if(host==='hero'){
        if(motion){u=visible(hostEl)?follow(u,uT,dt):uT;more=u!==uT;}
      }else if(anim){
        const t=Math.min(1,(now-anim.t0)/MOVE_MS);
        u=anim.from+(anim.to-anim.from)*smooth(t);
        if(t<1)more=true;else anim=null;
      }
      if(stage&&draw(pin))more=true;
      paintText(host==='hero'&&motion?u:uT);
      if(more)kick();else last=0;
    }

    function click(event){
      const button=event.target.closest('.story-rail button,.assembly-control,a[href="#work"]');
      if(!button)return;
      if(button.matches('.assembly-control')){still=still===REDUCED_U?0:REDUCED_U;if(host==='hero')u=still;kick();return;}
      if(button.matches('a')){
        // Instant jump so it never scrubs the story; toggling scroll-behavior raced the native smooth scroll.
        event.preventDefault();
        history.pushState(null,'','#work');
        document.getElementById('work').scrollIntoView({behavior:'instant'});
        return;
      }
      if(!pinned.matches)return;
      const jump=CHAPTERS[button.dataset.chapter-1].jump,r=landing.getBoundingClientRect();
      scrollTo({top:scrollY+r.top+jump*(r.height-innerHeight),behavior:props.current.motion?'smooth':'instant'});
    }
    const fit=()=>{needFit=true;kick();};
    function media(){if(stage){place();force=true;}fit();}
    function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else kick();}
    const io=new IntersectionObserver(kick);
    io.observe(slot);
    sync.current=()=>{
      still=REDUCED_U;
      if(props.current.reduced&&host==='hero')u=REDUCED_U;
      if(!props.current.motion&&anim){u=anim.to;anim=null;}
      force=Boolean(stage);kick();
    };
    landing.addEventListener('click',click);
    addEventListener('scroll',kick,{passive:true});addEventListener('resize',fit);pinned.addEventListener('change',media);
    document.addEventListener('visibilitychange',visibility);
    document.fonts?.ready.then(fit);
    uT=u=target();
    kick();
    if(import.meta.env.DEV)window.__robot={get u(){return u;},get uT(){return uT;},get host(){return host;},get ms(){return ema;}};

    Promise.all([import('./robot.json'),import('../../scripts/anatomy/turn.mjs'),import('./turn.css'),pinned.matches&&loadLight()]).then(([json,{TURN}])=>{
      if(disposed)return;
      data=json.default;
      const [,,pw,ph]=data.crop.phone,[,,dw,dh]=data.crop.dock;
      landing.style.setProperty('--phone-aspect',(pw/ph).toFixed(4));
      document.documentElement.style.setProperty('--dock-aspect',(dw/dh).toFixed(4));
      stage=document.createElement('div');
      stage.className='robot-stage iso';
      stage.dataset.theme='dark';stage.dataset.host='hero';
      stage.setAttribute('role','img');stage.setAttribute('aria-label',data.label);
      stage.style.setProperty('--vb-w',data.W);stage.style.setProperty('--vb-h',data.H);
      const view=`viewBox="0 0 ${data.W} ${data.H}" aria-hidden="true"`;
      stage.innerHTML=`<svg class="iso-svg robot-back" ${view}>${data.back}</svg><svg class="iso-svg robot-body" ${view}>${data.body}</svg>${data.arm}`;
      armSvg=stage.querySelector('svg[data-live]');armSvg.classList.add('robot-arm');
      pieces=[...stage.querySelectorAll('.robot-body [data-piece]')].map(el=>[el,el.dataset.piece]).filter(([,piece])=>data.travel[piece]);
      place();
      slot.append(stage);
      ctrl=TURN.mount(stage,data.turn);
      if(props.current.motion)stage.animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out'});
      needFit=true;force=true;kick();
    });

    return()=>{
      disposed=true;cancelAnimationFrame(raf);sync.current=null;
      ctrl?.destroy();light?.destroy();stage?.remove();io.disconnect();
      landing.removeEventListener('click',click);
      removeEventListener('scroll',kick);removeEventListener('resize',fit);pinned.removeEventListener('change',media);
      document.removeEventListener('visibilitychange',visibility);
      if(import.meta.env.DEV)delete window.__robot;
    };
  },[]);
  useEffect(()=>{sync.current?.();},[motion,reduced]);
}
