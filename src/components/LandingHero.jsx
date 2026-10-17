import { CHAPTERS } from '../robot/pose.js';
import { profile } from '../data/profile.js';
import '../anatomy/geometry.css';

const Arrow=()=> <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>;
const captions=[
  ['It starts with a sentence.','“Show me the work.” A language model turns plain words into a short plan, and software checks the plan before anything moves.'],
  ['Every part has a job.','Power, compute, sensing and motion. The model runs on board, the sensors feed it, and the arm carries out what it decides.'],
  ['It looks before it moves.','Lidar maps the space around it and the camera finds what matters. Perception turns pixels into places.'],
  ['Then it does the work.','Each joint follows the checked plan, one step at a time. I train this kind of behaviour in simulation first.'],
];

// Markup only: useRobot (called in App) owns data-chapter, --exit, --p, aria-current, the readout and every click handler.
export default function LandingHero({reduced,onPause,paused}){
  return <section className={reduced?'landing landing-reduced':'landing'} id="home" aria-labelledby="hero-title">
    <div className="hero-sticky"><div className="hero-frame">
      <div className="robot-slot" data-robot-slot="hero"/>
      <div className="hero-toolbar">
        <p className="hero-location"><span aria-hidden="true"/>Senior AI Engineer <span className="location-divider" aria-hidden="true">/</span> Dubai, UAE</p>
        <a className="skip-intro" href="#work">Skip intro <span aria-hidden="true">↓</span></a>
        <button className="motion-button" onClick={onPause} disabled={reduced} aria-pressed={paused||reduced}>{reduced?'Reduced motion':paused?'Resume motion':'Pause motion'}<span aria-hidden="true">{paused||reduced?'▷':'Ⅱ'}</span></button>
      </div>
      <div className="hero-copy">
        <h1 id="hero-title" aria-label="AI, put to work."><span className="headline-line"><span>AI, put</span></span><span className="headline-line"><span>to work.</span></span></h1>
        <div className="hero-description"><p>I’m Shivam. I build intelligent software and robots that learn.</p><p className="secondary">Connecting language, perception, and action.<br/>From the first prototype to the physical world.</p><a className="button" href="#work">View selected work <Arrow/></a></div>
        <div className="hero-foot"><div><span>Previously building at</span><strong>Intelimek Systems <span>&</span> Tata Elxsi</strong></div><a href={profile.github} target="_blank" rel="noreferrer">Find me on GitHub ↗</a></div>
      </div>
      <nav className="story-rail" aria-label="Story chapters">
        <span className="rail-count">00 / 04</span><span className="rail-line" aria-hidden="true"/>
        {CHAPTERS.map((chapter,index)=><button type="button" key={chapter.id} data-chapter={index+1} style={{'--at':chapter.jump}} aria-label={`Chapter ${index+1} of 4: ${chapter.name}`}/>)}
      </nav>
      <div className="story">
        <ol className="story-captions">{captions.map(([title,body],index)=><li className="story-caption" data-chapter={index+1} key={title}>
          <p className="story-index">0{index+1} — {CHAPTERS[index].name}</p><h2 className="story-title">{title}</h2><p>{body}</p>
          {index===3&&<a className="story-link" href="#work">See the work <span aria-hidden="true">↓</span></a>}
        </li>)}</ol>
        <output className="robot-readout" aria-live="off"/>
        <p className="robot-label">SC-01 · mobile manipulator · illustrative study</p>
        <button className="assembly-control" type="button" aria-pressed="true">Inspect assembly <span aria-hidden="true">↗</span></button>
      </div>
    </div></div>
  </section>;
}
