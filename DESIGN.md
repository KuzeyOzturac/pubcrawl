# Roundabout design system

Last updated: 2026-11-12 — app-focused copy, map empty state, keyboard search, and consolidated styles.

## Direction

A practical route planner with Astryx Matcha foundations: pale sage ground, deep green ink, clear actions, and a restrained terracotta route. Fraunces gives headings character; DM Sans keeps controls legible. Copy describes the actual route flow and avoids claims about pub quality that the data cannot establish.

## Tokens

- Background: #e9ecdf; panel: #f8f8f0; ink: #243b2d; muted: #42584a.
- Action accent: #315940; route accent: #bc694a; borders: #bcc8ae.
- Heading: Fraunces, 600–700. Body: DM Sans, 400–700.
- Eight-pixel input and action corners, thin borders, and one soft shadow around the planner.

## Layout

A compact header and factual intro sit above a two-column planner. The map receives most of the width and stays hidden until a start is selected. Below 700px, controls stack above a 440px map. Interactive controls remain 44px or larger.

## Motion and states

The route line animates as a quiet directional cue. Reduced-motion users get a static line. Loading, empty, and service errors appear next to the submit button. Search suggestions support Arrow keys, Enter, Escape, and an announced active option.

## Content

Use concise, practical language. State rating coverage and route limitations clearly. Avoid fabricated pubs, ratings, and distances.

## Astryx integration

The hero uses Astryx Theme, Heading, and Button components with the Matcha theme. The planner retains its existing DOM and route logic, with a matching visual layer in `style.css`. The generated `astryx-themes.js` records the theme choice. Build with Vite and deploy `dist/`.

Browser checks assert contrast from computed colours, accessibility, a narrow viewport without horizontal scrolling, and a full route flow using controlled public-data responses. The same checks run after deployment against GitHub Pages.
