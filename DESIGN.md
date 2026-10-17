# Design System: Shivam Chavan

## Visual theme
A project-led AI and robotics portfolio with a technical studio identity. Black and graphite surfaces, white actions, precise typography and grayscale project media. The work is the focal point: real simulations, source-rendered application interfaces, useful explanations, and direct repository links. An illustrative hardware reveal introduces the work, followed by reversible scroll choreography. Reference direction: Monochrome and Kinetic from Design Prompts, plus Animmaster's public scroll, hero and SVG catalogue. See `docs/redesign/reference-refresh.md`.

## Palette
- Black #101010 — header, landing and contact ground.
- Graphite #202020 — about ground.
- Paper #f5f5f5 — work, experience and primary actions on dark surfaces.
- Ink #171717 — primary text on light surfaces.
- Grey #e9e9e9 — typography transition and technology tags.
- Muted #626262 on light / #a3a3a3 on dark — secondary text.
- Dividers #d7d7d7 on light / #343434 on dark.
All project media use CSS grayscale; original assets remain intact. Hardware shading is neutral throughout. No accent colors, decorative gradients, glass, or artificial glows.

## Type
Self-hosted Manrope. Principal roles: display 76–208px, section heading 40–76px, secondary heading 27–42px, body 16–19px, supporting text 12–15px. Small media captions and technology tags use 11px. No all-caps labels, monospace outside source screenshots, or ornamental numbering.

## Hero
A masked two-line “AI, put to work.” entrance and a plain introduction sit over a full-bleed, pinned scene: SC-01, an illustrative mobile manipulator (wheeled base with battery, onboard computer and sensor mast, carrying a jointed arm), labelled as an illustrative study. Desktop (≥900×741) pins the hero for 360svh while scroll plays four chapters with short captions: Language (the robot wakes and unfolds), Anatomy (deck, compute and battery lift apart; the processor lights), Perception (it reassembles and its lidars sweep the floor) and Action (the arm reaches toward “See the work”). A chapter rail, Skip intro and Pause sit in the frame. Phones, short windows and reduced motion use normal flow with the captions as a list.

## Project showcase
Four chapters: EasyRTG, SLM Desk, FillWise, Language to motion. Desktop uses a shared sticky media stage that changes as each real project enters focus. Project names and explanations remain in normal document flow. Below 900px every project gets its own in-flow media. Each has a source link, stack, and optional technical detail. No content depends on completing an animation.

## Motion
SC-01 has 113 parts: 89 static kit solids that lift apart with transforms and 24 live arm and mast parts re-projected by the Anatomy 3D mode. Geometry is built and audited ahead of time (`npm run audit:robot`). One requestAnimationFrame loop eases scroll progress, stops when settled, offscreen or hidden, and scrolling back reverses everything. Pause freezes the robot while captions still follow scroll; reduced motion shows a still exploded view with an instant Inspect assembly toggle. Exception: the landing robot may cast white light on its floor (status pool, lidar sweep). No colour, no bloom in empty air, hero only. The robot is described once to screen readers and hidden while docked.

## Scroll choreography
After the hero, the robot travels with the visitor: one stage node moves into reserved berths beside the Work, Experience, About and Contact headings, only while unseen, then plays one 700 ms pose change and holds still. Berths need ≥900×741, hide when they would touch text, and are absent in reduced motion. Project previews arrive from left, below and right; “Language.” and “Action.” cross the viewport before the case studies; project images slide through their shared frame in chapter order.

Moving children have stable, untransformed layout wrappers. One small controller eases their CSS transform variables, handles body resize, stops when settled or hidden, and snaps offscreen elements without animating them. No animation dependencies or permanent loops. Keyboard focus immediately stabilizes a moving preview or hero panel. Pause brings decorative travel to a readable resting pose and freezes the anatomical separation; reduced motion removes all travel. See `docs/redesign/scroll-choreography.md`.

## Layout and components
Maximum content width 1440px, fluid 24–80px gutters. Hero split, continuous project chapters, open repository list, two-column experience, asymmetric background, large contact close. No equal icon cards. Pill-shaped primary action, precise four-pixel hardware frame, outlined contact action. Visible focus, minimum 44px targets. Images and headings occupy separate zones. No sideways scrolling.

## Provenance
All showcased repositories belong to shivam675 and are publicly accessible. EasyRTG and SLM Desk media originate in their repositories. FillWise and Language to motion images are captured from those projects' actual public frontend source with demo fixtures and labelled accordingly. Employment, education, award and publication entries come from the supplied résumé. No customer metrics or employment claims are invented. Do not imply simulation demos control real hardware.
