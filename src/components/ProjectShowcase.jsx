import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile.js';

function ProjectMedia({project, motion, active = true}) {
  const image = useRef(null);
  useEffect(()=>{
    const element=image.current;
    if(!project.animation || !motion || !active) {element.src=project.image;return;}
    let visible=false;
    const visibility=()=>{element.src=visible&&!document.hidden?project.animation:project.image;};
    const observer=new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;visibility();});
    observer.observe(element);
    document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);element.src=project.image;};
  },[project,motion,active]);
  return <img ref={image} src={project.image} alt={project.alt} width="1440" height="1000" loading="lazy" decoding="async"/>;
}

export default function ProjectShowcase({motion}) {
  const root=useRef(null);
  const [active,setActive]=useState(0);
  useEffect(()=>{
    const element=root.current;
    const chapters=[...element.querySelectorAll('.project-chapter')];
    let frame=0;
    function update(){
      frame=0;
      let closest=0,distance=Infinity;
      chapters.forEach((chapter,index)=>{
        const rect=chapter.getBoundingClientRect();
        const delta=Math.abs(rect.top+rect.height*.4-innerHeight*.5);
        if(delta<distance){distance=delta;closest=index;}
      });
      setActive(closest);
      const rect=chapters[closest].getBoundingClientRect();
      const progress=Math.max(-1,Math.min(1,(innerHeight*.5-rect.top)/rect.height-.5));
      element.style.setProperty('--pitch',`${motion?progress*-7:0}deg`);
      element.style.setProperty('--yaw',`${motion?progress*5:0}deg`);
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    update();
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[motion]);
  const project=profile.projects[active];
  return <div className="showcase" ref={root}>
    <div className="project-narrative">{profile.projects.map((item,index)=><article className={`project-chapter ${index===active?'is-current':''}`} id={item.id} key={item.id} aria-labelledby={`${item.id}-title`}>
      <h3 id={`${item.id}-title`} data-reveal>{item.name}</h3>
      <p className="project-discipline" data-reveal>{item.category}</p>
      <p className="project-intro" data-reveal>{item.description}</p>
      <ul className="project-points">{item.points.map(point=><li key={point}>{point}</li>)}</ul>
      <div className="mobile-project-media"><ProjectMedia project={item} motion={motion}/><p>{item.caption}</p></div>
      <div className="project-actions"><a className="text-link" href={item.repository} target="_blank" rel="noreferrer">Explore the repository <span aria-hidden="true">↗</span></a><details><summary>Inside the project <span aria-hidden="true">+</span></summary><p>{item.detail}</p></details></div>
      <p className="project-stack">{item.stack.join(' / ')}</p>
    </article>)}</div>
    <div className="project-stage">
      <div className="stage-top"><span>From the projects</span><span aria-live="polite">{project.name}</span></div>
      <div className="project-canvas">{profile.projects.map((item,index)=><div className={`project-slide ${index===active?'is-active':''}`} key={item.id} aria-hidden={index!==active}><ProjectMedia project={item} motion={motion} active={index===active}/></div>)}</div>
      <div className="stage-caption"><p>{project.caption}</p><a href={project.repository} target="_blank" rel="noreferrer" aria-label={`View ${project.name} source on GitHub`}>Source ↗</a></div>
      <nav className="project-selector" aria-label="Featured projects">{profile.projects.map((item,index)=><a href={`#${item.id}`} key={item.id} aria-current={index===active?'location':undefined}>{item.name}</a>)}</nav>
    </div>
  </div>;
}
