# World Portfolio Implementation Plan

> Execute natively in this session using superpowers:executing-plans.

**Goal:** Build the user's relaxed, interactive illustrated React portfolio.

**Architecture:** React renders UI and editable content; a small animation loop updates the character and a canvas atmosphere. Compressed artwork provides the world.

**Tech Stack:** React, Vite, native CSS, Canvas 2D, Phosphor icons, self-hosted Manrope.

**Spec:** `docs/superpowers/specs/2026-10-13-world-portfolio-design.md`

## Global constraints
- Profile details and achievements remain clearly labelled editable samples.
- Relaxed exploration with walking, jumping, and clickable destinations.
- No WebGL engine; compressed local assets and paused background loops.
- Keyboard, mobile, reduced motion, and direct content navigation.

## Review focus
- Window blur and modal opening must release held movement keys.
- Tab navigation must not trigger game controls while an input/button owns focus.
- Touch release outside the movement button must stop movement.
- Hidden tabs and motion pause must stop atmosphere work.
- Small screens must keep signs and content reachable.

### Task 1: World controller
- [ ] Write failing Node tests for boundaries, jump/landing, frame-rate-safe movement, destination detection, and autopilot arrival.
- [ ] Implement `src/world/physics.js` and verify with `npm test`.

### Task 2: Portfolio and world
- [ ] Create `src/data/profile.js`, `src/App.jsx`, `src/components/World.jsx`, `src/components/ContentDialog.jsx`, `src/components/Atmosphere.jsx`, and `src/styles.css`.
- [ ] Implement scenery, continuous character motion, direct destination navigation, native dialog, map/reading view, theme and ambience.
- [ ] Optimize generated assets to local WebP files and build responsive layouts.

### Task 3: Verify and handoff
- [ ] Run browser checks of movement, content, focus, settings, reduced motion and mobile layouts.
- [ ] Run production build and unit tests; document asset sizes and setup.
- [ ] Open the local preview and link the central profile file.
