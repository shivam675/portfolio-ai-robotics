# Scroll choreography — 15 October 2026

The user approved the portfolio and hardware reveal, then requested more elements entering and leaving the screen. This refinement keeps the content, monochrome identity, real project media and client-side architecture. The animation belongs to the opening, previews, display type and media frame; project explanations stay steady enough to read.

## Sequence

- Desktop hero: assemble → reveal → depart. The board and cover reach full separation before the exit begins. Headline and module leave in opposite directions with restrained rotation. Scrolling upward reverses both stages. Mobile and short windows retain normal document flow.
- Project previews: three existing source images approach from left, below and right. Stable link wrappers retain the document layout while the inner visuals travel. Focus cancels travel on the selected link.
- Work passage: oversized “Language.” and “Action.” enter from opposite edges, settle, and leave through the other side. Two beats keep the transition concise. It is presentation-only; the selected-work introduction retains accessible equivalent copy.
- Project stage: the incoming image slides from the next chapter's direction as the prior image leaves. Reversing chapter order reverses the movement. Text, disclosures and source navigation remain in document flow.

## Constraints and checks

Uses existing React, native scrolling, requestAnimationFrame, ResizeObserver and transform/opacity styles. No added libraries or runtime requests. The motion controller measures stable wrappers, avoiding feedback from measuring a moving element. It stops once settled and cancels pending frames in a hidden tab; offscreen items snap directly to their target. Pause restores decorative elements to readable positions. Reduced motion keeps all content static, and keyboard focus makes flying links immediately usable.

The existing Anatomy paths and part travel are unchanged, so the prior geometry audit still describes all separation positions; the added departure transforms the complete figure as a unit.

Unit tests cover staged opening/departure, bounded entry/exit travel, reversal, 60/120Hz easing and settling. Browser checks cover real left/right departure, reverse scrolling, moving type entering and settling, keyboard-safe previews, pause, reduced motion, idle frame stopping, four viewport widths, short windows, existing project selection and links, PDF delivery, local requests and console errors. Visual review includes the hero, departure, type passage and actual project media.

This remains a static-hosted, client-rendered site. No deployment or real-device Safari/GPU performance testing is included.

Final verification: all five unit tests and the complete browser checks pass against the production preview. Source lint: zero failures/warnings. Visual inspector at 1440/768/390px: zero failures, with the existing `no-footage` warning because recorded demonstrations are animated WebP. Reviewed the responsive sheets, hero exit and settled type passage. Production JavaScript is 392.72 kB / 100.89 kB gzip; CSS is 22.81 kB / 5.44 kB gzip. The choreography adds about 0.62 kB of compressed JavaScript over the preceding build.
