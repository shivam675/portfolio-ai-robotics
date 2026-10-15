# A little world: interactive technical portfolio

## Intent
Create a bright, tasteful React portfolio based on the supplied floating-island reference. The user chose relaxed exploration with walking, jumping, and clickable destinations. Real achievements and identity will be supplied later; sample content must be clearly marked and centrally editable.

## Visual design
A pale blue sky, richly illustrated floating gardens, clouds, a waterfall, distant castle, and dark foreground foliage provide depth. Five destinations retain the reference's metaphor: Home/cottage, About/arch, Projects/workshop, Experience/ruins and railway, Contact/cherry garden. Crisp white and ink UI sits above the illustration. Generous readable typography occupies the quiet upper-left sky. The main world remains visible on small laptops. No browser-frame ornament or unrelated brand board.

## Architecture
React + Vite, native CSS, a small Canvas 2D atmosphere layer, and a DOM character controller. One compressed landscape asset and one character asset supply the artwork; no WebGL engine or large animation dependency. The canvas is capped at device-pixel ratio 1.5. Continuous physics live outside React render state; only destination changes update React.

## Behavior
Arrow/A/D keys walk, Space/Up/W jump, Enter opens a nearby destination. Clicking a sign or top navigation moves the character to that island and opens its accessible content dialog. Hero action starts a walk toward About. Direct navigation never requires playing. Touch controls use pointer capture. A map menu and a reading view offer alternatives. Day/night, optional synthesized ambience, motion pause, and keyboard-help controls work. Ambient sounds begin only after explicit interaction.

## Content and accessibility
Central `src/data/profile.js` supplies identity, intro, projects, skills, experience, and contact configuration. Demo projects and career entries are labelled as samples. Content dialogs use native modal semantics and focus restoration. Reduced-motion settings suppress ambient movement and long travel while preserving manual navigation. Mobile uses a horizontally scrollable world with camera follow and reachable controls. Missing images leave the navigation and reading view usable.

## Verification
Unit-test walking bounds, jump/landing, autopilot arrival, and nearby destination selection. Browser-check keyboard and touch movement, all dialogs, Escape/focus return, theme, pause, reading view, and responsive layout. Verify production build and transferred asset sizes. Report actual measured sizes rather than promising unmeasured performance scores.
