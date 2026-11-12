# Roundabout design system

Last updated: 2026-11-12 — Astryx Matcha redesign and Vite build.

## Direction

An editorial field guide with Astryx Matcha foundations: pale sage ground, deep green ink, botanical controls, and a restrained terracotta route. Large Fraunces headings give the page character; DM Sans keeps the controls legible.

## Tokens

- Background: #f4f0e7; panel: #fffcf5; ink: #172b25; muted: #526359.
- Action accent: #d3e179; route accent: #d46c42; borders: #d6d7c9.
- Heading: Fraunces, 600–700. Body: DM Sans, 400–700.
- Square-ish 3px controls, thin borders, limited shadow on the main planner.

## Layout

A compact header and asymmetric editorial intro sit above a two-column planner. The map receives most of the width and stretches to the controls without contributing to their intrinsic height. Below 700px, controls stack above a 440px map. Controls remain 44px or larger.

## Motion and states

The route line animates as a quiet directional cue. Reduced-motion users get a static line. Loading, empty, and service errors appear next to the submit button. Search suggestions are keyboard-accessible and Escape closes them.

## Content

Use concise, practical language. State rating coverage and route limitations clearly. Avoid fabricated pubs, ratings, and distances.

## Astryx integration

The hero uses Astryx Theme, Heading, and Button components with the Matcha theme. The planner retains its existing DOM and route logic, with a matching visual layer in `style.css`. The generated `astryx-themes.js` records the theme choice. Build with Vite and deploy `dist/`.
