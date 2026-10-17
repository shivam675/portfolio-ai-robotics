import { useEffect } from 'react';
import { flightAt, follow } from './anatomy/motion.js';

export default function useScrollMotion(enabled){
  useEffect(()=>{
    const items=[...document.querySelectorAll('[data-flight]')].map(element=>({element,value:0,target:0,visible:false}));
    const paint=item=>item.element.style.setProperty('--flight',item.value);
    if(!enabled){items.forEach(paint);return;}
    let frame=0,last=0;
    function tick(now){
      frame=0;
      const seconds=last?(now-last)/1000:1/60;
      last=now;
      for(const item of items){
        if(item.value===item.target)continue;
        item.value=item.visible?follow(item.value,item.target,seconds):item.target;
        paint(item);
      }
      if(!document.hidden&&items.some(item=>item.value!==item.target))frame=requestAnimationFrame(tick);
    }
    function measure(){
      for(const item of items){
        // Measure the stable wrapper; only its child travels.
        const bounds=item.element.getBoundingClientRect();
        item.target=flightAt(bounds.top,bounds.height,innerHeight);
        item.visible=bounds.bottom>0&&bounds.top<innerHeight;
        if(!item.visible){item.value=item.target;paint(item);}
      }
      if(!frame&&!document.hidden&&items.some(item=>item.value!==item.target)){last=0;frame=requestAnimationFrame(tick);}
    }
    function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else measure();}
    const resize=new ResizeObserver(measure);
    resize.observe(document.body);
    window.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
    document.addEventListener('visibilitychange',visibility);
    measure();
    return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',visibility);};
  },[enabled]);
}
