// SC-01 floor light (spec §4, §6.4): the status pool round the chassis and two scroll-linked safety-lidar sweeps,
// painted on the floor plane (z 0) in world space through the kit camera, so they register with the drawn floor marks.
// White only, tonemapped and dithered, premultiplied with alpha = max channel; CSS screen-blends the canvas.
import { glLayer } from '../../scripts/anatomy/gl.mjs';

const POOL = 90; // status pool reaches 0 this far outside the footprint (world units)
const REACH = 160; // lidar sweep reaches 0 this far from the lidar

const FRAGMENT = `
#define PI 3.14159265
#define TAU 6.28318531
uniform float uStatus;
uniform float uScan;
uniform float uSweep;
uniform vec4 uFoot;
uniform float uFootR;
uniform vec4 uLidarA;
uniform vec4 uLidarB;
float footDist(vec2 p){vec2 q=abs(p-uFoot.xy)-uFoot.zw+uFootR;return length(max(q,0.))+min(max(q.x,q.y),0.)-uFootR;}
float sweepOf(vec2 p,vec4 L,float px){
  vec2 v=p-L.xy;
  float r=length(v);
  float radial=smoothstep(6.,14.,r)*(1.-smoothstep(110.,${REACH}.,r));
  if(radial<=0.)return 0.;
  float phi=atan(v.y,v.x);
  float fov=1.-smoothstep(L.w-.0698,L.w+.0698,abs(mod(phi-L.z+PI,TAU)-PI));
  float behind=mod(L.z+uSweep-phi,TAU);
  float lead=1.-smoothstep(TAU-1.5*px/r,TAU,behind);
  float swept=1.-smoothstep(uSweep-.15,uSweep+1e-4,behind);
  return radial*fov*lead*swept*exp(-behind/.6);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onFloor(vb,0.);
  float px=pixelOf()/uCam.z;
  float d=footDist(p.xy);
  float e=0.;
  if(uStatus>1e-3)e+=uStatus*.16*exp(-d*d/2312.)*(1.-smoothstep(60.,${POOL}.,d))*smoothstep(-4.,6.,d);
  if(uScan>1e-3)e+=uScan*.22*(sweepOf(p.xy,uLidarA,px)+sweepOf(p.xy,uLidarB,px))*smoothstep(0.,8.,d);
  vec2 edge=min(vb,uView-vb);
  e*=smoothstep(16.,40.,min(edge.x,edge.y));
  vec3 col=tonemap(vec3(e),1.);
  float n=(hash12(gl_FragCoord.xy)+hash12(gl_FragCoord.yx*1.37)-1.)/255.;
  col=max(col+n*smoothstep(0.,1.5/255.,col.r),0.);
  gl_FragColor=vec4(col,col.r);
}`;

const DEG = Math.PI / 180;
const lidarOf = (l) => [l.at[0], l.at[1], l.heading * DEG, (l.fov / 2) * DEG];

// gl: the robot.json gl block. Returns null without WebGL or on a compile error.
export function createFloorLight(canvas, gl) {
  const f = gl.footprint;
  const layer = glLayer({
    canvas,
    fragment: FRAGMENT,
    view: [gl.W, gl.H],
    camera: gl.camera,
    uniforms: ['uStatus', 'uScan', 'uSweep'],
    fixed: { uFoot: [f.x + f.w / 2, f.y + f.d / 2, f.w / 2, f.d / 2], uFootR: f.r, uLidarA: lidarOf(gl.lidars[0]), uLidarB: lidarOf(gl.lidars[1]) },
    maxRatio: 1.5,
    onError: () => {},
  });
  if (!layer) {
    canvas.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext(); // a failed compile still holds a context
    return null;
  }
  // Scissor to the lit floor's viewBox box (footprint + POOL, lidar discs of REACH, 16 vb edge margin): about a quarter of the canvas.
  const { origin: [ox, oy], k, cam: [sA, cA, sE] } = gl.camera;
  const at = (x, y) => [ox + k * (x * sA - y * cA), oy + k * (x * cA + y * sA) * sE];
  const pts = gl.lidars.flatMap(({ at: [x, y] }) => {
    const [cx, cy] = at(x, y);
    return [[cx - REACH * k, cy - REACH * k * sE], [cx + REACH * k, cy + REACH * k * sE]];
  });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(at(f.x + f.w / 2 + sx * (f.w / 2 + POOL), f.y + f.d / 2 + sy * (f.d / 2 + POOL)));
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const box = [Math.max(16, Math.min(...xs)), Math.max(16, Math.min(...ys)), Math.min(gl.W - 16, Math.max(...xs)), Math.min(gl.H - 16, Math.max(...ys))];
  const g = layer.gl;
  g.enable(g.SCISSOR_TEST);
  const scissor = () => {
    const sx = canvas.width / gl.W;
    const sy = canvas.height / gl.H;
    const x0 = Math.floor(box[0] * sx);
    const y0 = Math.floor(canvas.height - box[3] * sy);
    g.scissor(x0, y0, Math.ceil(box[2] * sx) - x0 + 1, Math.ceil(canvas.height - box[1] * sy) - y0 + 1);
  };
  let last = null;
  let dead = false;
  const clear = () => {
    if (dead) return;
    layer.clear();
    last = null;
  };
  // Safe to call every frame: redraws only when an input or the canvas box changed by more than 1e-3.
  const draw = ({ status, scan, sweep }) => {
    if (dead) return;
    if (status + scan < 1e-3) return clear();
    const key = [status, scan, sweep, canvas.clientWidth, canvas.clientHeight];
    if (last && key.every((v, i) => Math.abs(v - last[i]) <= 1e-3)) return;
    last = key;
    const values = { uStatus: status, uScan: scan, uSweep: sweep * DEG };
    const [w, h] = [canvas.width, canvas.height];
    scissor();
    layer.draw(values, 0);
    if (canvas.width !== w || canvas.height !== h) {
      scissor(); // draw() just resized the canvas; redo at the new size
      layer.draw(values, 0);
    }
  };
  const destroy = () => {
    dead = true;
    layer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  return { draw, clear, destroy };
}
