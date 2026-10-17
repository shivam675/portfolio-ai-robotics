import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, follow, separationAt, flightAt } from '../src/anatomy/motion.js';
import { KEYS, DOCK, CHAPTERS, RANGES, REDUCED_U, stateAt, groupsOf, chapterAt, readoutAt, sampleU } from '../src/robot/pose.js';

test('elements enter from an edge, settle for reading, and leave through the opposite edge',()=>{
  assert.equal(flightAt(1100,200,900),1);
  assert.equal(flightAt(900,200,900),1);
  assert.equal(flightAt(300,200,900),0);
  assert.equal(flightAt(100,200,900),0);
  assert.ok(flightAt(0,200,900)<0);
  assert.equal(flightAt(-200,200,900),-1);
  assert.equal(flightAt(-2000,200,900),-1);
});

test('native scroll maps into a bounded assembly reveal',()=>{
  assert.equal(separationAt(112,1575,900),0);
  assert.equal(separationAt(-337.5,1575,900),.5);
  assert.equal(separationAt(-675,1575,900),1);
  assert.equal(separationAt(-1200,1575,900),1);
  assert.ok(Number.isFinite(separationAt(-100,900,900)));
  assert.equal(clamp(-1),0);
  assert.equal(clamp(2),1);
});

test('motion settles in either direction with the same timing at 60 and 120 Hz',()=>{
  const advance=(hz,target)=>{
    let value=1-target;
    for(let i=0;i<hz;i++)value=follow(value,target,1/hz);
    return value;
  };
  for(const target of [0,1]){
    assert.ok(Math.abs(advance(60,target)-advance(120,target))<1e-10);
    let value=advance(60,target);
    for(let i=0;i<120;i++)value=follow(value,target,1/60);
    assert.equal(value,target);
  }
  assert.ok(follow(0,1,10)<.2,'a resumed tab must not jump in one frame');
});

// SC-01 pose contract (spec §8.1)
const EPS=1e-9;
const grid=(a,b,n=1e4)=>Array.from({length:Math.round((b-a)*n)+1},(_,i)=>Math.round(a*n+i)/n);
const channels=u=>{const {values,shares,...rest}=stateAt(u);return {...values,...shares,...rest};};
const ARM=['J1','J2','J3','tau','grip'];
const KEY_U={STOW:0,READY:.24,POINT:1,WORK:DOCK.work,EXPERIENCE:DOCK.experience,ABOUT:DOCK.about,CONTACT:DOCK.contact};

test('sampleU is ascending, keeps key and hold edges, and never jumps more than 0.3° or 0.2 u',()=>{
  const us=sampleU();
  assert.equal(us[0],0);
  assert.equal(us.at(-1),2);
  for(let i=1;i<us.length;i++)assert.ok(us[i]>us[i-1],`not ascending at ${us[i]}`);
  for(const edge of [...Object.values(KEY_U),...CHAPTERS.flatMap(c=>c.hold)])assert.ok(us.includes(edge),`edge ${edge} missing`);
  let last=groupsOf(stateAt(us[0]).values);
  for(const u of us.slice(1)){
    const g=groupsOf(stateAt(u).values);
    for(const n of ['yaw','sh','el','wr','pan'])assert.ok(Math.abs(g[n]-last[n])<=.3+EPS,`${n} jumps ${Math.abs(g[n]-last[n])}° at u ${u}`);
    for(const n of ['fA','fB','capJ2','capJ3'])assert.ok(Math.abs(g[n]-last[n])<=.2+EPS,`${n} jumps ${Math.abs(g[n]-last[n])} at u ${u}`);
    last=g;
  }
});

test('every sampled hinge value lies inside RANGES',()=>{
  for(const u of sampleU()){
    const g=groupsOf(stateAt(u).values);
    for(const [n,[lo,hi]] of Object.entries(RANGES))assert.ok(g[n]>=lo-EPS&&g[n]<=hi+EPS,`${n} ${g[n]} outside [${lo}, ${hi}] at u ${u}`);
  }
});

test('lift shares nest top ≥ compute ≥ battery and the arm stays at READY while any share is open',()=>{
  for(const u of grid(0,2)){
    const {values,shares:s}=stateAt(u);
    assert.ok(s.top>=s.compute-EPS&&s.compute>=s.battery-EPS,`shares out of order at u ${u}`);
    if(s.top>0||s.compute>0||s.battery>0)for(const n of ARM)assert.ok(Math.abs(values[n]-KEYS.READY[n])<=EPS,`${n} ${values[n]} moves while apart at u ${u}`);
  }
  assert.equal(stateAt(.5).shares.top,1);
});

test('every channel is constant inside the rest pose and each chapter hold',()=>{
  for(const [a,b] of [[0,.04],...CHAPTERS.map(c=>c.hold)]){
    const start=channels(a);
    for(const u of grid(a,b,1e3)){
      const now=channels(u);
      for(const n in start)assert.ok(Math.abs(now[n]-start[n])<=EPS,`${n} moves in hold [${a}, ${b}] at u ${u}`);
    }
  }
});

test('stateAt lands exactly on each key, and J4 follows the tool rule inside its range',()=>{
  for(const [name,u] of Object.entries(KEY_U)){
    const key=KEYS[name],v=stateAt(u).values;
    for(const n of ['J1','J2','J3','tau','grip','pan'])assert.ok(Math.abs(v[n]-key[n])<=EPS,`${name} ${n} is ${v[n]}, want ${key[n]}`);
    const J4=key.tau-180-key.J2-key.J3;
    assert.ok(Math.abs(v.J4-J4)<=EPS,`${name} J4 is ${v.J4}, want ${J4}`);
    assert.ok(J4>=RANGES.wr[0]&&J4<=RANGES.wr[1],`${name} J4 ${J4} outside wr range`);
  }
});

// §8.1 says scan is 0 from .60, but §2.3 holds scan at 1 over [.62, .70] and closes it by .74; pose.js follows §2.3.
test('the robot is assembled and dark after Perception',()=>{
  for(const u of grid(.6,2)){
    const s=stateAt(u);
    assert.deepEqual([s.shares.battery,s.shares.compute,s.shares.top,s.lit].map(x=>Math.abs(x)<=EPS),[true,true,true,true],`apart or lit at u ${u}`);
    if(u>=.74)assert.ok(Math.abs(s.scan)<=EPS,`scan ${s.scan} at u ${u}`);
  }
});

test('the lidar sweep only turns forward over Perception',()=>{
  let last=-Infinity;
  for(const u of grid(.58,.72)){
    const {sweep}=stateAt(u);
    assert.ok(sweep>=last,`sweep goes back at u ${u}`);
    last=sweep;
  }
  assert.equal(stateAt(.58).sweep,0);
  assert.equal(stateAt(.72).sweep,720);
});

test('captions change at the chapter thresholds and the readout follows the chapter',()=>{
  const expect=[[0,0],[.1199,0],[.12,1],[.2399,1],[.24,2],[.4999,2],[.5,3],[.7549,3],[.755,4],[1,4],[2,4]];
  for(const [u,c] of expect)assert.equal(chapterAt(u),c,`chapterAt(${u})`);
  assert.equal(readoutAt(0),'Parked · J2 −40° · J3 85°');
  assert.match(readoutAt(.86),/^J1/);
});

test('each rail jump shows its own chapter, and the reduced still frame shows Anatomy',()=>{
  assert.equal(chapterAt(REDUCED_U),2);
  CHAPTERS.forEach((c,i)=>assert.equal(chapterAt(c.jump),i+1,`${c.name} jump ${c.jump}`));
});
