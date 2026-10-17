# Final build spec: SC-01 landing robot

**Base:** the judges' winner, "Unit M1". It keeps M1's two mechanisms:
- The lift is a CSS translate.
- Each arm link sits in its own slab along the joint axis.

**Grafted in:**
- From Errand: the story spine (Language, Anatomy, Perception, Action), the joint caps, the camera pan and the single graphite finish.
- From SC-01: the keep-out boxes, captions that change only during holds, a shorter pin and the tool-pitch J4 rule.

**Also extended:** berths now work down to 900 px.

Every number is a starting value unless it says otherwise. The build asserts and the audit set the final values.

---

## 0. Decisions, and how each judge flaw is resolved

| Topic | Decision | Flaw it removes |
|---|---|---|
| Object | One mobile manipulator, **SC-01**: an AMR tub with the battery, compute bay and deck lid inside it, a sensor mast with a pan camera, and a 4-DOF-driven UR-style arm. J5 and J6 are drawn but do not move. It has a parallel gripper and joint caps that slide off to show the gearboxes. | M1 had no gearbox reveal, but the user asked for "joints lift apart to show motors/gearboxes". |
| Lift-apart | Static items move with an SVG `translate`. The live arm SVG and the mast move with a CSS `translateY`. **The arm's joints (J1–J3, τ, grip) stay at READY whenever any lift share is above 0.** Only the caps and the pan move during lift. | The Errand and SC-01 explodes re-projected every part on every frame. |
| Arm geometry | UR slab layout. Every hinge axis is y in the yaw frame and each link sits in its own y-slab, so a plane y = const separates neighbouring links at any angle. The caps sit on the +y end faces, which face the viewer. | Large hinge ranges went past what the engine has proven. |
| Story | Language, then Anatomy, then Perception, then Action, then hand-off. **The reassembly happens in Perception**, so Action contains only the arm unfolding. | M1's chapter 4 was crammed. "Assemble" was missing. |
| Pin | 360svh (260svh of scrub, 2,340 px at a 900 px viewport). | Errand's 400svh. |
| Travel | **Berths** are boxes reserved in each section's own layout. One stage node moves into them, but only while its current host is off screen. Arriving at a berth plays exactly one audited pose segment of 700 ms, and then the robot holds still. Berths are shown at ≥ 900 px wide and > 740 px tall. | A fixed corner dock covers text. M1's berths started at 1100 px only. |
| Hand-off | The pin ends with the arm pointing at the caption-04 link. The robot scrolls away with the hero. It reappears in the Work berth in that same POINT pose, then moves to WORK. There is no fly-over through the flying preview cards. | M1's hard cut (it now arrives in the pose it left in). The Errand overlay drifted against native scroll. |
| Finish | One graphite token set everywhere, with no theme switch. On paper it reads as a dark machine. | M1's theme pop. |
| WebGL | One back canvas with floor light: the status pool plus two scroll-linked safety-lidar sweeps. It runs only in the pinned hero, uses white only, and is screen-blended. | — |
| Live cost | 24 live parts, cost ≤ 50 (asserted by `turn-bench`). | SC-01's cost of 55. |

**Explicitly not built:** HMI typing, a charging dock, a floor plate, a load-time assemble animation, a "Hide robot" toggle, a stage scale-down, a travel overlay, a smooth-scroll library, or any idle loop.

---

## 1. Object and mechanism

### 1.1 World and camera

- **Units:** 1 world unit = 2 mm. z is up, the floor is z = 0, and +x is the robot's front.
- **Camera:** azimuth 40°, elevation 30°. The kit projection is:
  `sx = 0.643·x − 0.766·y`, `sy = 0.383·x + 0.321·y − 0.866·z` (× scale, + origin).
  So +x goes down-right on screen, +y goes left and slightly down, and −x−y goes up and away. The +x and +y faces are the visible ones.
- **Yaw convention:** J1 is the arm's direction in the floor plane, measured from +x counter-clockwise.

  | J1 | Direction on screen |
  |---|---|
  | −50° | screen-right |
  | +40° | straight toward the viewer (screen-down) |
  | +80° | left and down, toward the caption column |

  Signs must be verified with one probe render (§7, G0). If the engine's hinge or turn sign is reversed, negate it in `groupsOf()` only.
- **Hero viewBox:** 1200×800.
  `P = k.fitProjection(heroHull, 680, 626, {pad:0, azimuth:40, elevation:30})`, then `P.origin = [P.origin[0]+470, P.origin[1]+64]`. Do this before any `k.iso` call.
  - The fit sub-box is **[470, 64, 1150, 690]**.
  - The keep-outs are: headline and captions x < 470, toolbar y < 64, rail x > 1150.
  - y ≤ 690 keeps the robot above the fold at load, even though the 104 px header pushes the sticky frame down.
  - `heroHull` is the union over every hero state u ∈ [0, 1], sampled every 0.01:
    - static bbox corners at their lift;
    - arm and mast `fk` points ± 16 on each axis, lifted by 150·s_top;
    - the floor marks.

### 1.2 Layout (z ranges in world units)

| Item | Plan | z |
|---|---|---|
| Chassis tub | 240 × 150, r 18, centred | floor plate 8–12, walls 12–100 |
| Drive wheels (outboard) | centres (0, ±84), r 24, width 14 | 0–48 |
| Casters | (±90, ±50), r 8 | 0–16 |
| Battery (inside tub) | 160 × 110 | 16–62 |
| Compute bay (inside tub) | 170 × 120 | 64–96 |
| Deck lid (sits on walls) | 240 × 150, r 18 | 100–108 |
| Arm base axis B | (40, 0) | flange from 108 |
| Mast axis | (−98, −53): the rear corner farthest from the viewer, always behind the arm | 108–234 |
| Corner safety lidars | (120, −75) heading −35°, and (−120, 75) heading 145°, fov 270° each | 20–40 |

**Rule:** no static part rises above z 108 (the deck top). Anything that sticks up above the deck is live (mast, arm base).

### 1.3 Static parts (89, kit `R.put`, shared painter order)

| Group (layer, piece, lift) | Parts | Count |
|---|---|---|
| Floor (`back`, `base`, 0) | 4 floor-tape corner L-marks around a 400 × 300 bay (flat lines, z 0); front ruler strip with ticks every 25 u (= 50 mm); `k.haloOf` shadow under the tub (not a part) | 5 |
| Chassis (`body`, `base`, 0) | floor plate; 4 walls (front, rear, ±y; convex slabs, 6 thick); front and rear bumpers (`lo`, z 14–40); 4 corner guard posts; 4 status-band strips (z 88–92, `hi`); 2 corner lidars × (base, window band `lo`, head); 2 wheels × (tyre, hub, hub cap); 4 casters × (swivel plate, fork, wheel); e-stop on the +y wall near the rear (collar, mushroom); 2 handles on the front and rear walls; 2 charge contacts on the rear wall | 45 |
| Battery (`body`, `battery`, **50**) | tray; 6 cell modules in a 3 × 2 grid; 2 busbars; 2 terminal posts; BMS board; 2 handles | 14 |
| Compute, "the brain" (`body`, `compute`, **100**) | tray plate; 4 standoffs; carrier board; SoC base; **SoC lid**, emitted twice: unlit, plus a `lit` overlay `<g data-brain>` whose opacity follows `var(--brain)`; 2 memory modules; M.2; 3 connector blocks; power stage; 5 heatsink fins (top at 96) | 20 |
| Deck lid (`body`, `top`, **150**) | deck plate (seams, screw dots, arm bolt circle, mast foot outline and label rules all drawn as flat lines on top); 4 edge trims (z 100–106) | 5 |

- **Materials:** none. Use kit greys only; steel, chrome and gunmetal have a blue cast.
- **Details:** use `details`, never extra parts.

### 1.4 Live parts (24, layer `arm`, `T.stack(["back","body","arm"])`)

All coordinates below are in the **yaw frame at READY** (J1 = 0, all hinges 0).

**Joint centres:**

| Point | Position | Note |
|---|---|---|
| S | (40, 0, 172) | |
| E | S + (0, 0, 110) = (40, 0, 282) | |
| W | E + (100, 0, 0) = (140, 0, 282) | |
| W5 | W + (0, 0, −26) | |
| Tool tip | (140, 0, 214) | at READY |

**y-slabs** (each knuckle disc opens its slab):

| Owner | y range |
|---|---|
| yaw | [−18, 18] (cap to 29 when slid out) |
| sh, slab A | [−46, −18] |
| el, slab B | [−70, −46] |
| wr, slab C | [−92, −70] |

**Groups and parts:**

| Group (kind) | Parts | Cost |
|---|---|---|
| — (no group: mast, ordered but never re-projected) | foot clamp prism 20 × 20, z 108–114; post round r 4, z 114–216 (fixed); lidar puck r 10, z 216–230 (fixed); cap r 7, z 230–234 (fixed) | 2.5 |
| `pan` (turn, pivot = mast axis; 0 means the camera faces +x) | bracket prism at z 180–190; camera bar prism 8 × 28 × 9 centred 15 u off the axis; two lens rings via `T.plane` | 2 |
| `yaw` (turn, pivot (40, 0)) | base flange r 22, z 108–114 (fixed); J1 housing r 18, z 114–156 (fixed); J2 housing r 16, axis y, centre S, y −18..18. The J2 housing rests tangent on top of J1. Strain-wave detail on its +y face (y = 18): `bolts` circle r 11 × 8, `rings` r 6, 9 and 13. | 4 |
| `capJ2` (slide, child of `yaw`, direction +y, travel 7) | cap round r 16, y 18..22 | 3 |
| `sh` (hinge at S, axis y) | knuckle disc r 16, y −20..−18 (touches the J2 housing face); upper link round r 13 centred y −32, dome centred at S, flat end tangent to the J3 housing; J3 housing r 13, axis y, centre E, y −46..−18, with the same strain-wave details on its +y face | 9 |
| `capJ3` (slide, child of `sh`, +y, travel 7) | cap r 13 at E, y −18..−14 | 3 |
| `el` (hinge at E, axis y) | knuckle r 13, y −48..−46; forearm round r 11 centred y −59 (E dome, flat end tangent to J4); J4 housing r 11 at W | 9 |
| `wr` (hinge at W, axis y) | knuckle r 11, y −72..−70; wrist link r 9 centred y −81 (W to J5); J5 housing r 10, axis x (rigid); J6 flange r 9 along the tool axis (rigid); gripper body prism 26 × 18 × 14, y half-width 9 | 13 |
| `fA`, `fB` (slides, children of `wr`, ±x′ in the tool frame, travel 6) | finger prisms 6 × 4 × 22 with pad `seams` | 2 |

**Totals:** 24 live parts, cost about 47 (rounds counted at 3) and ≤ 50 by `turn-bench`. Over budget, merge the J6 flange into the J5 housing as `bolts`/`seams` (−3).

The whole robot is **89 static + 24 live = 113 parts.**

**Joint rule (3d.md §5).** Each knuckle disc is coaxial with its hinge, belongs to the child group and touches the parent housing face. Each link fills its slab exactly from the knuckle face, so it touches the knuckle within its own group. If `rigid` still says `support loose`, adjust the radius or centre so the faces touch (do not add a gap).

**No live tubes.** Cables are routed inside the arm. There are no balls and no lathes.

### 1.5 Hinge values and the tool rule

- **Group values:**
  `groupsOf(v) = { yaw:v.J1, sh:v.J2, el:v.J3, wr:v.J4, fA:v.grip, fB:v.grip, pan:v.pan, capJ2:v.cap, capJ3:v.cap }`
- **J4 is derived from τ:** `J4 = τ − 180 − J2 − J3`. τ is the absolute tool pitch from vertical: 180 is straight down, 90 is level.
  The other absolute pitches are: upper arm = J2, forearm = 90 + J2 + J3.
- **Hinge ranges** (`T.group` ranges): sh [−45, 40], el [−35, 90], wr [−85, 5].
  The ranges are **derived, not designed**: the test asserts that every sampled value lies inside them. If interpolation exceeds one, widen that range.

---

## 2. Pinned landing storyboard

### 2.1 Modes

| Mode | When | Hero |
|---|---|---|
| **pinned** | `(min-width:900px) and (min-height:741px)` and not reduced | `.landing` 360svh, `.hero-sticky` sticky top 0, 100svh. Full-bleed `.hero-frame` with width `min(100%,150svh)`, `aspect-ratio:3/2`, centred. `container-type:inline-size`. |
| **in-flow** (phones, tablets, short desktops) | otherwise, with motion | no pin. Order: toolbar, h1, description, CTA, figure (phone crop), captions as a static `<ol>`, readout, foot. At ≥ 900 wide and ≤ 740 tall: copy on the left, figure on the right. |
| **reduced** | `prefers-reduced-motion` (can change live) | in-flow layout, static `u = REDUCED_U = .50`, "Inspect assembly" visible |

### 2.2 Progress

- **Pinned:** `uT = separationAt(landing.top, landing.height, innerHeight)` (existing helper). Then `u = follow(u, uT, dt)` (existing helper, τ .16 s, snaps below 1e-4).
- **In-flow with motion:** `uT = .50·clamp((.92·vh − slot.top)/(.62·vh))`. That plays Language and Anatomy as the figure crosses the viewport.
- **Channels:** every channel is a smoothstep `S(a,b,u)` between keys and holds outside its window.

### 2.3 Chapters (u)

| u | Chapter | Motion (start → end over [a, b]) |
|---|---|---|
| 0–.04 | Rest (poster) | STOW, assembled, floor light off |
| .04–.22 | **01 Language** | status 0→1 [.04,.12]; **exit** 0→1 [.05,.14]; J2 −40→0 [.05,.18]; J3 85→0 [.06,.20]; τ 150→180 [.08,.21]; pan 0→40 [.12,.20] (camera turns to the reader) |
| .22–.26 | hold | — |
| .26–.48 | **02 Anatomy** | s_top 0→1 [.26,.40]; s_compute 0→1 [.29,.43]; s_battery 0→1 [.32,.46]; cap 0→7 [.36,.44] (gearbox faces show); lit 0→1 [.40,.46] (SoC lights once the deck has cleared it) |
| .48–.52 | hold (= REDUCED_U .50) | exploded, brain lit |
| .52–.74 | **03 Perception** | cap 7→0 [.52,.56]; reassembly from the bottom up: s_battery 1→0 [.52,.57], s_compute 1→0 [.53,.58], s_top 1→0 [.54,.60]; lit 1→0 [.55,.59]; scan 0→1 [.58,.62]; sweep 0→720° [.58,.72]; scan 1→0 [.70,.74]; pan 40→80 [.62,.70] (from the reader to where the work is) |
| .74–.77 | hold | — |
| .77–.95 | **04 Action** | J1 0→80 [.77,.85]; J2 0→35 [.79,.89]; J3 0→−5 [.80,.90]; τ 180→135 [.82,.91]; grip 0→6 [.88,.93] |
| .95–1 | hold, then the pin releases | POINT: the gripper aims at the caption-04 link |

**Invariants (unit-tested):**
- The shares satisfy `s_top ≥ s_compute ≥ s_battery` at every u.
- The arm joints are constant whenever any share is above 0.
- Every channel is constant inside each hold.

### 2.4 Keys

`J4` follows from the τ rule.

| Key | u | J1 | J2 | J3 | τ | J4 | grip | pan | Meaning |
|---|---|---|---|---|---|---|---|---|---|
| STOW | 0 | 0 | −40 | 85 | 150 | −75 | 0 | 0 | transport fold, tip z ≈ 127 |
| READY | .22–.77 | 0 | 0 | 0 | 180 | 0 | 0 | 40 | the "L", tool down |
| POINT | .95–1.00 | 80 | 35 | −5 | 135 | −75 | 6 | 80 | points left-down at "See the work" |
| WORK | 1.25 | −50 | 30 | 10 | 180 | −40 | 6 | −50 | reaches toward "Here's the work.", tool down at the rule |
| EXPERIENCE | 1.50 | 0 | −20 | 70 | 180 | −50 | 0 | 0 | compact carrying pose |
| ABOUT | 1.75 | 40 | −10 | −20 | 90 | −60 | 3 | 40 | tool and camera turned toward the reader |
| CONTACT | 2.00 | −50 | 25 | −30 | 100 | −75 | 6 | −50 | open gripper toward the ↗ arrow |

For u ∈ [1, 2], each 0.25 segment smoothsteps every channel from one key to the next. The shares, lit and scan are all 0 there, and status is 1.

### 2.5 Captions

- **Structure:** one slot at the lower left of the frame (x 0–38%, y 60–92%). It is `ol.story-captions` with 4 `li.story-caption`, all stacked in one grid cell.
- **Current item:** opacity 1 with `aria-current="step"`. The others are at opacity 0 but stay readable by screen readers.
- **Crossfade:** 240 ms CSS, with an 8 px rise.
- **When captions change:** chapter c = 0 for u < .12, 1 for u < .24, 2 for u < .50, 3 for u < .755, and 4 otherwise. The changes therefore fall inside holds, except the first one, which coincides with the headline exit.

| # | Index line | Title (`h2.story-title`) | Body |
|---|---|---|---|
| 1 | 01 — Language | It starts with a sentence. | "Show me the work." A language model turns plain words into a short plan, and software checks the plan before anything moves. |
| 2 | 02 — Anatomy | Every part has a job. | Power, compute, sensing and motion. The model runs on board, the sensors feed it, and the arm carries out what it decides. |
| 3 | 03 — Perception | It looks before it moves. | Lidar maps the space around it and the camera finds what matters. Perception turns pixels into places. |
| 4 | 04 — Action | Then it does the work. | Each joint follows the checked plan, one step at a time. I train this kind of behaviour in simulation first. **See the work ↓** (`href="#work"`) |

**Readout** (`output.robot-readout`, `aria-live="off"`, Manrope 12 px, tabular numerals, written only when the string changes, minus sign U+2212):

| Chapter | Readout |
|---|---|
| 0 | `Parked · J2 −40° · J3 85°` |
| 1 | `Plan: look · reach · point · J2 {J2}° · J3 {J3}°` |
| 2 | `Apart {round(s_top·100)}% · lift 300 / 200 / 100 mm` |
| 3 | `Plan: look ✓ · reach · point · scan {round(sweep)}°` |
| 4 | `J1 {J1}° · J2 {J2}° · J3 {J3}° · J4 {J4}°`, and at u ≥ .93: `Plan: look ✓ · reach ✓ · point ✓` |

Below the readout: `p.robot-label` "SC-01 · mobile manipulator · illustrative study" (DESIGN.md requires the label).

### 2.6 Headline and hero copy

- `.hero-copy` sits at the top left of the frame, at most 38% of its width. It holds:
  - the **unchanged h1** (`aria-label`, `.headline-line>span` wrappers, entrance animation);
  - `.hero-description` with the "View selected work" button;
  - `.hero-foot`.
- h1 size: `clamp(72px, 9.2cqi, 150px)`.
- **Exit:** `.hero-copy{transform:translateY(calc(var(--exit)*-32px));opacity:calc(1 - var(--exit))}` plus `.hero-copy:focus-within{transform:none;opacity:1}`. This sits on the container, so it never fights the entrance animation.

### 2.7 Toolbar and rail

- **Toolbar** (top of the frame, always visible):
  - location;
  - **Skip intro ↓**: `a.skip-intro` with `href="#work"`. The click handler scrolls there instantly, so it does not scrub through the story;
  - the existing **Pause/Resume motion** button. Its labels are unchanged.
- **Rail** (pinned only): `nav.story-rail` with `aria-label="Story chapters"` on the right edge.
  - `span.rail-count` ("02 / 04"), plus a hairline whose `scaleY(var(--p))` fills with progress.
  - 4 buttons, each 44 × 44, `data-chapter="1..4"`, `aria-label="Chapter 2 of 4: Anatomy"`, with `aria-current="step"` on the current one.
  - A click scrolls to that chapter's hold: u .24, .50, .755 or .975. The scroll is smooth when motion is on and instant otherwise.

### 2.8 Hand-off

- At u = 1 the robot is in POINT, aimed at "See the work ↓".
- The pin releases and the robot scrolls up with the hero.
- The flying preview cards and type rows play with no robot visible.
- The robot next appears in the Work berth, still in POINT, and plays POINT → WORK (§3.3).

---

## 3. Travelling robot (berths)

### 3.1 Berths

A berth is `div.robot-berth[data-robot-slot=<name>][aria-hidden=true]` with `pointer-events:none` and `overflow:clip`. Its aspect ratio is `var(--dock-aspect)` (`crop.dock` w/h).

**Shown only with** `@media (min-width:900px) and (min-height:741px) and (prefers-reduced-motion:no-preference)`. Otherwise it gets `display:none`.

**Width:** 300 px at ≥ 1200 wide, 220 px at 900–1199. Height = width / aspect. Build assert: aspect ≥ 1.2.

| Berth | Container | Placement | Ground |
|---|---|---|---|
| work | `#work .section-heading` (`position:relative`) | absolute, `bottom:0` (stands on the heading hairline); runtime centres it in the gap between `h2` and `p` | paper |
| experience | `#experience .section-heading` | same as work | paper |
| about | `.about-grid > div:first-child`, after "Read my résumé" | in flow, `margin-top:56px`, left-aligned | graphite |
| contact | `.contact-title` (`position:relative`) | absolute, `bottom:0` (on the h2 bottom); runtime centres it between `h2` and the arrow `svg` | black |

**Layout reservation:**
```css
.section-heading:has(> .robot-berth:not([data-fit=no])) { min-height: var(--berth-h); }
```
h2 and p already align to `flex-end`, so the berth fits inside the heading row. About uses the empty space under the link (≥ 361 px at every measured width). Contact uses the empty middle of the title row.

**Measured gaps** (from this session's probe, document px):

| Width | Work h2 → p | Exp h2 → p | Contact h2 → arrow | About space under link |
|---|---|---|---|---|
| 1440 | 534 → 1100 (566) | 561 → 1116 (555) | 792 → 1258 (466) | 361 |
| 1280 | 476 → 948 (472) | 500 → 964 | 709 → 1106 | 378 |
| 1200 | 446 → 872 (426) | 469 → 888 | 665 → 1030 (365) | 410 |
| 1024 | 381 → 705 (324) | 400 → 721 | 567 → 863 (296) | 427 |
| 900 | 335 → 587 (252) | 352 → 603 (251) | 498 → 745 (247) | 466 |

At 900–~940 px the Work, Experience and Contact berths are expected to fail the fit check and hide. That is by design.

**Fit check.** It runs on mount, on resize and after fonts are ready.
1. Centre the absolute berths: `left = (first.right + last.left − width)/2 − parent.left`.
2. Inflate the berth rect by 24 px. Test it against every `h1,h2,h3,p,a,li,summary,button,svg` rect in its section, excluding the berth's own ancestors (the contact `<a>`) and the robot itself.
3. The berth must also lie inside its section's rect, inset by 24 px.
4. On failure set `data-fit="no"` (`visibility:hidden`), which drops the `min-height` reservation.

### 3.2 Host rule (one stage node)

**Hosts:** the hero slot plus every enabled berth (displayed and not `data-fit=no`).

**On scroll:**
- If the current host's rect is outside the viewport, choose the enabled host whose rect centre is nearest `innerHeight/2`.
- If that is a different host, **append the stage there**. This move is never seen.

**On arrival at a berth:**
- Set `u = clamp(u, target − .25, target + .25)` and also u ≥ 1. The visible reaction is then exactly one audited segment.
- Set `data-host`, `aria-hidden="true"`, and remove `role` and `aria-label`.
- If the berth is already in view and motion is on, add `.robot-arriving` (opacity 0 → 1 over 200 ms).

**On returning to the hero:** `u = uT` (snap), and restore `role="img"` and `aria-label`.

The stage sizes itself in a berth from the crop vars, so TURN's own ResizeObserver resamples (one `prepare`, about 17 ms, while off screen):

```css
.robot-berth .robot-stage {
  position: absolute;
  width: calc(100% * var(--vb-w) / var(--crop-w));
  left: calc(-100% * var(--crop-x) / var(--crop-w));
  top: calc(-100% * var(--crop-y) / var(--crop-h));
}
```

The same mechanism handles the phone crop in the in-flow hero slot.

### 3.3 Transitions

- **Trigger:** the current berth's top is above `0.8·innerHeight` and `u ≠ target`.
- **Motion:** `anim = {from: u, to: target, t0}`, then `u = from + (to−from)·S(0, 1, (now−t0)/700)`.
- **Afterwards:** the robot is still. No loop, no hover effects.
- **Scrolling up:** the same rules apply in reverse. Every path reaches a berth within one segment.
- **Theme:** one graphite finish everywhere. The graphite tokens move from the old `.system-figure.iso` rule to `.robot-stage.iso`, unchanged.
- **Parked rendering** (`.robot-stage:not([data-host=hero])`):
  - `ctrl.set(…, {detail: 0})`;
  - `.iso-line[data-tone=faint]{display:none}`;
  - `--anatomy-weight:.5px`;
  - `.robot-back` and `.robot-gl` hidden.

### 3.4 Pause, reduced motion and dismiss

- **Pause:**
  - The hero u is frozen.
  - Captions, rail and exit follow `uT`, because they are text.
  - Berth arrivals and triggers snap straight to the target pose, with no animation and no fade.
- **Reduced motion:** berths are hidden by CSS, so the stage stays in the hero slot.
- **No dismiss control.** Berths are inert, sit in reserved space and are covered by Pause.

---

## 4. WebGL: floor light (one effect)

**Canvas:** one `canvas.robot-gl` (`aria-hidden`) placed between `.robot-back` and `.robot-body`. It covers exactly the SVG box and uses `mix-blend-mode:screen`.
- Created lazily, only on the first pinned-hero frame. It is never created in-flow, in reduced motion or at 390/320.
- Hidden when the host is not the hero.

**Terms** (world space via `onFloor(vb, 0.)`, sizes in world units × `uK`):

1. **Status pool.** `uStatus·0.16·exp(−d²/(2·34²))`, where d is the signed distance outside the chassis footprint (240 × 150, r 18). It is windowed to 0 at d = 90.
2. **Lidar sweeps.**
   - For each of the two lidars, `beam = heading + uSweep (mod 360)`.
   - The light is visible only inside the 270° FOV, with edges softened over 8°.
   - Trail: `exp(−Δθ/0.6 rad)` behind the beam.
   - Radial window: `smoothstep(6,14,r)·(1−smoothstep(110,160,r))`.
   - Peak `0.22·uScan`.

**Output:**
- White only, then `tonemap` and dither.
- Premultiplied, with alpha = max channel.
- `maxRatio` 1.5.
- Everything falls to 0 at least 10 px inside the canvas edge.
- `uLight = 0`, `uTime = 0`.

**When it draws:**
- Uniforms are pure functions of the eased u: `status`, `scan`, `sweep` from `stateAt`.
- The runtime calls `draw` only when an input changed by more than 1e-3, so drawing stops when scrolling stops.
- When `status + scan < 1e-3` it calls `clear()`.

**Fallback:** `glLayer` returns null, so `createFloorLight` returns null and every call is guarded. Without WebGL there is no light and nothing replaces it; the drawing is complete on its own. `data-gl` is set on the stage only on success.

**DESIGN.md exception (one line):** "Exception: the landing robot may cast white light on its floor (status pool, lidar sweep). No colour, no bloom in empty air, hero only."

---

## 5. Motion controller and accessibility

### 5.1 Constants

| Constant | Value |
|---|---|
| `follow` τ | 0.16 s, dt capped at 1/30 (existing) |
| Berth move | 700 ms smoothstep |
| Arrival fade | 200 ms |
| Trigger line | 0.8·vh |
| Change epsilon | 1e-3 for degrees and GL inputs, 1e-4 for shares |
| Half-rate lever | EMA of `ctrl.set` ms: above 14, live layer on alternate frames; below 9, every frame |

### 5.2 One rAF loop (in `useRobot`)

```
dt = min((now−last)/1000, 1/30)
u  = host==='hero' ? (motion ? follow(u,uT,dt) : u) : (anim ? smoothstep path : u)
s  = stateAt(u);  ui = motion ? u : uT
if values changed:  st = ctrl.set(groupsOf(s.values), {detail: host==='hero'?1:0}); ema = .9*ema + .1*st.ms
if shares changed:  body [data-piece] transform = translate(0, zPx·travel[piece]·share); arm.style.transform = translateY(100·zPx·150·s_top/H %)
stage --brain = s.lit;  stage data-u, data-apart (s_top), data-host
hero only: landing data-chapter = chapterAt(ui); --exit, --p; captions/rail aria-current; readout (string compare)
gl (pinned hero only) if inputs changed
schedule next frame only if (hero && u≠uT) || anim pending; else stop
```

- **Restarted by:** passive `scroll` and `resize` listeners (they set `uT`, run the host rule and the trigger), an IntersectionObserver on the current host, and `visibilitychange`.
- **No frames when:** the host is off screen, the tab is hidden, or everything has converged.
- **Idle cost is zero.** The browser-check idle test holds after convergence (worst case about 1.5 s).

### 5.3 Reduced motion

- Static `u = .50`: exploded, brain lit, arm at READY.
- No pin, no rail, no berths, no canvas.
- `.assembly-control` (`aria-pressed`) toggles instantly between .50 and 0, keeping `data-u`.
- The motion button is disabled and reads "Reduced motion". A live switch is handled by App's existing listener.

### 5.4 Keyboard

- Native scroll is the control. The figure is not focusable and not a slider.
- Tab order: Skip intro, Pause, View selected work, the rail buttons, See the work, then Inspect (reduced mode only).
- Focus inside a caption makes it visible: `.story-caption:focus-within{opacity:1}`.

### 5.5 ARIA

- **In the hero:** the stage has `role="img"` and this `aria-label`: "Illustrative mobile robot: a wheeled base with a battery and an onboard computer, a sensor mast with lidar and a camera, and a jointed arm. As you scroll it wakes, comes apart, scans the floor and points to the selected work."
- **In a berth:** the stage has `aria-hidden="true"` and no role.
- **No live regions.**

### 5.6 StrictMode cleanup

`cancelAnimationFrame`, `ctrl.destroy()`, `light?.destroy()` (which calls `loseContext`), `stage.remove()`, then disconnect the observers and remove the listeners.

After every `await`, check a `disposed` flag.

### 5.7 HIG review points

- Motion follows scroll and never hijacks it.
- Each docked reaction is one move of 700 ms or less, then stillness.
- Pause is always visible.
- Reduced motion gets a complete still image.
- No flashing: the sweep is scroll-linked.

---

## 6. Architecture and data contracts

### 6.1 File ownership (one owner per file)

| File | Owner | Action |
|---|---|---|
| `scripts/anatomy/{turn,turn-build,turn-audit,gl}.mjs` | geometry | copy unchanged from `~/.claude/skills/anatomy/kit`; keep `LICENSE` |
| `src/robot/pose.js` | geometry | **new**: the shared pure contract (§6.2) |
| `scripts/build-robot.mjs` | geometry | **new**: build, asserts, `--audit`, `--quick`, `--only=`, `--verify` |
| `src/robot/robot.json`, `src/robot/turn.css` | geometry | generated (`turn.css` = `out.css`) |
| `src/anatomy/geometry.css` | geometry | regenerated by `build-robot.mjs` (same recipe as `build-landing.mjs:50-52`) |
| `package.json` | geometry | add `"build:robot": "node scripts/build-robot.mjs"`, `"audit:robot": "node scripts/build-robot.mjs --audit"` |
| `.gitignore` | geometry | add `scripts/.out/` (audit logs, verify page, state files) |
| `src/robot/useRobot.js` | runtime | **new**: hook, loop, host rule, fit check |
| `src/components/LandingHero.jsx` | runtime | rewrite (§6.5) |
| `src/App.jsx` | runtime | call `useRobot({motion:!paused&&!reduced, reduced})`; add the 4 berth divs; nothing else changes |
| `src/styles.css` | runtime | §6.6; delete the `.system-figure*`, `.landing-grid` and `.figure-*` rules |
| `src/anatomy/motion.js` | runtime | delete `openingAt`; keep `clamp`, `separationAt`, `flightAt`, `follow` |
| `src/anatomy/landing.json`, `scripts/build-landing.mjs` | runtime | delete once LandingHero no longer imports them |
| `src/robot/floor-light.js` | shader | **new** (§6.4) |
| `tests/motion.test.js` | checks | rewrite the `openingAt` test; add the `pose.js` tests |
| `scripts/browser-check.mjs` | checks | update (§8.4) |
| `DESIGN.md`, `README.md` (:22, :34, :36), `docs/redesign/landing-motion.md` (:27) | checks | docs |

Only the lead changes the exports of `pose.js` or the shape of `robot.json`. Geometry may tune numbers if the tests stay green, and announces each change.

### 6.2 `src/robot/pose.js` (pure, no DOM; imported by the build, the client and the tests)

```js
export const TRAVEL = { battery: 50, compute: 100, top: 150 };
export const REDUCED_U = 0.5;
export const KEYS = { STOW, READY, POINT, WORK, EXPERIENCE, ABOUT, CONTACT };   // {J1,J2,J3,tau,grip,pan}
export const DOCK = { work: 1.25, experience: 1.5, about: 1.75, contact: 2 };
export const CHAPTERS = [ // id, rail name, motion window, hold, rail-jump u, caption threshold
  { id:'language',   name:'Language',   from:.04, to:.22, hold:[.22,.26], jump:.24,  shows:.12 },
  { id:'anatomy',    name:'Anatomy',    from:.26, to:.48, hold:[.48,.52], jump:.50,  shows:.24 },
  { id:'perception', name:'Perception', from:.52, to:.74, hold:[.74,.77], jump:.755, shows:.50 },
  { id:'action',     name:'Action',     from:.77, to:.95, hold:[.95,1],   jump:.975, shows:.755 } ];
export const RANGES = { sh:[-45,40], el:[-35,90], wr:[-85,5] };
export function stateAt(u)   // u∈[0,2] → { values:{J1,J2,J3,J4,tau,grip,pan,cap}, shares:{battery,compute,top}, lit, status, scan, sweep, exit }
export function groupsOf(values) // → { yaw, sh, el, wr, fA, fB, pan, capJ2, capJ3 }  (sign fixes live here only)
export function chapterAt(u)     // 0..4 by CHAPTERS[].shows
export function readoutAt(u)     // §2.5 strings
export function sampleU()        // ascending u∈[0,2]: from a 1e-4 grid, keep a state when any angle moved ≥0.3° or slide ≥0.2 since the last kept; always keep keys/hold edges
export function liftStates()     // [{label, shares}] sampled every .005 over [.26,.60], deduped — for A.settle / A.auditOrExit frames
export function fk(values)       // world points {B,S,E,W,W5,tip, mastTop} at yaw J1 (unlifted) — asserts and crops
```

### 6.3 `src/robot/robot.json` (emitted by `build-robot.mjs`)

```js
{ version: 1, W: 1200, H: 800, unitMm: 2,
  zPx: -1.07,                                  // viewBox y of +1 world z (k.iso([0,0,1])−k.iso([0,0,0])), negative = up
  travel: { battery:50, compute:100, top:150 },
  crop: { hero:[0,0,1200,800],
          phone:[x,y,w,h],                     // union of u∈[0,.50] + pad 16
          dock:[x,y,w,h] },                    // union of u∈[1,2]; bottom = lowest projected floor-contact point (+2), pad 8 elsewhere
  back: "<g>…</g>",                            // inner markup of the back <svg>: halo + floor marks
  body: "<g data-part=… data-piece=…>…</g>…",  // pre-sorted static items; data-piece ∈ base|battery|compute|top; SoC overlay has data-brain
  arm:  "<svg data-live=\"arm\" …>…</svg>",    // out.layerSvg("arm",{width:W,height:H})
  turn: { …out.data },
  gl: { W, H, camera: glCamera(P), footprint:{x:-120,y:-75,w:240,d:150,r:18},
        lidars:[{at:[120,-75,30],heading:-35,fov:270},{at:[-120,75,30],heading:145,fov:270}] },
  label: "<stage aria-label text>",
  report: { static:89, live:24, parts:113, cost:<turn-bench> } }
```

### 6.4 `src/robot/floor-light.js` (shader agent)

```js
import { glLayer } from '../../scripts/anatomy/gl.mjs';
export function createFloorLight(canvas, gl /* robot.json gl */)
  // → null (no WebGL / compile error) | { draw({ status, scan, sweep /*deg*/ }), clear(), destroy() }
  // glLayer({ canvas, fragment, view:[gl.W,gl.H], camera:gl.camera, uniforms:['uStatus','uScan','uSweep'], fixed:{footprint, lidars}, maxRatio:1.5, onError:()=>{} })
  // destroy(): layer.gl.getExtension('WEBGL_lose_context')?.loseContext()
```

### 6.5 DOM contract between App, LandingHero and `useRobot`

```
App
  section.landing#home[data-chapter]  (class landing-reduced when reduced)
    div.hero-sticky > div.hero-frame
      div.robot-slot[data-robot-slot=hero]          ← empty; React never renders children
      div.hero-toolbar  (p.hero-location, a.skip-intro, button.motion-button)
      div.hero-copy     (h1#hero-title unchanged, div.hero-description, div.hero-foot)
      div.story  (ol.story-captions > li.story-caption[data-chapter=1..4] > p.story-index, h2.story-title, p ;
                  output.robot-readout[aria-live=off], p.robot-label, button.assembly-control[aria-pressed])
      nav.story-rail[aria-label="Story chapters"] (span.rail-count, span.rail-line, button[data-chapter=1..4])
  #work .section-heading         > div.robot-berth[data-robot-slot=work][aria-hidden=true]        (between h2 and p)
  #experience .section-heading   > div.robot-berth[data-robot-slot=experience][aria-hidden=true]
  .about-grid > div:first-child  > div.robot-berth[data-robot-slot=about][aria-hidden=true]        (after the résumé link)
  .contact-title                 > div.robot-berth[data-robot-slot=contact][aria-hidden=true]      (between h2 and svg)
```

**Hook:** `useRobot({ motion, reduced })` is called once in App. It holds the latest props in a ref and reacts to changes without remounting TURN.

**Lazy loading:** `Promise.all([import('../robot/robot.json'), import('../../scripts/anatomy/turn.mjs'), pinned && import('./floor-light.js')])`.

**Stage markup:**
```html
<div class="robot-stage iso" data-theme="dark" data-host="hero" role="img" aria-label="…">
  <svg class="iso-svg robot-back" viewBox="0 0 W H" aria-hidden="true">{back}</svg>
  <canvas class="robot-gl">        <!-- pinned only, created lazily -->
  <svg class="iso-svg robot-body" viewBox="0 0 W H" aria-hidden="true">{body}</svg>
  {arm}                            <!-- class robot-arm added after insert -->
</div>
```

**Mount order:**
1. Mount TURN (`TURN.mount(stage, data.turn)`) in the hero slot, so it samples at full size.
2. Fade in over 300 ms.
3. Bind the Inspect, rail and skip handlers by delegation on `.landing`.

**Dev hook:** `window.__robot = { get u(), get host(), get ms() }`, behind `import.meta.env.DEV`, for the browser check.

### 6.6 CSS (runtime agent)

**Pinned:**
- `.landing{height:360svh;overflow:clip;background:#101010}`
- `.hero-sticky{position:sticky;top:0;height:100svh;display:grid;place-items:center}`
- `.hero-frame{position:relative;width:min(100%,150svh);aspect-ratio:3/2;container-type:inline-size}`
- `.robot-slot` absolute `inset:0`, with `.robot-stage` filling it at 100%.

**Stage layers:** `.robot-stage>svg,.robot-stage>canvas{position:absolute;inset:0;width:100%;height:100%}`.

**Other rules:**
- `.robot-stage [data-brain]{opacity:var(--brain,0)}`
- the graphite tokens on `.robot-stage.iso` (moved from `.system-figure.iso`);
- the parked rules of §3.3;
- `.robot-arriving{animation:robot-in .2s}`;
- the berth media query of §3.1;
- the `:has()` min-height of §3.1.

**In-flow** (`@media not ((min-width:900px) and (min-height:741px))` and `.landing-reduced`):
- `.landing{height:auto}`, `.hero-sticky{position:relative;height:auto}`, the frame is static;
- the slot uses the phone crop (`aspect-ratio:var(--phone-aspect)`);
- the rail is hidden;
- the captions become a visible list: `[aria-current]` in ink, the others in `#5c5c5c`;
- `.robot-gl{display:none}`.

**Motion-still:** update `.motion-still` and the reduced rules to reference `.hero-copy` and `.story-caption` instead of `.landing-copy` and `.system-figure`.

---

## 7. Work breakdown (4 agents in parallel)

| Agent | Tasks | Done when |
|---|---|---|
| **geometry** | **G0 (≤ 45 min, before anything else):** copy the kit files; write `pose.js` in full; write `build-robot.mjs` that builds P, R and T, runs `T.build({statics:R.items, poses: sampleU().map(u=>groupsOf(stateAt(u).values))})` and `A.settle(R,P,{states:liftStates()})`, and writes `robot.json`, `turn.css` and `geometry.css`. No audit yet. Take one probe render at u = 0, .50 and 1 to confirm the hinge and turn signs and that the caps face the viewer. **G1:** build asserts 1–8 pass (below); `A.auditOrExit(R,P,{frames:liftStates(),apart:true})` passes; `npm run audit:robot -- --quick --only=order,rigid` has no problems. **G2:** a full `node scripts/build-robot.mjs --audit > scripts/.out/audit.txt 2>&1 &` ends with `turn audit passed`; on the `--verify` page, line ends = 0, plus `turn-check --order --states`, `--pops --states` (one 0.02° path per hinge) and `turn-bench` cost ≤ 50. | G0 data published (the others integrate against it). G1 and G2 logs are quoted in the hand-off. |
| **runtime** | Page structure and CSS from t = 0 (placeholder slot until G0). Then `useRobot` with the loop, lift, host rule, fit check, reduced, pause and cleanup. App berths. Deletions. | §2–§5 behave as written at 1440×900, 1280×800, 1024×768, 900×800, 1280×600, 768, 390 and 320. No `pageerror` with or without WebGL. The idle loop stops. StrictMode double mount is clean (one stage, one context). |
| **shader** | `floor-light.js` from §4 and §6.4. Develop in a throwaway harness under `scripts/.out/` using G0's `gl` block, then hand the module to runtime. | Compiles in headless Chrome. Returns null with WebGL disabled. White only (a pixel read finds no chroma). Reaches 0 at least 10 px inside the canvas edge. `draw` ≤ 1 ms at 1440 and DPR 1.5. `destroy` frees the context. Screenshots at u = .30 and .65 reviewed. |
| **checks** | Unit tests first, against the `pose.js` API. Then `browser-check.mjs` once runtime lands. Then the docs. | `npm test` passes. `PORTFOLIO_URL=http://127.0.0.1:5174 node scripts/browser-check.mjs` passes. DESIGN.md has the glow exception, the berths and the Hero/Motion updates. README states that `turn.mjs` and `gl.mjs` now ship (lazy). `landing-motion.md` updated. |

**Build asserts** (geometry; each failure exits 1):
1. Every static part has max z ≤ 108.
2. Arm moving parts (sh, el, wr, fingers, caps) have min z ≥ 112, and the arm base and mast have min z ≥ 108, at every `sampleU()` state (via `fk` plus radii).
3. Pieces nest at every u: `maxZ(piece) + TRAVEL·s ≤ minZ(piece above) + TRAVEL_above·s_above`, and `s_top ≥ s_compute ≥ s_battery`.
4. One static order is valid for every lift state (the kit audit with `liftStates()` frames passes on the sorted order).
5. Every hero state's projected hull (lift included) lies inside [470, 64, 1150, 690]. The chassis projected width is ≥ 300 vb.
6. Arm-to-mast clearance is ≥ 6 at every u.
7. There are 100–150 parts, ≤ 26 live parts, and no ball, lathe or live tube.
8. `crop.dock` aspect ≥ 1.2.

**Schedule:**
- Runtime: about 4–5 h.
- Geometry: 4–5 h, plus background audits of about 15–20 min per full run (about 2,000 states × 24 parts).
- Shader: about 2 h.
- Checks: about 2–3 h.
- A page with the static lift-apart running in the new runway should exist within the first 90 minutes.

---

## 8. Verification plan

### 8.1 Unit tests (`tests/motion.test.js`)

**Keep:** the `flightAt`, `separationAt` and `follow` tests.

**Add:**
- Continuity: between consecutive `sampleU()` states no angle moves more than 0.3° and no slide more than 0.2.
- Every sampled value lies inside `RANGES`.
- `s_top ≥ s_compute ≥ s_battery` everywhere.
- The arm joints (J1–J3, τ, grip) are constant wherever any share is above 0.
- Every channel is constant inside each hold.
- `stateAt` at each `DOCK` value and at 0, .24 and 1 equals its key.
- For u ≥ .60: shares, lit and scan are 0.
- `sweep` is monotonic over [.58, .72].
- `chapterAt` thresholds.
- `readoutAt(.86)` matches `/^J1/`.
- The J4 derivation matches the τ rule for every key.

### 8.2 Geometry gates

G1 and G2 from §7. Only a full `turn audit passed` counts.

### 8.3 Performance

| Measurement | Target |
|---|---|
| `__robot.ms` EMA during a scripted scroll through Action at 1440 | ≤ 6 ms |
| Same at 390 with 4× CDP throttle (in-flow scrub) | ≤ 16 ms |
| `turn-check --perf` at 1440 and at 390 `--throttle 4` | inside the small-figure budget |
| rAF frames over 300 ms after 2 s of idle (hero and parked) | 0 |
| Gzipped lazy chunk (`robot.json` + `turn.mjs` + `gl.mjs`) | ≤ 150 KB, reported |

### 8.4 `scripts/browser-check.mjs`

Run with `PORTFOLIO_URL=http://127.0.0.1:5174`.

**Keep:**
- the h1 name and masked lines;
- the `.landing` background `rgb(16,16,16)`;
- the touch targets;
- no sideways scroll;
- exactly 2 `mailto:` links;
- no remote requests or `pageerror`;
- the 1280×600 `.hero-sticky` relative check plus the "View selected work" jump;
- `#easyrtg summary` clickable at 390;
- the Pause label scroll-back.

**Replace:**

| Lines | New check |
|---|---|
| :36 | `canvas:not(.robot-gl)` = 0 everywhere; `.robot-gl` ≤ 1 at pinned sizes; 0 at 768, 390, 320 and in reduced |
| :40-41 | `.robot-stage[data-u]` exists; `[data-part]` count = `report.static`; `[data-p]` count = `report.live` |
| :42-58 | at u .40 (settled): `data-chapter=2`, `data-apart > .5`. At u .86: readout `/^J1/`. At .99: `data-chapter=4`, `.hero-copy` opacity 0, caption 4 visible and not intersecting the stage's arm bbox. Scroll to the top: u = 0, h1 opacity 1. |
| :59-65, :132-141 | in the reduced run, `.assembly-control` toggles `data-u` .50 ↔ 0 with Enter and Space |
| :66-73 | Pause freezes `data-u` while scrolling; Resume follows |
| :74-76 | idle check after convergence, in the hero and 1 s after parking in Work |
| :77-79 | a live reduced switch gives `data-u` = .50 and `.landing` height auto |

**Add:**
- The rail's "Chapter 3" button makes `data-chapter=3` and sets `aria-current`.
- "Skip intro" brings `#work-title` into view without passing through `data-chapter` 2.
- At 1440×900, 1280×800 and 1024×768, for each section: the stage's parent is that berth (or the berth has `data-fit=no`); the berth rect, inflated by 24, intersects no text rect; `aria-hidden` and `pointer-events:none` are set; `data-apart` = 0.
- Jumping from u .40 to `#contact` shows the robot assembled in the contact berth within 1 s.
- At 390 and 320 no berth is displayed and the stage stays in the hero slot.
- A no-WebGL run (`--disable-3d-apis`) raises no `pageerror` and the stage has no `data-gl`.
- Screenshots to `docs/redesign/screenshots/robot-{u000,u024,u050,u0755,u0975,work,experience,about,contact,390,reduced-320}.png`.

### 8.5 Manual review

- Look at each hold and each berth at 1440 and at 1024.
- Confirm parked strokes do not clot.
- Confirm the monochrome palette (no blue cast).
- Apple HIG motion and accessibility checklist (§5.7).

---

## 9. Cut list, in priority order

1. Rail tick buttons (keep "02 / 04" and the hairline).
2. The `pan` group (camera fixed at +40; the captions carry "looks").
3. The Experience berth, then the About berth (keep Work and Contact as bookends).
4. The lidar sweep (keep the status pool).
5. The joint caps (gearbox rings become static housing details). Tell the user, because they asked for this.
6. The finger slides, then the `wr` hinge (tool rigid at τ 180; POINT becomes "tool down at the edge").
7. All WebGL (the drawing is complete without it).
8. Berths entirely (the robot stays in the hero only).

**Never cut:** reduced motion, Pause, Skip intro, the build asserts and keep-out boxes, the berth fit check, a passing full audit, the illustrative label, and the StrictMode cleanup.

---

**Checked:** I measured berth gaps and confirmed headless WebGL with a probe on the running dev server. I read the kit APIs: `TURN.mount` resamples through ResizeObserver on its first live SVG, `glLayer` returns null without WebGL, and `t3Css` uses `--anatomy-shade-*`.

**Not checked:** I built and audited nothing. The angles, part costs, the dock-crop aspect (≥ 1.2) and the engine's hinge and turn signs are hand calculations that G0 must confirm.

**Main risk:** the 3D mode is beta. The slab planes should take care of the hinge ranges, but an audit loop could still eat the geometry schedule.