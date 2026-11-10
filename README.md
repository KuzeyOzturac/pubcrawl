# Roundabout

A responsive, static pub crawl planner. Search for a starting place, choose a minimum rating and search radius, and map every matching pub in an efficient stop order.

## How it works

- Photon provides location suggestions. The location button requests browser permission, uses recent coordinates when available, and starts pub search automatically. If permission is blocked or times out, the page explains how to continue with manual search.
- OpenStreetMap's Overpass API finds pubs in the selected radius. If it is unavailable, a bounded Nominatim search supplies up to 50 results and the map says that coverage may be incomplete. Ratings come from the OpenStreetMap `rating:average` or `rating` tags. Many pubs have no public rating, so the default includes unrated pubs; raising the rating threshold excludes them.
- A nearest-neighbour pass followed by 2-opt minimizes approximate point-to-point travel for the chosen stops. The public OSRM walking service supplies street-following geometry when available. If it is unavailable, the map shows dashed direct links and labels the distance as an estimate.
- Every discovered pub is included initially. Use **Remove** and **Add** beside each stop to adjust the crawl and automatically recalculate its order and distance.
- This is an open route from the start point through all qualifying pubs. It does not return to the start.

## Run

Open `index.html` in a browser or serve the folder with a static server, e.g. `python3 -m http.server 8000`. No build step or API keys are required. Network access is required for the map tiles and public data services.

## Limitations

OpenStreetMap coverage, ratings, and opening hours vary by place. Public services may rate-limit requests. For production-scale traffic, use hosted or self-managed APIs with explicit service terms. The route order uses straight-line distances for optimization, so it is a practical heuristic rather than a provable shortest walking path.

## Deployment

GitHub Pages can serve the repository root from the `main` branch. The site uses root-relative assets only from third-party CDNs and works under the repository path.
