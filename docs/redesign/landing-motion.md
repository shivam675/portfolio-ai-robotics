# Landing motion — 15 October 2026

The later request for more expressive entry and exit motion is covered in [scroll-choreography.md](scroll-choreography.md), including current build sizes and validation. This document records the original assembly reveal.

The approved project content stays the main story. This iteration adds one short opening reveal: an illustrative edge computer separates into its enclosure, board and thermal assembly as the visitor scrolls. It introduces the connection between software and physical systems without claiming Shivam designed or shipped this hardware. A visible caption makes that distinction.

## References and direction

Reviewed the [Awwwards scrolling collection](https://www.awwwards.com/websites/scrolling/) and visited [Heron AI](https://heronaiapp.com/) from its listing. The useful visual reference was a large architectural object paired with restrained type. Our interpretation is a continuous physical reveal leading into actual project evidence. No reference assets or page layouts were copied. The user's rocket example was treated as a request for scroll-linked physical movement, not a subject requirement.

Anatomy Figure scope: 68 solids. Four feet; enclosure floor, rear and side walls and segmented front; board and cover mounting posts; four connector mounts, shells and socket inlays; PCB and four fasteners; processor; six memory packages; six power packages; two controllers; thermal spreader and nine fins; cover and four fasteners. Thirteen engraved cover slots and rooted PCB traces add detail. A fixed 40° azimuth / 29° elevation camera keeps depth legible. Vertical travel is shared by the geometry audit and runtime: board 28, thermal 65, cover 108 world units at full reveal.

## Apple Design review

**Summary — Good.** A React web portfolio for AI and robotics audiences. The opening's job is to establish the connection between software and the physical world, then let visitors reach the projects. Apple's foundations and interaction principles apply; native Apple tab bars, menu bars and materials do not govern this website. This is a code and Chrome review, not a complete assistive-technology certification.

**What works.** `motion.md › Best practices`: “Make motion optional.” Pause freezes the scene and all project motion. OS reduced motion removes the sticky scroll passage and displays a static 65% reveal; manual inspection changes instantly. `motion.md › Providing feedback`: “Let people cancel motion.” The primary work link skips the scene, scrolling back reverses it, and keyboard activation can change its destination before movement finishes. `design-principles.md › Agency`: “Stay out of the way.” All project explanations, links and contact details remain accessible without completing the animation.

Measured colors: body #f3f3f3 on #111111 is 17.02:1; secondary #aaaaaa on #111111 is 8.13:1; motion control #eeeeee on #252525 is 13.21:1; project secondary #626262 on #f0f0f0 is 5.35:1. Native buttons have at least 44px height and visible keyboard focus. Body type remains 17–18px; utility text is 13–14px. Percentages are not announced continuously by screen readers. Solid backgrounds need no reduced-transparency substitute.

**Craft.** The signature is the lifted enclosure and thermal assembly exposing the processor. Removed the redundant introductory tagline; type and the object carry the opening. Desktop uses a 75vh scroll range after the opening reaches the top; compact and short screens use normal flow. The illustration is introductory, followed by actual simulations and product interfaces.

**Limit — Medium.** Real iOS Safari, VoiceOver and OS text enlargement have not been tested. Responsive Chrome checks cover 320/390/768/1440px, a 1280×600 short window and a tall 1724×1260 desktop; they do not establish real-device performance or universal accessibility compliance.

## Implementation and verification

The kit builds SVG paths in advance. The browser loads static path data and directly updates transforms with time-based easing, without React state updates per frame, WebGL, an animation dependency, or server computation. Frame requests stop once the motion settles, when the figure is offscreen and while the document is hidden. Existing animated project media retain their visibility and motion controls.

- Geometry audit: zero failures at rest, apart and across 25 reveal states; 68 solids, 6,467 overlap samples and 357 ordering rules. No stand-in shapes.
- Line checker: zero floating ends in assembled and fully revealed poses, on dark and light test backgrounds. Inspected enlarged cover seams, thermal fins, board details, mounting posts and connector junctions. Alternate-background previews are test fixtures, not a website theme switch.
- Browser checks: scroll mapping, keyboard open/close from a partial reveal, pause/resume, idle frame stopping, live OS preference changes, reduced-motion inspection, four project chapters, responsive widths, short-screen work navigation, links, disclosures, local resources and clean console.
- Unit checks: bounded scroll progress, equivalent 60/120Hz easing and convergence, and existing profile/media validation.
- Design Taste: source lint has zero failures/warnings; browser inspector has zero failures and the existing `no-footage` warning. Recorded project demonstrations use animated WebP rather than a video element.
- Production build: JavaScript 390.68 kB / 100.27 kB gzip; CSS 20.17 kB / 4.92 kB gzip. The geometry/audit libraries are build-time only. No dependencies added.

No deployment, server load test, real-device GPU benchmark or public-gallery publication was performed.
