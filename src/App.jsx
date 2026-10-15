import { useEffect, useState } from 'react';
import { profile } from './data/profile.js';
import ProjectShowcase from './components/ProjectShowcase.jsx';

const Arrow=()=> <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>;
const email=`mailto:${profile.email}?subject=Let%E2%80%99s%20build%20something%20useful`;
export default function App(){
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const preference=()=>setReduced(media.matches);
    media.addEventListener('change',preference);
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}
    }),{threshold:.15});
    document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
    return()=>{observer.disconnect();media.removeEventListener('change',preference);};
  },[]);
  return <div className={paused||reduced?'portfolio motion-still':'portfolio'}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="header wrap"><a className="identity" href="#home">Shivam Chavan<span>AI engineering & robotics</span></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#experience">Experience</a><a href="/shivam-chavan-resume.pdf" target="_blank" rel="noreferrer">Résumé <Arrow/></a><a href="#contact">Contact</a></nav></header>
    <main id="main-content">
      <section className="hero wrap" id="home" aria-labelledby="hero-title">
        <div className="hero-main"><h1 id="hero-title">AI, put<br/>to work.</h1><div className="hero-description"><p>I’m Shivam, a Senior AI Engineer building intelligent software and robots that learn.</p><p className="secondary">From language models to the physical world. Based in Dubai.</p><a className="button" href="#work">View selected work <Arrow/></a></div></div>
        <div className="hero-projects">{[profile.projects[0],profile.projects[1],profile.projects[3]].map(project=><a href={`#${project.id}`} key={project.id} className="project-preview"><div><img src={project.image} alt="" width="480" height="240"/></div><span>{project.name}<Arrow/></span></a>)}</div>
        <div className="hero-foot"><span>Previously Intelimek Systems & Tata Elxsi</span><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a></div>
      </section>
      <section className="work" id="work" aria-labelledby="work-title"><div className="wrap">
        <div className="section-heading"><div><h2 id="work-title" data-reveal>Selected work.</h2><p data-reveal>Language. Learning. Action.<br/>Different problems, connected thinking.</p></div><button className="motion-button" onClick={()=>setPaused(!paused)} disabled={reduced} aria-pressed={paused||reduced}>{reduced?'Reduced motion':paused?'Resume motion':'Pause motion'}<span aria-hidden="true">{paused||reduced?'▷':'Ⅱ'}</span></button></div>
        <ProjectShowcase motion={!paused&&!reduced}/>
        <div className="more-work"><div className="more-heading"><h3 data-reveal>Further explorations.</h3><a className="text-link" href={profile.github} target="_blank" rel="noreferrer">All repositories <Arrow/></a></div>{profile.repositories.map(repo=><a className="repo-row" key={repo.url} href={repo.url} target="_blank" rel="noreferrer" data-reveal><strong>{repo.name}</strong><p>{repo.description}</p><Arrow/></a>)}</div>
      </div></section>
      <section className="experience wrap section-space" id="experience" aria-labelledby="experience-title"><div className="section-heading"><h2 id="experience-title" data-reveal>Built in practice.</h2><p data-reveal>From production inspection systems<br/>to autonomous robotics.</p></div><div className="experience-list">{profile.experience.map(item=><article className="experience-row" key={item.company} data-reveal><div><h3>{item.company}</h3><p className="secondary">{item.period}</p></div><div><p className="role">{item.role}</p><p>{item.description}</p></div></article>)}</div></section>
      <section className="about section-space" id="about" aria-labelledby="about-title"><div className="wrap about-grid"><div><h2 id="about-title" data-reveal>Both sides<br/>of intelligence.</h2><p className="about-intro" data-reveal>{profile.introduction}</p><a className="text-link" href="/shivam-chavan-resume.pdf" target="_blank" rel="noreferrer">Read my résumé <Arrow/></a></div><div className="about-details"><div className="skills">{profile.skills.map(skill=><div key={skill.area} data-reveal><h3>{skill.area}</h3><p>{skill.tools}</p></div>)}</div><div className="background-details"><h3>Education & research</h3><div>{profile.education.map(item=><div key={item.school}><h3>{item.school}</h3><p>{item.degree}</p><p className="secondary">{item.period}</p></div>)}<h3>Published research</h3>{profile.publications.map(title=><p key={title}>{title}</p>)}<p className="secondary">IJERT · May 2025 · Vol. 14, Issue 05</p></div></div></div></div></section>
      <section className="contact wrap section-space" id="contact" aria-labelledby="contact-title"><div className="contact-top"><a href={email} className="contact-title" aria-label="Email Shivam Chavan"><h2 id="contact-title" data-reveal>Let’s build<br/>what’s next.</h2><Arrow/></a><p data-reveal>AI engineering. Robotics. A good problem to solve.</p></div><a className="email-link" href={email}>{profile.email}</a><div className="contact-links"><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="/shivam-chavan-resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a></div><footer><span>{profile.name}</span><span>{profile.location}</span><a href="#home">Back to top ↑</a></footer></section>
    </main>
  </div>;
}
