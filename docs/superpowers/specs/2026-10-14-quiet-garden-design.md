# Quiet garden redesign

The user found the illustrated homepage cluttered and distracting and requested a soothing lo-fi explorable 3D portfolio inspired by bruno-simon.com. This supersedes the five floating islands and animated-bird requirements. Retain React, editable sample profile content, accessible direct navigation, and fast loading.

Build a genuine Three.js scene with one softly lit sage-green garden, a small cream-and-sage rover, low-poly trees, a pond, a studio, and four portfolio landmarks. Keep the camera stable with optional drag rotation. Arrow/WASD movement is camera-relative and Space gives a small hop. Click ground to drive; click a landmark to explore it. Use proximity prompts and optional direct navigation. Content lives in a quiet side panel and a reading view.

Homepage UI: small identity, a short serif introduction in open space, one discreet menu, one optional lo-fi audio control, and a small control hint. No featured cards, daily stats, scores, dark toolbars, animated birds, or decorative sign overlays. Palette: ivory, sage, muted teal, clay. Default audio muted. Reduced motion and WebGL-unavailable paths remain usable.

Three.js loads as a separate module. All scene objects are generated from shared geometries/materials; no GLTF, HDRI, external textures or physics WASM downloads. Cap rendering at 45 fps, pixel ratio at 1.5, shadows at 1024, and stop hidden/inactive rendering. Dispose WebGL, geometries, and event listeners on cleanup. Unit-test 2D bounds, collisions, normalized movement, hop/landing, pathfinding and destination proximity. Browser-check desktop/mobile content, controls, camera framing, WebGL errors and production bundles.
