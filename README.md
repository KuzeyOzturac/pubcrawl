# Roundabout

A responsive pub crawl planner built with Astryx and its Matcha theme. Search for a starting place, choose a minimum rating and search radius, and map every matching pub in an efficient stop order.

## How it works

- Photon provides location suggestions. The location button requests browser permission, uses recent coordinates when available, and starts pub search automatically. If permission is blocked or times out, the page explains how to continue with manual search.
- The map stays empty until a starting place is selected, so it does not imply an arbitrary default city.
- OpenStreetMap's Overpass API finds pubs in the selected radius. If it is unavailable, a bounded Nominatim search supplies up to 50 results and the map says that coverage may be incomplete. Ratings come from the OpenStreetMap `rating:average` or `rating` tags. Many pubs have no public rating, so the default includes unrated pubs; raising the rating threshold excludes them.
- A nearest-neighbour pass followed by 2-opt minimizes approximate point-to-point travel for the chosen stops. The public OSRM walking service supplies street-following geometry when available. If it is unavailable, the map shows dashed direct links and labels the distance as an estimate.
- The route starts with up to six nearby pubs. Use **Remove** and **Add** beside each stop to adjust the crawl and automatically recalculate its order and distance.
- This is an open route from the start point through the selected pubs. It does not return to the start.

## Run

Run `npm install` and `npm run dev` for local development. Run `npm run build` to create `dist/` for deployment. No API keys are required. Network access is required for map tiles and public data services.

Run `npx playwright install chromium` once, then `npm test` to build and check desktop contrast, accessibility, mobile layout, keyboard location search, and route editing in Chromium. `TEST_BASE_URL=https://kuzeyozturac.github.io/pubcrawl/ npm run test:live` runs the same checks against the deployed site.

## Limitations

OpenStreetMap coverage, ratings, and opening hours vary by place. Public services may rate-limit requests. For production-scale traffic, use hosted or self-managed APIs with explicit service terms. The route order uses straight-line distances for optimization, so it is a practical heuristic rather than a provable shortest walking path.

## Deployment

Publish the `dist/` directory to GitHub Pages or another static host. Vite uses relative asset paths so the site works under a repository path.
