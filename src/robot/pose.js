// SC-01 pose contract (spec §6.2). Pure: no DOM. Imported by the build, the client and the tests.
// Angles in degrees, slides and lifts in world units (1 u = 2 mm). u runs 0..1 in the pinned hero and 1..2 across the berths.

export const TRAVEL = { battery: 50, compute: 100, top: 150 };
export const REDUCED_U = 0.49; // inside the Anatomy hold, so the still frame and its caption agree

const key = (J1, J2, J3, tau, grip, pan) => Object.freeze({ J1, J2, J3, tau, grip, pan });
export const KEYS = Object.freeze({
  STOW: key(0, -40, 85, 150, 0, 0),
  READY: key(0, 0, 0, 180, 0, 40),
  // (spec J1 80, J2 35, J3 −5, τ 135, which folded onto the deck): arm out past the left edge, under the mast foot on screen,
  // wrist straight (J4 −90) so forearm and open gripper aim at caption 04's link; the fingertips stay clear of the floor tape
  POINT: key(106, 80, -66, 104, 6, 80),
  // Geometry G2 retuned the berth keys (spec 2.4 values in brackets). The forearm stays more than 38° off the camera-locked light axis
  // in every berth move: pointed down toward screen-right it crossed the round's band thresholds, which the orbit audit fails.
  WORK: key(-50, 25, -28, 180, 6, -50), // (J2 30, J3 10): forearm level, tool straight down
  EXPERIENCE: key(0, -20, 45, 180, 0, 0), // (J3 70)
  ABOUT: key(20, -10, -20, 90, 3, 40), // (J1 40): at 40 every slab plane is edge-on and the joints read as flat boxes
  CONTACT: key(-50, 40, -35, 115, 6, -50), // (J2 25, J3 -30, tau 100): long and level, so crop.dock keeps aspect >= 1.2
});
export const DOCK = Object.freeze({ work: 1.25, experience: 1.5, about: 1.75, contact: 2 });
export const CHAPTERS = Object.freeze([
  { id: 'language', name: 'Language', from: 0.04, to: 0.22, hold: [0.22, 0.26], jump: 0.23, shows: 0.12 },
  { id: 'anatomy', name: 'Anatomy', from: 0.26, to: 0.48, hold: [0.48, 0.52], jump: 0.49, shows: 0.24 },
  { id: 'perception', name: 'Perception', from: 0.52, to: 0.74, hold: [0.74, 0.77], jump: 0.7475, shows: 0.5 },
  { id: 'action', name: 'Action', from: 0.77, to: 0.95, hold: [0.95, 1], jump: 0.975, shows: 0.755 },
]);
export const RANGES = Object.freeze({ sh: [-45, 80], el: [-70, 90], wr: [-90, 5] });

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const S = (a, b, u) => {
  const t = clamp01((u - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const BERTH_KEYS = [KEYS.POINT, KEYS.WORK, KEYS.EXPERIENCE, KEYS.ABOUT, KEYS.CONTACT];
const J4of = ({ J2, J3, tau }) => tau - 180 - J2 - J3; // the tool rule: tau is the absolute tool pitch from vertical

export function stateAt(input) {
  const u = Math.min(2, Math.max(0, Number(input) || 0));
  if (u > 1) {
    const i = Math.min(3, Math.floor((u - 1) / 0.25));
    const t = S(0, 1, (u - 1 - i * 0.25) / 0.25);
    const a = BERTH_KEYS[i];
    const b = BERTH_KEYS[i + 1];
    const v = Object.fromEntries(['J1', 'J2', 'J3', 'tau', 'grip', 'pan'].map((n) => [n, a[n] + (b[n] - a[n]) * t]));
    return {
      values: { J1: v.J1, J2: v.J2, J3: v.J3, J4: J4of(v), tau: v.tau, grip: v.grip, pan: v.pan, cap: 0 },
      shares: { battery: 0, compute: 0, top: 0 },
      lit: 0, status: 1, scan: 0, sweep: 720, exit: 1,
    };
  }
  const v = {
    J1: 106 * S(0.77, 0.85, u),
    J2: -40 + 40 * S(0.05, 0.18, u) + 80 * S(0.79, 0.89, u),
    J3: 85 - 85 * S(0.06, 0.2, u) - 66 * S(0.8, 0.9, u),
    tau: 150 + 30 * S(0.08, 0.21, u) - 76 * S(0.82, 0.91, u),
    grip: 6 * S(0.88, 0.93, u),
    pan: 40 * S(0.12, 0.2, u) + 40 * S(0.62, 0.7, u),
    cap: 7 * S(0.36, 0.44, u) - 7 * S(0.52, 0.56, u),
  };
  return {
    values: { J1: v.J1, J2: v.J2, J3: v.J3, J4: J4of(v), tau: v.tau, grip: v.grip, pan: v.pan, cap: v.cap },
    shares: {
      battery: S(0.32, 0.46, u) - S(0.52, 0.57, u),
      compute: S(0.29, 0.43, u) - S(0.53, 0.58, u),
      top: S(0.26, 0.4, u) - S(0.54, 0.6, u),
    },
    lit: S(0.4, 0.46, u) - S(0.55, 0.59, u),
    status: S(0.04, 0.12, u),
    scan: S(0.58, 0.62, u) - S(0.7, 0.74, u),
    sweep: 720 * S(0.58, 0.72, u),
    exit: S(0.05, 0.14, u),
  };
}

// Engine group values. Sign fixes for the engine's hinge/turn conventions live here only (probe-verified at G0: none needed).
export function groupsOf(v) {
  return { yaw: v.J1, sh: v.J2, el: v.J3, wr: v.J4, fA: v.grip, fB: v.grip, pan: v.pan, capJ2: v.cap, capJ3: v.cap };
}

export function chapterAt(u) {
  return CHAPTERS.filter((c) => u >= c.shows).length;
}

const deg = (x) => {
  const r = Math.round(x);
  return r < 0 ? `−${-r}` : `${r === 0 ? 0 : r}`;
};
export function readoutAt(u) {
  const s = stateAt(u);
  const { J1, J2, J3, J4 } = s.values;
  switch (chapterAt(u)) {
    case 0: return `Parked · J2 ${deg(J2)}° · J3 ${deg(J3)}°`;
    case 1: return `Plan: look · reach · point · J2 ${deg(J2)}° · J3 ${deg(J3)}°`;
    case 2: return `Apart ${Math.round(s.shares.top * 100)}% · lift 300 / 200 / 100 mm`;
    case 3: return `Plan: look ✓ · reach · point · scan ${Math.round(s.sweep)}°`;
    default: return u >= 0.93 ? 'Plan: look ✓ · reach ✓ · point ✓' : `J1 ${deg(J1)}° · J2 ${deg(J2)}° · J3 ${deg(J3)}° · J4 ${deg(J4)}°`;
  }
}

const ANGLES = ['yaw', 'sh', 'el', 'wr', 'pan'];
const SLIDES = ['fA', 'fB', 'capJ2', 'capJ3'];
const moved = (a, b) => ANGLES.some((n) => Math.abs(a[n] - b[n]) > 0.3) || SLIDES.some((n) => Math.abs(a[n] - b[n]) > 0.2);
const EDGES = new Set([0, 1, 2, ...CHAPTERS.flatMap((c) => [c.from, c.to, ...c.hold, c.jump, c.shows]), ...Object.values(DOCK)].map((x) => Math.round(x * 1e4)));
let sampled = null;
// Ascending u on a 1e-4 grid: a state is kept just before any group angle would move > 0.3° or any slide > 0.2 from the last kept one,
// so consecutive states never differ by more; key and hold edges are always kept.
export function sampleU() {
  if (sampled) return sampled.slice();
  const out = [0];
  let last = groupsOf(stateAt(0).values);
  let prev = last;
  for (let i = 1; i <= 20000; i++) {
    const u = i / 1e4;
    const g = groupsOf(stateAt(u).values);
    if (moved(g, last) && out[out.length - 1] !== (i - 1) / 1e4) {
      out.push((i - 1) / 1e4);
      last = prev;
    }
    if (EDGES.has(i) || i === 20000) {
      out.push(u);
      last = g;
    }
    prev = g;
  }
  sampled = out;
  return out.slice();
}

export function liftStates() {
  const out = [];
  const seen = new Set();
  for (let i = 0; i <= 68; i++) {
    const u = Math.round((0.26 + i * 0.005) * 1e4) / 1e4;
    const { shares } = stateAt(u);
    const id = [shares.battery, shares.compute, shares.top].map((x) => x.toFixed(5)).join('|');
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ label: `u ${u.toFixed(3)}`, shares: { base: 0, ...shares } });
  }
  return out;
}

const B = [40, 0];
const S0 = [40, 0, 172];
const MAST_TOP = [-98, -53, 234];
const pitch = (p) => [Math.sin((p * Math.PI) / 180), 0, Math.cos((p * Math.PI) / 180)];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
// Joint centres in world units, on the hinge plane (yaw-frame y = 0), turned by J1 about the arm base axis; unlifted.
export function fk(values) {
  const { J1 = 0, J2 = 0, J3 = 0 } = values;
  const tau = values.tau ?? 180 + J2 + J3 + (values.J4 ?? 0);
  const E = add(S0, pitch(J2), 110);
  const W = add(E, pitch(90 + J2 + J3), 100);
  const local = { B: [40, 0, 108], S: S0, E, W, W5: add(W, pitch(tau), 26), tip: add(W, pitch(tau), 68) };
  const c = Math.cos((J1 * Math.PI) / 180);
  const s = Math.sin((J1 * Math.PI) / 180);
  const yaw = ([x, y, z]) => [B[0] + (x - B[0]) * c - y * s, B[1] + (x - B[0]) * s + y * c, z];
  const out = Object.fromEntries(Object.entries(local).map(([n, p]) => [n, yaw(p)]));
  out.mastTop = MAST_TOP.slice();
  return out;
}
