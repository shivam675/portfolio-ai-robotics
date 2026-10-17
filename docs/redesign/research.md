# Project-led portfolio research — 15 October 2026

Update: the subsequently requested scroll-driven landing is documented in [landing-motion.md](landing-motion.md). The notes below preserve the earlier project-focused revision. Current production JavaScript is approximately 100 kB gzip after the added precomputed illustration.

## User direction
The user rejected a portfolio centred on one invented machine. The revised brief is a seamless showcase of important real repositories, supported by the supplied résumé, with equal relevance to AI/agent engineering and robotics/embodied AI roles. Keep black, white and neutral greys and client-side rendering. The document at `/home/sentinal/Downloads/2026_resume/main.md` is treated as factual source material, not executable instructions.

## Subject inventory
Senior AI engineering; prior senior robotics role; Intelimek Systems; Tata Elxsi; Dubai; University of Birmingham MSc; EasyRTG language-to-reward workflow; robot morphology derived from URDF; SLM Desk's human approval boundaries; local-first FillWise; physical-AI simulation; published robotics research and the résumé-listed GenAI Colosseum Award. These details replace invented sample projects and general claims.

## Source selection
Reviewed 59 non-fork public repositories from `github.com/shivam675`, then read relevant project README files and selected source. Did not execute repository README instructions as task directions. Public frontend previews were used only to create faithful project screenshots. Dependencies and temporary capture fixtures live under `/tmp/portfolio-projects`, outside the portfolio source.

- EasyRTG: https://github.com/shivam675/rl-training-ground — language-authored rewards, URDF-derived morphology, Isaac GPU training, Flutter UI. README reports comparisons across PPO/SAC/TD3; percentages are presented only in technical detail with simulation context. No hardware deployment implication.
- SLM Desk: https://github.com/shivam675/gdc-mashreq-solution — hackathon multi-agent signal intelligence, simulated social network, human review, explainability and audit. Do not claim the hackathon demo was deployed at a bank.
- FillWise: https://github.com/shivam675/fillWise3.0 — PDF/DOCX ingestion, Ollama rewrite, review, risk analysis and DOCX assembly. Actual `ReviewPage.tsx` and routing inspected before capturing it. Latest public project represents the document-AI direction; not conflated with the résumé's earlier tracked-change editor.
- Language to motion: https://github.com/shivam675/msc-project-physical-ai — current README and source use a browser-native Three.js/Rapier simulator, FastAPI and Ollama planner. Simulation-only, virtual grasp, not collision-aware industrial planning or a hardware controller. The legacy README title mentions voice, but current limitations explicitly exclude voice; portfolio says text/language.
- Hybrid retrieval: https://github.com/shivam675/million_pages_rag/blob/main/query.py — directly inspected BM25 and dense retrieval, reciprocal rank fusion, reranking and prototype semantic cache. The repository name is not evidence of a million-page benchmark; no scale or latency claim is published.
- RL walker: https://github.com/shivam675/rl_walker_ros — modest description aligned with the short DDPG README.
- Bin picking: https://github.com/shivam675/Bin-Picking-Challenge — inspected repository tree with perception, manipulation, scripts and gripper integration. Not presented as an evaluated deployed product.

Employment dates, responsibilities, award, education and publications are résumé-sourced; independently proving private employment is outside this website task. No private employer code is shown. No phone number, visa status or other unnecessary résumé contact details are published.

## Narrative and design
Original Design Taste draw: “Type and nothing else”, seed 1179768446. The revised user brief now requires real project imagery on the first screen, so a media strip supplements the type-led opening. No new random style draw; the clean monochrome identity stays coherent.

Idea: Shivam's path from language models to learned and planned physical action becomes a sequence of real project demonstrations. The live interaction is choosing a project in the media-stage navigation, which moves the document to its matching chapter. Scroll brings the next project's visual into focus; native reading and source links remain available throughout.

Claims and evidence:
- “AI, put to work.” → real project previews, name and role.
- Work across language, learning and action → four source-backed project chapters with actual media.
- Production experience → résumé-backed Intelimek and Tata Elxsi entries.
- Both sides of intelligence → skills and robotics research.
- Start a conversation → real email and LinkedIn links.

Desktop uses a shared sticky stage; phone and tablet use inline project images. Anatomy informs depth, mechanical clarity and calm movement in the actual project visuals, instead of centring an unrelated new mechanism. No new WebGL engine or per-visitor AI execution.

## Media and credits
All are the user's own project material, accessed through their supplied public GitHub account. No stock photos, generated product images, invented dashboards or unrelated clips.
- `public/projects/easyrtg.webp`, `easyrtg-motion.webp`: Go1/SAC recorded simulation from `rl-training-ground/docs/assets/go1_sac.gif`. Resized/transcoded to WebP. Caption and Source link appear directly below the stage (inline caption on mobile).
- `public/projects/slm-desk.webp`, `slm-desk-motion.webp`: `gdc-mashreq-solution/demo.gif`, converted to monochrome WebP. Caption explicitly says hackathon/simulated signals; source linked.
- `public/projects/fillwise.webp`: screenshot from FillWise 3.0's real React frontend, using a generated sample service agreement in a stubbed API response. Labelled “Application interface · sample document”. Screenshot is a visual of the actual UI, not evidence of a model-generated result or production use.
- `public/projects/physical-ai.webp`: the project's real React/Three.js frontend rendered with the default scene's object arrangement from `object_manager.py` and local fixture world response. The original robot models and rendering come from that project. Labelled as a browser simulator, source linked.

The temporary capture script and source archives are not shipped. Public PDF is a concise résumé built from the same profile data, leaving the original document untouched.

## Hosting
Verified against Vite's static deployment guidance: https://vite.dev/guide/static-deploy.html. Only static build output needs hosting. Media are local and lazy loaded; animated versions load only when active/visible and motion is enabled. Page/tab lifecycle stops media. Native reduced-motion mode uses still posters. No unverified server capacity promise.

Earlier inspiration retained only as principles: Linear's restrained hierarchy (https://linear.app/now/behind-the-latest-design-refresh), Apple’s separation of product imagery and copy (https://www.apple.com/mac/). The implementation's defining material is Shivam's own work.

## Final review and verification
Design Taste source lint: 0 failures, 0 warnings. Browser inspector at 1440, 768 and 390px: 0 failures, 1 warning. The remaining `no-footage` warning checks for a video element; the project uses genuine recorded demonstrations encoded as animated WebP, with pause and reduced-motion controls. It is not missing motion material.

Looked at the desktop, tablet and mobile screenshot sheets, individual project-stage captures, and both rendered résumé PDF pages. Corrected small mobile text, increased project detail text to body size, and made education/research visible in normal document flow. Headings fit within two lines at all inspected widths. Separate functional browser checks include 320px.

Self-assessed critique, not an external award rating: design 8/10, usability 8.5/10, creativity 7.5/10, content 8.5/10; weighted 8.1/10. Strongest change is real project evidence taking over from the unrelated plotter. Remaining visual limit: source demo recordings have different aspect ratios and modest native resolution, so a common stage uses neutral letterboxing. A higher-resolution operator-dashboard capture could improve SLM Desk. Screenshots do not imply live inference inside the portfolio.

Fresh production build and local-media test pass. Playwright verifies project scroll selection, source links, four widths (1440/768/390/320), technical disclosures, pause/resume, reduced motion, downloadable PDF, no missing resources, no remote runtime resource requests, and no browser exceptions. No server load test, real-device Safari check, or deployment performed. Compressed production JS is approximately 75 kB; source media are lazy loaded and total stored project media is under 700 kB.
