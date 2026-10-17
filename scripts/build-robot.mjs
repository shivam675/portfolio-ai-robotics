// SC-01 landing robot: an illustrative mobile manipulator, not a shipped product.
// Builds src/robot/robot.json, src/robot/turn.css and src/anatomy/geometry.css (spec docs/redesign/robot-landing-spec.md).
// Flags: --audit [--quick] [--only=a,b] [--verbose]   --verify (writes scripts/.out/robot-verify.html). A failing build assert exits 1 (after writing).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import * as k from './anatomy/iso-kit.mjs';
import * as G from './anatomy/lathe.mjs';
import * as A from './anatomy/audit.mjs';
import { turning, sampleShape } from './anatomy/turn-build.mjs';
import * as TA from './anatomy/turn-audit.mjs';
import { glCamera } from './anatomy/gl.mjs';
import { TRAVEL, RANGES, stateAt, groupsOf, sampleU, liftStates, fk } from '../src/robot/pose.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const argv = process.argv.slice(2);
const MAIN = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

const W = 1200;
const H = 800;
const FIT = [470, 64, 1150, 690];
const AZ = 40;
const EL = 30;
const LIFT_ARM = TRAVEL.top; // the live arm SVG and the mast ride the deck lid
const CHASSIS = { x: -120, y: -75, w: 240, d: 150, r: 18 };
const BAY = { x: -200, y: -150, w: 400, d: 300 };
const S = [40, 0, 172];
const E = [40, 0, 282];
const WR = [140, 0, 282];
const MAST = [-98, -53];
const LIDARS = [{ at: [120, -75, 30], heading: -35, fov: 270 }, { at: [-120, 75, 30], heading: 145, fov: 270 }];
export const follow = (values) => values;

const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const VERT = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const AXIS = {
  x: (o, sign = 1) => G.frameOf(o, [sign, 0, 0], [0, 1, 0], [0, 0, sign]),
  y: (o, sign = 1) => G.frameOf(o, [0, sign, 0], [1, 0, 0], [0, 0, -sign]),
  z: (o, sign = 1) => G.frameOf(o, [0, 0, sign], [1, 0, 0], [0, sign, 0]),
};
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

// ---------------------------------------------------------------- static parts (89)
function statics(P, R) {
  const at = (p) => k.iso(p, P);
  const put = (name, piece, layer, centre, shapes, svg) => R.put({ name, piece, layer, at: centre, move: [0, 0, TRAVEL[piece] ?? 0], svg, shapes: shapes.map((s, i) => R.solid(Object.assign(s, { name: s.name ?? (i ? `${name}#${i + 1}` : name) }))) });
  const box = (name, piece, plan, z, h, o = {}) => {
    const paths = k.slabOf(plan, z, h, P, o.steps ?? 4, o.bevel ?? 0);
    const svg = k.solidSvg(paths, { tone: o.tone ?? 'mid', crease: o.crease ?? 'faint', lit: o.lit, inner: o.inner ?? '' }) + (o.after ?? '');
    put(name, piece, o.layer ?? 'body', [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], [A.slab(plan, z, h, { ground: o.ground }, o.steps ?? 4)], svg);
  };
  const cyl = (name, piece, cx, cy, r, z, h, o = {}) => {
    const svg = k.solidSvg(k.cylinder(cx, cy, r, z, h, P, o.steps ?? 28, o.bevel ?? 0), { tone: o.tone ?? 'mid', crease: o.crease ?? 'faint', inner: o.inner ?? '' }) + (o.after ?? '');
    put(name, piece, 'body', [cx, cy, z + h / 2], [A.cylinder(cx, cy, r, z, h, { ground: o.ground })], svg);
  };
  const disc = (name, piece, F, s0, s1, r, o = {}) => {
    const svg = k.solidSvg(G.disc(s0, s1, r, F, P), { tone: o.tone ?? 'mid', crease: o.crease ?? 'faint', inner: o.inner ?? '' }) + (o.after ?? '');
    put(name, piece, 'body', G.pointOf(F, (s0 + s1) / 2, 0, 0), [A.disc(F, s0, s1, r, { ground: o.ground })], svg);
  };
  const ring = (cx, cy, r, z, steps = 18) => k.ring(cx, cy, r, z, P, steps);
  const onFace = (pts) => k.pathOf(pts.map((p) => at(p)), true);
  const slot = (axis, c, a0, a1, z0, z1) => onFace(axis === 'x' ? [[c, a0, z0], [c, a1, z0], [c, a1, z1], [c, a0, z1]] : [[a0, c, z0], [a1, c, z0], [a1, c, z1], [a0, c, z1]]);
  const screws = (pts, z, ringR = 0) => (ringR ? L(pts.map(([x, y]) => ring(x, y, ringR, z, 14)).join(''), { tone: 'lo' }) : '') + D(pts.map(([x, y]) => at([x, y, z])), { size: 0.5 });

  // Floor (back): four tape corners round a 400 x 300 bay, and a ruler strip with 50 mm ticks.
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const cx = sx * 200;
      const cy = sy * 150;
      const tape = [[cx, cy], [cx - sx * 44, cy], [cx - sx * 44, cy - sy * 5], [cx - sx * 5, cy - sy * 5], [cx - sx * 5, cy - sy * 44], [cx, cy - sy * 44]];
      const svg = L(k.onTop(tape, 0, P, true), { tone: 'lo' }) + L(k.onTop([[cx - sx * 5, cy - sy * 5], [cx, cy]], 0, P), { tone: 'faint' });
      put(`floor.tape.${sx > 0 ? 'f' : 'r'}${sy > 0 ? 'l' : 'r'}`, 'base', 'back', [cx, cy, 0], [A.extruded(tape, 0, 0.3, { ground: true })], svg);
    }
  {
    const strip = { x: 206, y: -122, w: 8, d: 244, r: 1 };
    const t = k.topTicks(-112.5, 112.5, 25, 4, strip.x, 0.6, [3, 5.6], P, 'y');
    const svg = k.solidSvg(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }) + L(t.minor, { tone: 'lo' }) + L(t.major, { tone: 'mid' }) + screws([[210, -118], [210, 118]], 0.6);
    put('floor.ruler', 'base', 'back', [210, 0, 0.3], [A.slab(strip, 0, 0.6, { ground: true }, 3)], svg);
  }

  // Chassis tub (base, lift 0).
  box('chassis.plate', 'base', CHASSIS, 8, 4, { steps: 8, tone: 'mid', bevel: 0.8, inner: L(k.sideSeam(CHASSIS, 10, P, 8), { tone: 'faint' }) });
  const WALL = [
    ['front', { x: 114, y: -57, w: 6, d: 114, r: 0 }, [1, 0]],
    ['rear', { x: -120, y: -57, w: 6, d: 114, r: 0 }, [-1, 0]],
    ['left', { x: -102, y: 69, w: 204, d: 6, r: 0 }, [0, 1]],
    ['right', { x: -102, y: -75, w: 204, d: 6, r: 0 }, [0, -1]],
  ];
  for (const [side, plan, [nx, ny]] of WALL) {
    const visibleOut = nx * 0.766 + ny * 0.643 > 0;
    const face = visibleOut ? (nx ? plan.x + (nx > 0 ? plan.w : 0) : plan.y + (ny > 0 ? plan.d : 0)) : nx ? plan.x + (nx > 0 ? 0 : plan.w) : plan.y + (ny > 0 ? 0 : plan.d);
    const along = nx ? [plan.y + 10, plan.y + plan.d - 10] : [plan.x + 12, plan.x + plan.w - 12];
    const rivets = [];
    for (let s = along[0]; s <= along[1] + 1e-6; s += nx ? 15.67 : 18) rivets.push(nx ? [face, s, 95] : [s, face, 95]);
    const seam = (z) => L(k.segment(nx ? [face, plan.y, z] : [plan.x, face, z], nx ? [face, plan.y + plan.d, z] : [plan.x + plan.w, face, z], P), { tone: 'faint' });
    let faceSvg = '';
    const onWall = (a, z) => at(nx ? [face, a, z] : [a, face, z]);
    if (side === 'left') {
      // vents, the e-stop panel, a rear service hatch (screws, latch) and a rating plate whose rules stand for text
      const hatch = slot('y', face, -98, -48, 18, 42) + slot('y', face, -95, -51, 21, 39);
      const plate = slot('y', face, 30, 66, 18, 34);
      const rules = [[33, 29, 58], [33, 25.5, 52], [33, 22, 60]].map(([a0, z, a1]) => k.pathOf([onWall(a0, z), onWall(a1, z)])).join('');
      faceSvg = L(Array.from({ length: 6 }, (_, i) => slot('y', face, 40 + i * 9, 43 + i * 9, 54, 76)).join(''), { tone: 'lo' }) + L(slot('y', face, -100, -60, 50, 80), { tone: 'faint' })
        + L(hatch, { tone: 'lo' }) + L(k.pathOf(k.circleRing(-56, 30, 1.6, 12).map(([a, z]) => onWall(a, z)), true), { tone: 'lo' }) + L(plate, { tone: 'lo' }) + L(rules, { tone: 'faint', free: true })
        + D([[-96.5, 19.5], [-49.5, 19.5], [-96.5, 40.5], [-49.5, 40.5], [-56, 30], [32, 20], [64, 20], [32, 32], [64, 32]].map(([a, z]) => onWall(a, z)), { size: 0.45 });
    }
    if (side === 'front') {
      // ToF windows, and a light bar between the bumper and the handle
      faceSvg = L([-46, 34].map((y) => slot('x', face, y, y + 12, 72, 80)).join(''), { tone: 'lo' }) + L([-40, 40].map((y) => slot('x', face, y - 1.5, y + 1.5, 74.5, 77.5)).join(''), { tone: 'hi' })
        + L(slot('x', face, -36, 36, 48, 53.5), { tone: 'lo' }) + L(slot('x', face, -33.5, 33.5, 49.75, 51.75), { tone: 'faint' }); // inner rule faint: hidden when parked
    }
    box(`chassis.wall.${side}`, 'base', plan, 12, 88, { steps: 2, tone: 'mid', bevel: 0.5, inner: seam(46) + seam(84), after: faceSvg + D(rivets.map((p) => at(p)), { size: 0.45 }) });
  }
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const cx = sx * 102;
    const cy = sy * 57;
    const a0 = sx > 0 ? 0 : Math.PI;
    const a1 = sy > 0 ? Math.PI / 2 : sx > 0 ? -Math.PI / 2 : (3 * Math.PI) / 2;
    const span = Array.from({ length: 13 }, (_, i) => a0 + ((a1 - a0) * i) / 12);
    const outer = span.map((t) => [cx + 19 * Math.cos(t), cy + 19 * Math.sin(t)]);
    const inner = span.map((t) => [cx + 12 * Math.cos(t), cy + 12 * Math.sin(t)]).reverse();
    const guard = [...outer, ...inner];
    const F = VERT(cx, cy);
    const ridges = [30, 56, 82].map((z) => G.arcOf(F, z, 19, P, { from: Math.min(a0, a1), to: Math.max(a0, a1) })).join('');
    put(`chassis.guard.${sx > 0 ? 'f' : 'r'}${sy > 0 ? 'l' : 'r'}`, 'base', 'body', [cx + 15 * sx * 0.7, cy + 15 * sy * 0.7, 56], [A.extruded(guard, 12, 88)], k.solidSvg(k.extrude(guard, 12, 88, P, { convex: false }), { tone: 'lo', inner: L(ridges, { tone: 'faint' }) }));
  }
  for (const [side, x] of [['front', 120], ['rear', -128]]) {
    const plan = { x, y: -50, w: 8, d: 100, r: 2.5 };
    box(`chassis.bumper.${side}`, 'base', plan, 14, 26, { tone: 'lo', bevel: 0.8, inner: L(k.sideSeam(plan, 27, P, 4), { tone: 'faint' }) });
  }
  for (const [side, plan] of [['front', { x: 120, y: -57, w: 1, d: 114, r: 0 }], ['rear', { x: -121, y: -57, w: 1, d: 114, r: 0 }], ['left', { x: -102, y: 75, w: 204, d: 1, r: 0 }], ['right', { x: -102, y: -76, w: 204, d: 1, r: 0 }]])
    box(`chassis.status.${side}`, 'base', plan, 88, 4, { steps: 2, tone: 'hi', crease: 'lo' });
  for (const [index, { at: [x, y] }] of LIDARS.entries()) {
    const F = VERT(x, y);
    cyl(`chassis.lidar${index}.base`, 'base', x, y, 6.4, 12, 10, { tone: 'mid', inner: L(k.sideArc(x, y, 6.4, 16, P, 20), { tone: 'faint' }) });
    const slots = G.ribsOf(F, 22, 34, 5.6, 28, P, { fade: [0.12, 0.6], seams: true });
    cyl(`chassis.lidar${index}.window`, 'base', x, y, 5.6, 22, 12, { tone: 'lo', crease: 'lo', after: k.fadedSvg(slots, { tone: 'faint' }) });
    cyl(`chassis.lidar${index}.head`, 'base', x, y, 6.4, 34, 6, { tone: 'mid', bevel: 0.5, after: L(ring(x, y, 3.2, 40, 16), { tone: 'lo' }) + D([at([x, y, 40])], { size: 0.5 }) });
  }
  for (const side of [1, -1]) {
    const F = AXIS.y([0, 0, 24], side);
    const tread = G.ribsOf(F, 77.6, 90.4, 24, 56, P, { fade: [0.1, 0.55], seams: true });
    disc(`chassis.wheel${side > 0 ? 'L' : 'R'}.tyre`, 'base', F, 77, 91, 24, { tone: 'lo', ground: true, after: k.fadedSvg(tread, { tone: 'faint' }) + (side > 0 ? L(G.circleOf(F, 91, 18, P), { tone: 'faint' }) : '') });
    disc(`chassis.wheel${side > 0 ? 'L' : 'R'}.collar`, 'base', F, 75, 77, 10, { tone: 'mid' });
    const nuts = side > 0 ? D(G.dotsOf(F, 93, 8, 5, P, { all: true }), { size: 0.55 }) + D([at([0, 93, 24])], { size: 0.6, tone: 'hi' }) + L(G.circleOf(F, 93, 4.5, P), { tone: 'lo' }) : '';
    disc(`chassis.wheel${side > 0 ? 'L' : 'R'}.hub`, 'base', F, 91, 93, 12, { tone: 'mid', after: nuts });
  }
  for (const cx of [90, -90])
    for (const cy of [50, -50]) {
      const tag = `chassis.caster.${cx > 0 ? 'f' : 'r'}${cy > 0 ? 'l' : 'r'}`;
      disc(`${tag}.wheel`, 'base', AXIS.y([cx, 0, 3], 1), cy - 1.5, cy + 1.5, 3, { tone: 'lo', ground: true });
      box(`${tag}.fork`, 'base', { x: cx - 2, y: cy - 3, w: 4, d: 6, r: 0.6 }, 6, 1, { steps: 2, tone: 'lo' });
      cyl(`${tag}.swivel`, 'base', cx, cy, 6, 7, 1, { tone: 'mid', steps: 20 });
    }
  {
    const F = AXIS.y([-80, 0, 64], 1);
    disc('chassis.estop.collar', 'base', F, 75, 77, 10, { tone: 'mid', after: L(G.circleOf(F, 77, 8.6, P), { tone: 'lo' }) + D(G.dotsOf(F, 77, 9.2, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.45 }) });
    const mushroom = [[77, 0], [77, 6.8], [78.4, 6.8, 1], [80, 5.8, 1], [81, 3.8, 1], [81.4, 1.8, 1], [81.5, 0]];
    put('chassis.estop.button', 'base', 'body', [-80, 80, 64], [A.solid(F, mushroom)], k.solidSvg(G.solidOf(mushroom, F, P), { tone: 'hi', crease: 'lo' }));
  }
  for (const [side, x, nx] of [['front', 120, 1], ['rear', -125, -1]]) {
    const plan = { x, y: -30, w: 5, d: 60, r: 2 };
    const ends = [-26, 26].map((y) => [nx > 0 ? x + 5 : x, y, 63]);
    box(`chassis.handle.${side}`, 'base', plan, 60, 6, { tone: 'hi', crease: 'lo', bevel: 0.6, after: D(ends.map((p) => at(p)), { size: 0.5 }) });
  }
  for (const y of [-22, 14]) box(`chassis.charge.${y < 0 ? 'a' : 'b'}`, 'base', { x: -122, y, w: 2, d: 8, r: 0.5 }, 44, 6, { steps: 2, tone: 'hi', crease: 'lo' });

  // Battery (lift 50).
  box('battery.tray', 'battery', { x: -100, y: -55, w: 160, d: 110, r: 4 }, 12, 4, { tone: 'lo', bevel: 0.6 });
  for (const [i, x] of [-98, -46, 6].entries())
    for (const [j, y] of [-53, 1.5].entries()) {
      const plan = { x, y, w: 50, d: 51.5, r: 2 };
      const vents = [0, 1, 2, 3].map((n) => k.planOutline({ x: x + 8 + n * 9.5, y: y + 16, w: 3, d: 20, r: 1.2 }, 54, P, 3)).join('');
      box(`battery.cell.${i}${j}`, 'battery', plan, 16, 38, { tone: 'mid', bevel: 0.6, inner: L(k.sideSeam(plan, 48, P, 4), { tone: 'faint' }), after: L(vents, { tone: 'faint' }) + screws(k.corners(plan, 4), 54) });
    }
  for (const [n, y] of [[0, -30], [1, 24]]) box(`battery.busbar.${n}`, 'battery', { x: -90, y, w: 136, d: 6, r: 1 }, 54, 2, { steps: 2, tone: 'hi', crease: 'lo', after: screws([[-84, y + 3], [-32, y + 3], [20, y + 3]], 56) });
  for (const [n, y] of [[0, -27], [1, 27]]) cyl(`battery.terminal.${n}`, 'battery', 52, y, 3.5, 54, 8, { tone: 'hi', crease: 'lo', steps: 20, after: L(ring(52, y, 1.6, 62, 12), { tone: 'lo' }) });
  {
    const plan = { x: -40, y: -14, w: 40, d: 28, r: 1 };
    const chips = L(k.planOutline({ x: -34, y: -8, w: 12, d: 10, r: 0.6 }, 56, P, 2) + k.planOutline({ x: -18, y: 0, w: 8, d: 8, r: 0.6 }, 56, P, 2), { tone: 'lo' });
    const rules = L([-8, -4].map((y) => k.lineOnTop([-34, y + 10], [-24 + (y + 8) * 2, y + 10], 56, P)).join(''), { tone: 'faint', free: true });
    box('battery.bms', 'battery', plan, 54, 2, { steps: 2, tone: 'lo', after: chips + rules + screws(k.corners(plan, 2.5), 56) });
  }
  for (const [n, y] of [[0, -49], [1, 45]]) box(`battery.handle.${n}`, 'battery', { x: -80, y, w: 40, d: 4, r: 1.5 }, 54, 6, { tone: 'lo', bevel: 0.4 });

  // Compute bay, the brain (lift 100).
  const TRAY = { x: -95, y: -60, w: 170, d: 120, r: 4 };
  box('compute.tray', 'compute', TRAY, 62, 2, { tone: 'lo', bevel: 0.6, after: L(k.planOutline(k.insetPlan(TRAY, 4), 64, P, 4), { tone: 'faint' }) });
  for (const [x, y] of k.corners(TRAY, 10)) cyl(`compute.standoff.${x}.${y}`, 'compute', x, y, 2.5, 64, 4, { tone: 'mid', steps: 16 });
  {
    const plan = { x: -87, y: -52, w: 154, d: 104, r: 2 };
    const traces = [6, 13, 20, 27, 34].map((y) => [[-56, y], [-4, y]]).concat([-30, -4, 22].map((y) => [[44, y], [54, y]]), [[[-24, -35], [-12, -35], [-12, -2]]]);
    const traceSvg = L(traces.map((pts) => k.onTop(pts, 70, P)).join(''), { tone: 'lo' }) + D(traces.flatMap((pts) => [pts[0], pts[pts.length - 1]]).map(([x, y]) => at([x, y, 70])), { size: 0.45, tone: 'hi' });
    box('compute.board', 'compute', plan, 68, 2, { steps: 2, tone: 'mid', after: traceSvg + screws(k.corners(TRAY, 10), 70, 2) });
  }
  // The SoC sits forward and left (toward the viewer) so it shows past the lifted deck.
  box('compute.soc.base', 'compute', { x: -4, y: -2, w: 48, d: 48, r: 2 }, 70, 3, { tone: 'lo', after: D(k.corners({ x: -4, y: -2, w: 48, d: 48 }, 2.5).map(([x, y]) => at([x, y, 73])), { size: 0.45 }) });
  {
    const plan = { x: 0, y: 2, w: 40, d: 40, r: 3 };
    const lid = k.slabOf(plan, 73, 3, P, 4, 0.8);
    const svg = k.solidSvg(lid, { tone: 'mid' }) + `<g data-brain>${k.solidSvg(lid, { tone: 'hi', lit: true })}</g>`;
    put('compute.soc.lid', 'compute', 'body', [20, 22, 74.5], [A.slab(plan, 73, 3, {}, 4)], svg);
  }
  for (const [n, x] of [[0, -72], [1, -63]]) box(`compute.memory.${n}`, 'compute', { x, y: -38, w: 5, d: 76, r: 0.8 }, 70, 12, { steps: 2, tone: 'mid', bevel: 0.3, inner: L(k.sideSeam({ x, y: -38, w: 5, d: 76, r: 0.8 }, 74, P, 2), { tone: 'faint' }), after: D([-30, -15, 0, 15, 30].map((y) => at([x + 5, y, 78])), { size: 0.4, tone: 'lo' }) });
  box('compute.m2', 'compute', { x: 14, y: -46, w: 38, d: 12, r: 1 }, 70, 1.5, { steps: 2, tone: 'lo', after: L(k.planOutline({ x: 22, y: -43, w: 12, d: 6, r: 0.5 }, 71.5, P, 2), { tone: 'faint' }) + D([at([48, -40, 71.5])], { size: 0.5 }) });
  for (const [n, y] of [[0, -38], [1, -12], [2, 14]]) {
    const plan = { x: 54, y, w: 12, d: 18, r: 1 };
    box(`compute.port.${n}`, 'compute', plan, 70, 8, { steps: 2, tone: 'mid', bevel: 0.4, after: L(k.planOutline({ x: 66, y: y + 3, w: 0.01, d: 12, r: 0 }, 72, P, 1), { tone: 'lo' }) });
  }
  box('compute.power', 'compute', { x: -50, y: -46, w: 26, d: 22, r: 1.5 }, 70, 6, { tone: 'mid', bevel: 0.4, after: L([-45, -37].map((x) => ring(x, -35, 3.2, 76, 16)).join(''), { tone: 'lo' }) + D([at([-45, -35, 76]), at([-37, -35, 76])], { size: 0.5 }) });
  for (let i = 0; i < 5; i++) box(`compute.fin.${i}`, 'compute', { x: 2 + i * 8.5, y: 4, w: 2, d: 36, r: 0.5 }, 76, 20, { steps: 2, tone: 'hi', crease: 'lo', bevel: 0.3 });

  // Deck lid (lift 150): seams, screws, arm bolt circle, mast foot outline and a label plate, all flat on top.
  {
    const top = 108;
    const panel = k.insetPlan(CHASSIS, 7);
    const seam = k.lineOnTop([-20, CHASSIS.y], [-20, CHASSIS.y + CHASSIS.d], top, P);
    const holes = Array.from({ length: 8 }, (_, j) => [40 + 26 * Math.cos((j / 8) * Math.PI * 2 + 0.2), 26 * Math.sin((j / 8) * Math.PI * 2 + 0.2)]);
    const label = { x: 72, y: 34, w: 34, d: 22, r: 1.5 };
    const ACC = { x: 72, y: -64, w: 36, d: 30, r: 2 };
    const accHoles = [0, 1, 2, 3].flatMap((i) => [0, 1, 2].map((j) => [ACC.x + 6 + i * 8, ACC.y + 7 + j * 8]));
    const rules = [[78, 41, 100], [78, 46, 94], [78, 51, 97]].map(([x0, y, x1]) => k.lineOnTop([x0, y], [x1, y], top, P)).join('');
    const marks = [
      L(k.planOutline(panel, top, P, 8) + seam, { tone: 'faint' }),
      L(ring(40, 0, 30, top, 64) + k.planOutline({ x: MAST[0] - 12, y: MAST[1] - 12, w: 24, d: 24, r: 3 }, top, P, 4), { tone: 'lo' }),
      L(k.planOutline(label, top, P, 3), { tone: 'lo' }) + L(rules, { tone: 'faint', free: true }),
      k.faceTextSvg(k.topMatrix([77, 38.6], top, P, 'x'), 'SC-01', { size: 4.2, tone: 'mid' }),
      L(Array.from({ length: 9 }, (_, i) => k.planOutline({ x: -96, y: -40 + i * 8, w: 44, d: 3, r: 1.4 }, top, P, 3)).join(''), { tone: 'lo' }),
      L(k.planOutline({ x: -10, y: 28, w: 50, d: 34, r: 3 }, top, P, 4), { tone: 'lo' }) + L(k.planOutline({ x: -7, y: 31, w: 44, d: 28, r: 2 }, top, P, 4), { tone: 'faint' }),
      // accessory plate: a 4 x 3 grid of tapped M6 holes for payload fixtures
      L(k.planOutline(ACC, top, P, 4), { tone: 'lo' }) + L(accHoles.map(([x, y]) => ring(x, y, 1.8, top, 12)).join(''), { tone: 'faint' }),
    ].join('');
    const svgDots = screws(holes, top) + screws([...k.corners(CHASSIS, 9), [0, CHASSIS.y + 9], [0, CHASSIS.y + CHASSIS.d - 9], [-60, CHASSIS.y + 9], [-60, CHASSIS.y + CHASSIS.d - 9], [60, CHASSIS.y + 9], [60, CHASSIS.y + CHASSIS.d - 9]], top, 2) + screws(k.corners(label, 2.5), top) + screws(k.corners({ x: -10, y: 28, w: 50, d: 34 }, 4), top) + screws([[-100, -44], [-48, -44], [-100, 34], [-48, 34]], top) + D(accHoles.map((p) => at([...p, top])), { size: 0.4, tone: 'lo' });
    box('deck.plate', 'top', CHASSIS, 100, 8, { steps: 8, tone: 'mid', bevel: 1.2, after: marks + svgDots });
    for (const [side, plan] of [['front', { x: 120, y: -57, w: 1, d: 114, r: 0 }], ['rear', { x: -121, y: -57, w: 1, d: 114, r: 0 }], ['left', { x: -102, y: 75, w: 204, d: 1, r: 0 }], ['right', { x: -102, y: -76, w: 204, d: 1, r: 0 }]])
      box(`deck.trim.${side}`, 'top', plan, 100, 6, { steps: 2, tone: 'lo' });
  }
}

// ---------------------------------------------------------------- live parts (arm, mast, pan camera)
function live(P, R) {
  const T = turning(P, { recorder: R });
  const arm = T.layer('arm');
  T.stack(['back', 'body', 'arm']);
  const yaw = T.group('yaw', { turn: { pivot: [40, 0] } });
  const capJ2 = T.group('capJ2', { parent: yaw, slide: { direction: [0, 1, 0], travel: 7 } });
  const sh = T.group('sh', { parent: yaw, hinge: { point: S, axis: [0, 1, 0], range: RANGES.sh } });
  const capJ3 = T.group('capJ3', { parent: sh, slide: { direction: [0, 1, 0], travel: 7 } });
  const el = T.group('el', { parent: sh, hinge: { point: E, axis: [0, 1, 0], range: RANGES.el } });
  const wr = T.group('wr', { parent: el, hinge: { point: WR, axis: [0, 1, 0], range: RANGES.wr } });
  const fA = T.group('fA', { parent: wr, slide: { direction: [1, 0, 0], travel: 6 } });
  const fB = T.group('fB', { parent: wr, slide: { direction: [-1, 0, 0], travel: 6 } });
  const pan = T.group('pan', { turn: { pivot: MAST } });
  const base = { layer: arm, tone: 'mid', crease: 'faint' };
  const yAt = (o) => AXIS.y([o[0], 0, o[2]], 1);
  const strainWave = (face, rBolt, rings) => ({ bolts: [{ s: face, r: rBolt, count: 8, size: 0.5, tone: 'mid' }], rings: rings.map((r, i) => ({ at: [face, 0, 0], normal: [0, 1, 0], r, tone: i === rings.length - 1 ? 'mid' : 'lo' })) });
  const capFace = (face, r) => ({ bolts: [{ s: face, r: r * 0.72, count: 4, size: 0.5, phase: Math.PI / 4 }], rings: [{ at: [face, 0, 0], normal: [0, 1, 0], r: r * 0.5, tone: 'lo' }], dots: [{ at: [face, 0, 0], normal: [0, 1, 0], size: 0.6, tone: 'hi' }] });

  // Mast: never re-projected, ordered with the arm.
  T.prism({ ...base, name: 'mast.foot', plan: { x: MAST[0] - 10, y: MAST[1] - 10, w: 20, d: 20, r: 2 }, z: 108, h: 6, bevel: 0.5, details: { dots: k.corners({ x: MAST[0] - 10, y: MAST[1] - 10, w: 20, d: 20 }, 3).map(([x, y]) => ({ at: [114, x, y], normal: [0, 0, 1], size: 0.5 })) } });
  T.round({ ...base, name: 'mast.post.lo', F: VERT(...MAST), s0: 114, s1: 180, r: 4, details: { seams: [130, 164] } });
  T.round({ ...base, name: 'mast.post.hi', F: VERT(...MAST), s0: 190, s1: 216, r: 4, details: { seams: [204] } });
  T.round({ ...base, name: 'mast.lidar', F: VERT(...MAST), s0: 216, s1: 230, r: 10, tone: 'hi', crease: 'lo', details: { seams: [219, 227], ribs: { s0: 219, s1: 227, count: 64, fade: [0.12, 0.6], seams: true, tone: 'lo' } } });
  T.round({ ...base, name: 'mast.cap', F: VERT(...MAST), s0: 230, s1: 234, r: 7, details: { bolts: [{ s: 234, r: 4.6, count: 4, size: 0.45 }, { s: 234, r: 0, count: 1, size: 0.55, tone: 'hi' }] } });
  // Pan camera: 0 faces +x.
  const bracket = G.hullOf([...k.circleRing(0, 0, 6, 20), [0, -5], [11, -5], [11, 5], [0, 5]]);
  T.prism({ ...base, name: 'pan.bracket', group: pan, F: { o: [MAST[0], MAST[1], 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, polygon: bracket, s0: 180, s1: 190, bevel: 0.4 });
  const cam = T.prism({ ...base, name: 'pan.camera', group: pan, plan: { x: MAST[0] + 11, y: MAST[1] - 14, w: 8, d: 28, r: 1.5 }, z: 180.5, h: 9, tone: 'hi', crease: 'lo', bevel: 0.4, details: { dots: [-10, 10].map((dy) => ({ at: [189.5, MAST[0] + 15, MAST[1] + dy], normal: [0, 0, 1], size: 0.45 })) } });
  const lens = (cx) => `<circle class="iso-line" data-tone="mid" cx="${cx}" cy="0" r="3.1"/><circle class="iso-line" data-tone="lo" cx="${cx}" cy="0" r="1.9"/><circle class="iso-line" data-tone="hi" cx="${cx}" cy="0" r="0.6"/>`;
  T.plane({ part: cam, o: [MAST[0] + 19, MAST[1], 185], u: [0, 1, 0], v: [0, 0, -1], normal: [1, 0, 0], svg: lens(-7) + lens(7) + `<circle class="iso-line" data-tone="hi" cx="0" cy="0" r="0.8"/>` });

  // Yaw: base flange, J1 housing, J2 housing (axis y, slab [-18, 18]).
  T.round({ ...base, name: 'yaw.flange', group: yaw, F: VERT(40, 0), s0: 108, s1: 114, r: 22, details: { bolts: [{ s: 114, r: 19.4, count: 10, size: 0.5 }] } });
  T.round({ ...base, name: 'yaw.j1', group: yaw, F: VERT(40, 0), s0: 114, s1: 156, r: 18, tone: 'hi', crease: 'lo', details: { seams: [119, 150] } });
  T.round({ ...base, name: 'yaw.j2', group: yaw, F: yAt(S), s0: -18, s1: 18, r: 16, tone: 'hi', crease: 'lo', details: { seams: [-12], ...strainWave(18, 11, [6, 9, 13]) } });
  T.round({ ...base, name: 'cap.j2', group: capJ2, F: yAt(S), s0: 18, s1: 22, r: 16, details: capFace(22, 16) });
  // Shoulder link (slab A [-46, -18]).
  T.round({ ...base, name: 'sh.knuckle', group: sh, F: yAt(S), s0: -20, s1: -18, r: 16 });
  // r 11 (not 13): near vertical this long link crosses the brightest band's threshold, and the birth must stay under the audit's
  // 2 px² per 0.05° (sh sweep near -2.35°); centred y -31 it still fills slab A from the knuckle face at -20
  T.round({ ...base, name: 'sh.link', group: sh, F: AXIS.z([S[0], -31, S[2]]), s0: 0, s1: 97, r: 11, ends: ['dome', 'flat'], tone: 'hi', crease: 'lo', details: { seams: [14, 84] } });
  T.round({ ...base, name: 'sh.j3', group: sh, F: yAt(E), s0: -46, s1: -18, r: 13, tone: 'hi', crease: 'lo', details: { seams: [-40], ...strainWave(-18, 9, [4.5, 7, 10]) } });
  T.round({ ...base, name: 'cap.j3', group: capJ3, F: yAt(E), s0: -18, s1: -14, r: 13, details: capFace(-14, 13) });
  // Elbow link (slab B [-70, -46]).
  T.round({ ...base, name: 'el.knuckle', group: el, F: yAt(E), s0: -48, s1: -46, r: 13 });
  T.round({ ...base, name: 'el.link', group: el, F: AXIS.x([E[0], -59, E[2]]), s0: 0, s1: 89, r: 11, ends: ['dome', 'flat'], tone: 'hi', crease: 'lo', details: { seams: [12, 78] } });
  T.round({ ...base, name: 'el.j4', group: el, F: yAt(WR), s0: -70, s1: -48, r: 11, details: { bolts: [{ s: -48, r: 7.4, count: 6, size: 0.45 }], rings: [{ at: [-48, 0, 0], normal: [0, 1, 0], r: 4, tone: 'lo' }] } });
  // Wrist and tool (slab C [-92, -70]); tool axis -z at rest.
  T.round({ ...base, name: 'wr.knuckle', group: wr, F: yAt(WR), s0: -72, s1: -70, r: 11 });
  T.round({ ...base, name: 'wr.link', group: wr, F: AXIS.z([WR[0], -81, WR[2]], -1), s0: 0, s1: 16, r: 9, ends: ['dome', 'flat'], tone: 'hi', crease: 'lo' });
  T.round({ ...base, name: 'wr.j5', group: wr, F: AXIS.x([WR[0], -81, WR[2] - 26]), s0: -12, s1: 12, r: 10, details: { seams: [-9, 9], bolts: [12, -12].map((s) => ({ s, r: 7, count: 6, size: 0.45 })), rings: [12, -12].map((s) => ({ at: [s, 0, 0], normal: [Math.sign(s), 0, 0], r: 4, tone: 'lo' })) } });
  // J6 flange merged into the gripper body (spec 1.4 budget note): its top sits tangent under J5, its bolt ring as dots on the top.
  const gripTop = WR[2] - 36;
  T.prism({ ...base, name: 'wr.gripper', group: wr, plan: { x: WR[0] - 13, y: -90, w: 26, d: 18, r: 1.5 }, z: gripTop - 12, h: 12, tone: 'hi', crease: 'lo', bevel: 0.5, details: { seams: [gripTop - 6], dots: [...[-9, 9].map((dx) => ({ at: [gripTop - 6, WR[0] + dx, -72], normal: [0, 1, 0], size: 0.45 })), ...[[-10.5, -87.5], [10.5, -87.5], [-10.5, -74.5], [10.5, -74.5]].map(([dx, y]) => ({ at: [gripTop, WR[0] + dx, y], normal: [0, 0, 1], size: 0.4 }))] } });
  for (const [name, group, x] of [['wr.finger.a', fA, WR[0] + 1], ['wr.finger.b', fB, WR[0] - 5]])
    T.prism({ ...base, name, group, plan: { x, y: -86, w: 4, d: 10, r: 0.6 }, z: WR[2] - 68, h: 20, details: { seams: [WR[2] - 63] } });
  // The arm and mast ride the deck lid in the lift (CSS translate on the live SVG): tell the kit audit.
  for (const part of T.parts) for (const shape of part.shapes) Object.assign(shape, { move: [0, 0, LIFT_ARM], ride: 'top', piece: 'top' });
  return T;
}

function scene(P) {
  const R = A.recorder(P);
  statics(P, R);
  const T = live(P, R);
  return { R, T };
}

// ---------------------------------------------------------------- kinematics for hulls and asserts (independent of the engine)
const rad = (d) => (d * Math.PI) / 180;
const rotY = (p, c, deg) => {
  const s = Math.sin(rad(deg));
  const q = Math.cos(rad(deg));
  const x = p[0] - c[0];
  const z = p[2] - c[2];
  return [c[0] + x * q + z * s, p[1], c[2] - x * s + z * q];
};
const rotZ = (p, c, deg) => {
  const s = Math.sin(rad(deg));
  const q = Math.cos(rad(deg));
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * q - y * s, c[1] + x * s + y * q, p[2]];
};
function place(p, group, g) {
  switch (group) {
    case 'fA': return place(add(p, [g.fA, 0, 0]), 'wr', g);
    case 'fB': return place(add(p, [-g.fB, 0, 0]), 'wr', g);
    case 'wr': return place(rotY(p, WR, g.wr), 'el', g);
    case 'el': return place(rotY(p, E, g.el), 'sh', g);
    case 'capJ3': return place(add(p, [0, g.capJ3, 0]), 'sh', g);
    case 'sh': return place(rotY(p, S, g.sh), 'yaw', g);
    case 'capJ2': return place(add(p, [0, g.capJ2, 0]), 'yaw', g);
    case 'yaw': return rotZ(p, [40, 0], g.yaw);
    case 'pan': return rotZ(p, MAST, g.pan);
    default: return p;
  }
}
const liveSamples = (T) => T.parts.map((part) => ({ name: part.name, group: part.group ? part.group.name : null, points: part.shapes.flatMap((s) => sampleShape(s, 16)) }));
const livePoints = (samples, u) => {
  const st = stateAt(u);
  const g = groupsOf(st.values);
  const lift = LIFT_ARM * st.shares.top;
  return samples.flatMap((part) => part.points.map((p) => add(place(p, part.group, g), [0, 0, lift])));
};
const staticPoints = (R, u, layers = ['back', 'body']) => {
  const shares = { base: 0, ...stateAt(u).shares };
  return R.items.filter((item) => layers.includes(item.layer)).flatMap((item) => item.shapes.flatMap((s) => sampleShape(s, 12).map((p) => add(p, item.move, shares[item.piece] ?? 0))));
};
const grid = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 1e4) / 1e4);

// ---------------------------------------------------------------- build
const P0 = k.fitProjection([[0, 0, 0], [1, 1, 1]], W, H, { azimuth: AZ, elevation: EL });
const first = scene(P0);
const firstSamples = liveSamples(first.T);
const heroU = grid(0, 1, 0.01);
// The four extreme points in screen x and y (fitProjection only reads those).
const extremes = (points) => {
  const unit = { origin: [0, 0], scale: 1, azimuth: AZ, elevation: EL };
  const best = [null, null, null, null];
  const at = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of points) {
    const [x, y] = k.iso(p, unit);
    if (x < at[0]) (at[0] = x), (best[0] = p);
    if (y < at[1]) (at[1] = y), (best[1] = p);
    if (x > at[2]) (at[2] = x), (best[2] = p);
    if (y > at[3]) (at[3] = y), (best[3] = p);
  }
  return best;
};
const heroHull = extremes(heroU.flatMap((u) => extremes([...staticPoints(first.R, u), ...livePoints(firstSamples, u)])));
export const P = k.fitProjection(heroHull, FIT[2] - FIT[0], FIT[3] - FIT[1], { pad: 0, azimuth: AZ, elevation: EL });
P.origin = [P.origin[0] + FIT[0], P.origin[1] + FIT[1]];
const built = scene(P);
export const R = built.R;
export const T = built.T;
const samples = liveSamples(T);
export const poses = () => sampleU().map((u) => groupsOf(stateAt(u).values));
// The scroll path by sampleU index t (fractional t interpolates u), for the orbit audit and turn-check --states.
const US = sampleU();
// The scroll path by motion, for the orbit audit (whose halving test assumes even speed inside a frame): t is the cumulative
// largest group change per 1e-4 of u (degrees; slides x1.5, as sampleU weighs 0.2 against 0.3), so equal steps of t move the arm equally.
const PATH = [0];
{
  let prev = groupsOf(stateAt(0).values);
  for (let i = 1; i <= 20000; i++) {
    const g = groupsOf(stateAt(i / 1e4).values);
    PATH.push(PATH[i - 1] + Math.max(...Object.keys(g).map((n) => Math.abs(g[n] - prev[n]) * (/^(f[AB]|cap)/.test(n) ? 1.5 : 1))));
    prev = g;
  }
}
export const PATH_END = PATH[PATH.length - 1];
export const uAt = (t) => {
  let lo = 0;
  let hi = PATH.length - 1;
  if (t <= 0) return 0;
  if (t >= PATH_END) return 2;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (PATH[mid] <= t) lo = mid;
    else hi = mid;
  }
  return (lo + (t - PATH[lo]) / (PATH[hi] - PATH[lo] || 1)) / 1e4;
};
export const scrollAt = (t) => groupsOf(stateAt(uAt(t)).values);
// The orbit audit's motion family: the whole reachable path, u 0..2, walked by joint travel at 1° of the fastest joint per frame
// (the hero follows the scroll, so it has no natural frame; a 700 ms berth move turns J1 up to 4.6° per 60 Hz frame, and at 60 Hz
// frames the halving test saturates on the 2-unit knuckle discs). The sampleU states (0.3° apart) go in as extra poses.
export const families = { sweep: { name: 'scroll', at: scrollAt, from: 0, to: PATH_END, frame: 1, periodic: false, unit: '' }, clips: [] };
const verify = argv.includes('--verify');
const out = T.build({ statics: R.items, poses, verify });
const lifts = liftStates();
// One static DOM order serves every lift state (the page never re-sorts), so solve the keys with the lift taken out of them:
// overlaps are still measured in every lifted state, but each one-sided pair must hold as a plain key order.
// Each lifted overlap is also checked as a "page order" copy at share 0 (the rest keys the DOM is sorted by), so the solved keys
// satisfy both the kit's lifted-key model and the page's constant order, and the kit audit's depth line proves both.
{
  const overlaps = A.overlapsOf(R.items, P, { states: lifts, skip: A.sameRun });
  const flat = { base: 0, battery: 0, compute: 0, top: 0 };
  const page = new Map(lifts.map((s) => [s, { label: `${s.label} page order`, shares: flat }]));
  overlaps.pairs.push(...overlaps.pairs.map((pair) => ({ ...pair, state: page.get(pair.state) })));
  overlaps.states = [...lifts, ...page.values()];
  const solved = A.orderKeys(R.items, overlaps);
  R.items.forEach((item, index) => (item.key = solved.keys[index]));
  R.settled = { items: R.items.slice(), overlaps, solved, states: overlaps.states };
}
export { out };

// ---------------------------------------------------------------- asserts (spec §7)
const problems = [];
const failed = new Map();
const fail = (n, text) => {
  failed.set(n, (failed.get(n) ?? 0) + 1);
  if (failed.get(n) <= 3) problems.push(`assert ${n}: ${text}`);
};
const boundsOfItems = (items) => {
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const item of items) for (const s of item.shapes) for (const p of sampleShape(s, 12)) (z0 = Math.min(z0, p[2])), (z1 = Math.max(z1, p[2]));
  return [z0, z1];
};
// 1. statics stay under the deck top.
for (const item of R.items) {
  const [, z1] = boundsOfItems([item]);
  if (z1 > 108 + 1e-6) fail(1, `${item.name} rises to z ${z1.toFixed(2)} > 108`);
}
// 2 and 6. live parts above the deck, and clear of the mast, at every sampled state.
const MOVING = /^(sh|el|wr|cap)\./;
const mastR = (z) => (z < 108 ? 0 : z <= 114 ? 14.2 : z < 178 ? 4 : z <= 192 ? 23.6 : z < 216 ? 4 : z <= 230 ? 10 : z <= 234 ? 7 : 0);
let minMoving = Infinity;
let minBase = Infinity;
let minMast = Infinity;
let mastAt = null;
for (const u of US) {
  const g = groupsOf(stateAt(u).values);
  for (const part of samples) {
    if (part.name.startsWith('mast.') || part.name.startsWith('pan.')) {
      for (const p of part.points) minBase = Math.min(minBase, p[2]);
      continue;
    }
    for (const p0 of part.points) {
      const p = place(p0, part.group, g);
      if (MOVING.test(part.name)) minMoving = Math.min(minMoving, p[2]);
      else minBase = Math.min(minBase, p[2]);
      const r = mastR(p[2]);
      if (r > 0) {
        const gap = Math.hypot(p[0] - MAST[0], p[1] - MAST[1]) - r;
        if (gap < minMast) (minMast = gap), (mastAt = { u, part: part.name });
      }
    }
  }
}
if (minMoving < 112 - 1e-6) fail(2, `moving arm parts reach z ${minMoving.toFixed(2)} < 112`);
if (minBase < 108 - 1e-6) fail(2, `arm base / mast reach z ${minBase.toFixed(2)} < 108`);
if (minMast < 6) fail(6, `arm-to-mast clearance ${minMast.toFixed(2)} < 6 (${mastAt.part} at u ${mastAt.u})`);
// 3. pieces nest at every u, shares ordered.
const PIECES = ['battery', 'compute', 'top']; // the battery sits inside the tub (base) by design
const zr = Object.fromEntries(PIECES.map((piece) => [piece, boundsOfItems(R.items.filter((item) => item.piece === piece && item.layer === 'body'))]));
const armZ0 = Math.min(minBase, minMoving);
for (const u of grid(0, 1, 0.001)) {
  const sh = { base: 0, ...stateAt(u).shares };
  for (let i = 0; i < PIECES.length - 1; i++) {
    const a = PIECES[i];
    const b = PIECES[i + 1];
    if (zr[a][1] + (TRAVEL[a] ?? 0) * sh[a] > zr[b][0] + (TRAVEL[b] ?? 0) * sh[b] + 1e-6) {
      fail(3, `${a} overlaps ${b} at u ${u}`);
      break;
    }
  }
  if (zr.top[1] + TRAVEL.top * sh.top > armZ0 + LIFT_ARM * sh.top + 1e-6) fail(3, `deck overlaps arm at u ${u}`);
  if (sh.top < sh.compute - 1e-12 || sh.compute < sh.battery - 1e-12) fail(3, `shares out of order at u ${u}`);
}
// 4. one static order for every lift state: every one-sided overlap agrees with the rest keys, no interlocks.
{
  const { overlaps, items } = R.settled;
  let wrong = 0;
  let locked = 0;
  const seen = [];
  for (const pair of overlaps.pairs) {
    const aFront = pair.front[0].area >= overlaps.least;
    const bFront = pair.front[1].area >= overlaps.least;
    if (aFront && bFront) {
      locked++;
      if (seen.length < 6) seen.push(`interlock ${items[pair.a].name} × ${items[pair.b].name} (${A.labelOf(pair.state)})`);
      continue;
    }
    if (!aFront && !bFront) continue;
    const [f, b] = aFront ? [pair.a, pair.b] : [pair.b, pair.a];
    if (!(items[f].key > items[b].key)) {
      wrong++;
      if (seen.length < 6) seen.push(`${items[f].name} should be over ${items[b].name} (${A.labelOf(pair.state)})`);
    }
  }
  if (wrong || locked) fail(4, `${wrong} misordered and ${locked} interlocked static pairs across ${lifts.length} lift states: ${seen.join('; ')}`);
}
// 5. hero hull inside the fit box; chassis wide enough.
const hullBox = (points) => {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of points) {
    const [x, y] = k.iso(p, P);
    (b[0] = Math.min(b[0], x)), (b[1] = Math.min(b[1], y)), (b[2] = Math.max(b[2], x)), (b[3] = Math.max(b[3], y));
  }
  return b;
};
const boxOver = (us, pointsAt) => us.reduce((b, u) => {
  const c = hullBox(pointsAt(u));
  return [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.max(b[3], c[3])];
}, [Infinity, Infinity, -Infinity, -Infinity]);
const hero = boxOver(heroU, (u) => [...staticPoints(R, u), ...livePoints(samples, u)]);
if (hero[0] < FIT[0] - 0.5 || hero[1] < FIT[1] - 0.5 || hero[2] > FIT[2] + 0.5 || hero[3] > FIT[3] + 0.5) fail(5, `hero hull ${hero.map((v) => v.toFixed(1))} leaves ${FIT}`);
const chassisBox = hullBox(k.boxCorners(CHASSIS, 0, 108));
const chassisWidth = chassisBox[2] - chassisBox[0];
if (chassisWidth < 300) fail(5, `chassis projected width ${chassisWidth.toFixed(1)} < 300`);
// 7. counts.
const kinds = T.parts.reduce((m, p) => ((m[p.kind] = (m[p.kind] ?? 0) + 1), m), {});
const liveCount = T.parts.length;
const staticCount = R.items.length;
if (staticCount + liveCount < 100 || staticCount + liveCount > 150) fail(7, `${staticCount + liveCount} parts`);
if (liveCount > 26) fail(7, `${liveCount} live parts > 26`);
if (kinds.ball || kinds.lathe || kinds.tube) fail(7, `live kinds ${JSON.stringify(kinds)}`);
// Live weight in prism units, per kind as turn-bench measured this figure (2026-10-17: 24 parts, 38.2): fixed 0.2, prism 1, round 2.6.
const cost = Math.round(((kinds.fixed ?? 0) * 0.2 + (kinds.prism ?? 0) + (kinds.round ?? 0) * 2.6) * 10) / 10;
// 8. crops.
const rounded = (b) => [Math.floor(b[0]), Math.floor(b[1]), Math.ceil(b[2] - Math.floor(b[0])), Math.ceil(b[3] - Math.floor(b[1]))];
const clip = (b) => [Math.max(0, b[0]), Math.max(0, b[1]), Math.min(W, b[2]), Math.min(H, b[3])];
const phoneBox = boxOver(grid(0, 0.5, 0.01), (u) => [...staticPoints(R, u), ...livePoints(samples, u)]);
const phone = rounded(clip([phoneBox[0] - 16, phoneBox[1] - 16, phoneBox[2] + 16, phoneBox[3] + 16]));
const dockBox = boxOver(grid(1, 2, 0.01), (u) => [...staticPoints(R, u, ['body']), ...livePoints(samples, u)]);
const dock = rounded(clip([dockBox[0] - 8, dockBox[1] - 8, dockBox[2] + 8, dockBox[3] + 2]));
if (dock[2] / dock[3] < 1.2) fail(8, `dock aspect ${(dock[2] / dock[3]).toFixed(3)} < 1.2 (box ${dockBox.map((v) => v.toFixed(0))}; per key ${Object.entries({ POINT: 1, WORK: 1.25, EXPERIENCE: 1.5, ABOUT: 1.75, CONTACT: 2 }).map(([n, u]) => `${n} ${hullBox([...staticPoints(R, u, ['body']), ...livePoints(samples, u)]).map((v) => v.toFixed(0))}`).join(' | ')})`);

// ---------------------------------------------------------------- outputs
const zPx = Math.round((k.iso([0, 0, 1], P)[1] - k.iso([0, 0, 0], P)[1]) * 1e4) / 1e4;
const sorted = [...R.items].sort((a, b) => a.key - b.key);
const back = `<g><path class="iso-halo" d="${k.haloOf(k.insetPlan(CHASSIS, -6), 0, 10, P)}"/>${sorted.filter((i) => i.layer === 'back').map((i) => `<g data-part="${i.name}" data-piece="${i.piece}">${i.svg}</g>`).join('')}</g>`;
const body = sorted.filter((i) => i.layer === 'body').map((i) => `<g data-part="${i.name}" data-piece="${i.piece}">${i.svg}</g>`).join('');
const LABEL = 'Illustrative mobile robot: a wheeled base with a battery and an onboard computer, a sensor mast with lidar and a camera, and a jointed arm. As you scroll it wakes, comes apart, scans the floor and points to the selected work.';
const data = {
  version: 1, W, H, unitMm: 2, zPx, travel: TRAVEL,
  crop: { hero: [0, 0, W, H], phone, dock },
  back, body, arm: out.layerSvg('arm', { width: W, height: H }), turn: out.data,
  gl: { W, H, camera: glCamera(P), footprint: { x: CHASSIS.x, y: CHASSIS.y, w: CHASSIS.w, d: CHASSIS.d, r: CHASSIS.r }, lidars: LIDARS },
  label: LABEL,
  report: { static: staticCount, live: liveCount, parts: staticCount + liveCount, cost },
};

if (MAIN) {
  const json = JSON.stringify(data);
  writeFileSync(join(ROOT, 'src/robot/robot.json'), json);
  writeFileSync(join(ROOT, 'src/robot/turn.css'), out.css);
  const geometryCSS = k.ISO_CSS.slice(0, k.ISO_CSS.indexOf('.tb-body')).split('\n').filter((line) => !line.includes('--anatomy-mono:') && !line.includes('--anatomy-lift:') && !line.includes('data-seamless')).join('\n');
  writeFileSync(join(ROOT, 'src/anatomy/geometry.css'), geometryCSS);
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`robot.json ${kb(json.length)} (gzip ${kb(gzipSync(json).length)}) · back ${kb(back.length)} · body ${kb(body.length)} · arm ${kb(data.arm.length)} · turn ${kb(JSON.stringify(out.data).length)}`);
  console.log(`parts ${staticCount} static + ${liveCount} live (${JSON.stringify(kinds)}, cost ~${cost}) · ${US.length} poses · ${lifts.length} lift states · build ${out.report.seconds.toFixed(1)} s`);
  console.log(`layers ${out.report.layers.map((l) => `${l.name}: ${l.planar} planar, ${l.framed} framed, ${l.dynamic} dynamic`).join(' · ')} · tight ${out.report.tight.length}`);
  console.log(`zPx ${zPx} · scale ${P.scale.toFixed(4)} · hero hull ${hero.map((v) => v.toFixed(1)).join(',')} · chassis width ${chassisWidth.toFixed(1)} · crop phone ${phone} dock ${dock} (aspect ${(dock[2] / dock[3]).toFixed(2)}) · mast clearance ${minMast.toFixed(1)} · moving min z ${minMoving.toFixed(1)}`);
  if (problems.length) console.log(`build asserts failing: ${[...failed].map(([n, c]) => `${n} (${c})`).join(', ')}\n  ${problems.join('\n  ')}`);
  else console.log('build asserts: 1-8 pass');
  if (problems.length) process.exitCode = 1;
  if (verify) {
    mkdirSync(join(ROOT, 'scripts/.out'), { recursive: true });
    writeFileSync(join(ROOT, 'scripts/.out/robot-verify.html'), verifyPage());
    console.log('wrote scripts/.out/robot-verify.html');
  }
  if (argv.includes('--audit')) {
    A.auditOrExit(R, P, { frames: lifts, apart: true });
    // The reachable motion (families, above) replaces the default 360° sweep of the root turns: J1 never leaves [-50, 80].
    const orbit = TA.orbitOrExit(T, R, P, {
      ...families,
      poses,
      quick: argv.includes('--quick'),
      only: argv.find((a) => a.startsWith('--only='))?.slice(7).split(',') ?? null,
      log: argv.includes('--verbose') ? (text) => console.log(`  … ${text}`) : null,
    });
    // Every problem line in full (the printed report stops at 40 per line); `scroll t` is a sampleU index.
    const lists = Object.fromEntries(Object.entries(orbit).filter(([, v]) => Array.isArray(v) && v.length && typeof v[0] === 'object').map(([n, v]) => [n, v.map((e) => ({ ...e, ...(e.frames ? { frames: undefined } : {}) }))]));
    mkdirSync(join(ROOT, 'scripts/.out'), { recursive: true });
    writeFileSync(join(ROOT, 'scripts/.out/orbit-result.json'), JSON.stringify({ lists, stats: orbit.stats }, null, 1));
  }
}

// A standalone page (kit pageHtml + the 3D runtime) with window.setU(u) for probes and turn-check.
function verifyPage() {
  const strip = (file) => readFileSync(file, 'utf8').replace(/^export /gm, '');
  const pose = strip(join(ROOT, 'src/robot/pose.js'));
  const css = `${out.css}
body{margin:0;background:#101010}
.robot-stage{position:relative;width:1200px;height:800px;--brain:0}
.robot-stage>svg{position:absolute;inset:0;width:100%;height:100%}
.robot-stage [data-brain]{opacity:var(--brain)}
.robot-stage.iso{--anatomy-paper:#3b3b3b;--anatomy-top:#626262;--anatomy-face:#dedede;--anatomy-shade-0:#222222;--anatomy-shade-1:#333333;--anatomy-shade-2:#444444;--anatomy-shade-3:#555555;--anatomy-hi:#d1d1d1;--anatomy-mid:#afafaf;--anatomy-lo:#888888;--anatomy-faint:#999999;--anatomy-dot:#f0f0f0;--anatomy-weight:.7px;--anatomy-lit-top:#e0e0e0;--anatomy-lit-shade:#999999;--anatomy-lit:#fafafa}`;
  const stage = `<div class="robot-stage iso iso-turn" data-theme="dark" data-host="hero" role="img" aria-label="${LABEL}"><svg class="iso-svg robot-back" viewBox="0 0 ${W} ${H}" aria-hidden="true">${back}</svg><svg class="iso-svg robot-body" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>${data.arm}</div>`;
  const live = `${pose}
const DATA = ${JSON.stringify({ turn: out.data, travel: TRAVEL, zPx, H })};
const stage = document.querySelector('.robot-stage');
const controller = TURN.mount(stage, DATA.turn, {});
const pieces = [...stage.querySelectorAll('.robot-body [data-piece]')];
const armSvg = stage.querySelector('svg[data-live]');
window.setU = (u) => {
  const s = stateAt(u);
  const st = controller.set(groupsOf(s.values));
  for (const el of pieces) el.setAttribute('transform', 'translate(0 ' + (DATA.zPx * (DATA.travel[el.dataset.piece] ?? 0) * (s.shares[el.dataset.piece] ?? 0)).toFixed(2) + ')');
  armSvg.style.transform = 'translateY(' + ((100 * DATA.zPx * DATA.travel.top * s.shares.top) / DATA.H).toFixed(3) + '%)';
  stage.style.setProperty('--brain', s.lit.toFixed(3));
  stage.dataset.u = u;
  return st;
};
window.setU(0);
${out.verify ? `window.__isoVerify = ${JSON.stringify(out.verify)};` : ''}`;
  return k.pageHtml({ title: 'SC-01 verify', theme: 'dark', body: `<style>${css}</style>${stage}`, script: strip(join(HERE, 'anatomy/turn.mjs')) + live, width: 1200 });
}
