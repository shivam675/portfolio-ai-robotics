# Shivam Chavan — AI engineering & robotics

A client-rendered React/Vite portfolio grounded in Shivam's public repositories and supplied résumé. Four project chapters, real project media, production experience, skills and research. No application backend, live GitHub fetches, remote fonts, WebGL runtime, or request-time rendering.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Deploy the contents of `dist/` to a static host or CDN. Enable Brotli/gzip. Cache hashed JS/CSS for a year with `immutable` and revalidate `index.html`. Use shorter caching for unversioned media or change filenames when replacing it. Capacity depends on hosting bandwidth and CDN configuration; no load-test claim is made.

## Edit

- `src/data/profile.js`: identity, real projects, repository links, experience and skills.
- `src/components/ProjectShowcase.jsx`: scroll selection, project visuals and motion lifecycle.
- `src/components/LandingHero.jsx`: pinned hero markup (captions, rail, readout).
- `src/robot/`: `pose.js` (shared scroll/pose model), `useRobot.js` (stage, scroll loop, berths), `floor-light.js` (WebGL floor light), generated `robot.json`.
- `src/anatomy/`: kit geometry CSS and the small motion helpers.
- `src/useScrollMotion.js`: lifecycle and easing for edge-entering project previews and display type.
- `src/App.jsx`: document sections, motion control and navigation.
- `src/styles.css`: responsive design and motion.
- `DESIGN.md`: visual system.
- `docs/redesign/reference-refresh.md`: Design Prompts / Animmaster reference direction and refresh checks.
- `docs/redesign/research.md`: source provenance and decisions.

Project descriptions distinguish simulations and hackathon demos from deployed work. Employment and award entries are résumé-sourced. FillWise and physical-AI screenshots use their actual frontend code with sample data. No live LLM or other project backend runs inside the portfolio.

## Checks

`npm test` verifies scroll mapping, frame-rate independent easing, unique anchors and required local media. With Chrome at `/usr/bin/google-chrome` and preview on port 5173, `node scripts/browser-check.mjs` verifies assembly motion and keyboard inspection, idle frame stopping, project scroll selection, four responsive widths, short screens, disclosures, source links, pause, reduced motion, the résumé PDF, missing resources and browser errors.

`npm run build:robot` regenerates `src/robot/robot.json` and checks the build asserts; `npm run audit:robot` runs the full Anatomy geometry and 3D orbit audit (about 10 minutes). The Anatomy kit lives in `scripts/anatomy/`; `turn.mjs` and `gl.mjs` ship to the browser as lazy chunks.

Set `PORTFOLIO_URL` when browser-checking a production preview on another port. The distribution includes Anatomy’s MIT notice at `/anatomy-license.txt`.

`node scripts/build-resume.mjs` generates the public résumé PDF from profile data. It requires local Chrome; override with `CHROME_PATH` if needed. The original uploaded résumé is not modified. Public contact uses email and LinkedIn, omitting phone number and visa details.
