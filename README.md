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
- `src/App.jsx`: document sections, motion control and navigation.
- `src/styles.css`: responsive design and motion.
- `DESIGN.md`: visual system.
- `docs/redesign/research.md`: source provenance and decisions.

Project descriptions distinguish simulations and hackathon demos from deployed work. Employment and award entries are résumé-sourced. FillWise and physical-AI screenshots use their actual frontend code with sample data. No live LLM or other project backend runs inside the portfolio.

## Checks

`npm test` verifies unique anchors and required local media. With Chrome at `/usr/bin/google-chrome` and preview on port 5173, `node scripts/browser-check.mjs` verifies scroll selection, four responsive widths, disclosures, source links, motion controls, reduced motion, the résumé PDF, missing resources and browser errors.

`node scripts/build-resume.mjs` generates the public résumé PDF from profile data. It requires local Chrome; override with `CHROME_PATH` if needed. The original uploaded résumé is not modified. Public contact uses email and LinkedIn, omitting phone number and visa details.
