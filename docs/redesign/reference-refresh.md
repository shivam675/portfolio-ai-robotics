# Reference-led refresh · 15 October 2026

## Direction

A technical studio portfolio for an AI and robotics engineer. Reuse the existing project content, hardware illustration, native scrolling and motion lifecycle. Refresh presentation without adding an animation dependency or changing claims about the work.

- [Design Prompts](https://www.designprompts.dev/): reviewed the Monochrome and Kinetic directions. Use disciplined alignment, viewport-scaled display type and scroll-linked typography; keep body copy calm and readable.
- [Animmaster Lib](https://animmasterlib.dev/): reviewed its public catalogue of scroll, hero, SVG and hover patterns. Apply those ideas through the portfolio's own existing hardware reveal, reversible image transitions and image hovers. No paid component source is copied or bundled.

## System

Manrope remains self-hosted. Black `#101010`, graphite `#202020`, paper `#f5f5f5`, ink `#171717`, grey `#e9e9e9`, secondary text `#626262` on light / `#a3a3a3` on dark, and neutral dividers. A masked headline entrance, a detailed grayscale hardware study, four project previews, oversized filled/outlined display type and a sticky project stage establish the visual rhythm. Project images use CSS grayscale without altering the source assets. Experience remains open and readable; graphite about and black contact sections close the page.

The existing scroll model, pause controls, instant reduced-motion inspection and mobile project media remain intact. The phone header exposes Work and the contact action; résumé links remain in About and Contact. No external runtime requests, new dependencies or invented availability/impact claims.

## Verification

Run `npm test`, `npm run build`, and `PORTFOLIO_URL=http://127.0.0.1:5174 node scripts/browser-check.mjs`. Browser checks verify the monochrome media treatment and all four project index links, and cover 1440, 768, 390 and 320px layouts, short screens, native anchors, hardware reveal and reversal, keyboard inspection, pause/resume, reduced motion, project selection, disclosures, source links, résumé delivery, missing resources and browser errors. Screenshots are saved in `docs/redesign/screenshots/`.
