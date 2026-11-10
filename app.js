const $ = (id) => document.getElementById(id);
const map = L.map('map', { zoomControl: false }).setView([51.5072, -0.1276], 12);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

let origin = null;
let pubs = [];
let excluded = new Set();
let markers = [];
let routeLayer = null;
let searchTimer;
let searchController;
let searchRequest = 0;
let routeRequest = 0;
const filters = { rating: 0, distance: 2 };
const message = (text) => { $('status').textContent = text; };
const escapeHTML = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function pin(text, start = false) {
  return L.divIcon({
    className: '',
    html: `<div class="pin${start ? ' start' : ''}">${text}</div>`,
    iconSize: start ? [33, 33] : [28, 28],
    iconAnchor: start ? [16, 16] : [14, 14],
  });
}

function clearLayers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
  if (routeLayer) map.removeLayer(routeLayer);
  routeLayer = null;
}

function resetResults() {
  searchRequest++;
  routeRequest++;
  pubs = [];
  excluded = new Set();
  clearLayers();
  $('results').hidden = true;
  $('build').disabled = false;
  $('build').textContent = 'Find my route →';
}

function startMarker() {
  markers.push(L.marker([origin.lat, origin.lon], { icon: pin('S', true) })
    .addTo(map).bindPopup(`<b>Start here</b><br>${escapeHTML(origin.label)}`));
}

function setOrigin(lat, lon, label) {
  resetResults();
  origin = { lat, lon, label };
  $('location').value = label;
  $('suggestions').hidden = true;
  startMarker();
  map.setView([lat, lon], 14);
  map.invalidateSize();
  $('map-note').textContent = 'Start point selected. Set your filters and find a route.';
  message(`Ready to find pubs around ${label}.`);
}

function placeLabel(properties) {
  return [properties.name || properties.street || properties.city,
    properties.city !== properties.name ? properties.city : null,
    properties.state, properties.country].filter(Boolean).join(', ');
}

$('rating').addEventListener('input', (event) => {
  filters.rating = Number(event.target.value);
  $('rating-value').textContent = filters.rating ? `${filters.rating.toFixed(1)}+` : 'Any';
});
$('distance').addEventListener('input', (event) => {
  filters.distance = Number(event.target.value);
  $('distance-value').textContent = `${filters.distance} km`;
});
$('locate').addEventListener('click', () => {
  if (!window.isSecureContext || !navigator.geolocation) {
    message('Your browser cannot share location on this page. Search for a place instead.');
    return;
  }
  const button = $('locate');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.title = 'Finding your location…';
  message('Finding your location… Allow location access if your browser asks.');
  const finish = () => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.title = 'Use my location';
  };
  navigator.geolocation.getCurrentPosition(
    (position) => {
      finish();
      setOrigin(position.coords.latitude, position.coords.longitude, 'Your location');
      $('build').click();
    },
    (error) => {
      finish();
      if (error.code === 1) message('Location access was blocked. Allow it in your browser’s site settings, or search for a place.');
      else if (error.code === 3) message('Location timed out. Try again or search for a place.');
      else message('Your position is unavailable. Try again or search for a place.');
    },
    { enableHighAccuracy: false, maximumAge: 300000, timeout: 20000 },
  );
});

$('location').addEventListener('input', (event) => {
  origin = null;
  resetResults();
  clearTimeout(searchTimer);
  const query = event.target.value.trim();
  $('suggestions').hidden = true;
  if (query.length < 3) return;
  searchTimer = setTimeout(async () => {
    searchController?.abort();
    searchController = new AbortController();
    try {
      const response = await fetch(`https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(query)}`, { signal: searchController.signal });
      if (!response.ok) throw new Error('Search is unavailable. Try again shortly.');
      const matches = (await response.json()).features || [];
      $('suggestions').replaceChildren();
      matches.forEach((feature) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'option');
        button.textContent = placeLabel(feature.properties);
        button.addEventListener('click', () => setOrigin(feature.geometry.coordinates[1], feature.geometry.coordinates[0], button.textContent));
        $('suggestions').append(button);
      });
      $('suggestions').hidden = matches.length === 0;
      if (!matches.length) message('No places found. Try a broader search.');
    } catch (error) {
      if (error.name !== 'AbortError') message(error.message);
    }
  }, 300);
});
$('location').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') $('suggestions').hidden = true;
  if (event.key === 'Enter' && !$('suggestions').hidden) {
    const first = $('suggestions').querySelector('button');
    if (first) { event.preventDefault(); first.click(); }
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.field')) $('suggestions').hidden = true;
});

function km(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(value));
}

function routeLength(order) {
  let distance = 0;
  let previous = origin;
  order.forEach((pub) => { distance += km(previous, pub); previous = pub; });
  return distance;
}

function optimize(stops) {
  const remaining = [...stops];
  const ordered = [];
  let previous = origin;
  while (remaining.length) {
    let nearest = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (km(previous, remaining[i]) < km(previous, remaining[nearest])) nearest = i;
    }
    previous = remaining.splice(nearest, 1)[0];
    ordered.push(previous);
  }
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const before = i ? ordered[i - 1] : origin;
        const after = ordered[j + 1];
        const oldDistance = km(before, ordered[i]) + (after ? km(ordered[j], after) : 0);
        const newDistance = km(before, ordered[j]) + (after ? km(ordered[i], after) : 0);
        if (newDistance + 0.00001 < oldDistance) {
          ordered.splice(i, j - i + 1, ...ordered.slice(i, j + 1).reverse());
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return ordered;
}

async function walkingRoute(points) {
  const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(';');
  const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`);
  if (!response.ok) throw new Error('Walking route unavailable');
  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Walking route unavailable');
  return data.routes[0];
}

async function findPubs() {
  const radius = Math.round(filters.distance * 1000);
  const query = `[out:json][timeout:20];(node["amenity"="pub"](around:${radius},${origin.lat},${origin.lon});way["amenity"="pub"](around:${radius},${origin.lat},${origin.lon}););out center tags;`;
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error('Overpass unavailable');
    const data = await response.json();
    return { source: 'overpass', items: data.elements.map((element) => ({
      id: `${element.type}${element.id}`,
      lat: element.lat ?? element.center?.lat,
      lon: element.lon ?? element.center?.lon,
      name: element.tags?.name || 'Unnamed pub',
      tags: element.tags || {},
    })) };
  } catch {
    // Nominatim is a bounded fallback. Its public API returns at most 50 places.
    const latOffset = filters.distance / 111;
    const lonOffset = filters.distance / (111 * Math.max(0.2, Math.cos(origin.lat * Math.PI / 180)));
    const params = new URLSearchParams({
      amenity: 'pub',
      viewbox: `${origin.lon - lonOffset},${origin.lat + latOffset},${origin.lon + lonOffset},${origin.lat - latOffset}`,
      bounded: '1', format: 'json', extratags: '1', limit: '50',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!response.ok) throw new Error('Pub search is unavailable. Please try again.');
    const data = await response.json();
    return { source: 'nominatim', items: data.map((item) => ({
      id: `${item.osm_type}${item.osm_id}`,
      lat: Number(item.lat), lon: Number(item.lon),
      name: item.name || 'Unnamed pub', tags: item.extratags || {},
    })) };
  }
}

function renderList(ordered) {
  const list = $('stops');
  list.replaceChildren();
  const included = new Set(ordered.map((pub) => pub.id));
  [...ordered, ...pubs.filter((pub) => !included.has(pub.id))].forEach((pub, index) => {
    const active = !excluded.has(pub.id);
    const item = document.createElement('li');
    if (!active) item.className = 'excluded';
    const number = document.createElement('span');
    number.className = 'stop-number';
    number.textContent = active ? String(index + 1) : '–';
    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = pub.name;
    const rating = document.createElement('span');
    rating.textContent = pub.rating ? `${pub.rating.toFixed(1)} / 5 rating` : 'No public rating';
    details.append(name, rating);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'stop-toggle';
    toggle.textContent = active ? 'Remove' : 'Add';
    toggle.setAttribute('aria-label', `${active ? 'Remove' : 'Add'} ${pub.name} ${active ? 'from' : 'to'} route`);
    toggle.addEventListener('click', () => {
      if (active) excluded.add(pub.id); else excluded.delete(pub.id);
      renderRoute();
    });
    item.append(number, details, toggle);
    list.append(item);
  });
}

async function renderRoute() {
  const request = ++routeRequest;
  clearLayers();
  startMarker();
  const ordered = optimize(pubs.filter((pub) => !excluded.has(pub.id)));
  renderList(ordered);
  $('results').hidden = false;
  requestAnimationFrame(() => map.invalidateSize());
  $('result-title').textContent = `${ordered.length} pub${ordered.length === 1 ? '' : 's'} on your route`;
  if (!ordered.length) {
    $('stats').textContent = 'Add a pub below to rebuild your route.';
    $('map-note').textContent = 'No pubs selected.';
    map.setView([origin.lat, origin.lon], 14);
    message('All pubs removed. Add any pub to rebuild your route.');
    return;
  }
  ordered.forEach((pub, index) => {
    markers.push(L.marker([pub.lat, pub.lon], { icon: pin(index + 1) }).addTo(map)
      .bindPopup(`<b>${escapeHTML(pub.name)}</b><br>${pub.rating ? `${pub.rating.toFixed(1)} / 5 rating` : 'Rating unavailable'}`));
  });
  const points = [origin, ...ordered];
  let distance = routeLength(ordered);
  let approximate = true;
  try {
    const route = await walkingRoute(points);
    if (request !== routeRequest) return;
    routeLayer = L.geoJSON(route.geometry, { style: { color: '#d46c42', weight: 5, opacity: 0.95, className: 'route-line' } }).addTo(map);
    distance = route.distance / 1000;
    approximate = false;
  } catch {
    if (request !== routeRequest) return;
    routeLayer = L.polyline(points.map((point) => [point.lat, point.lon]), {
      color: '#d46c42', weight: 4, dashArray: '6 9', className: 'route-line',
    }).addTo(map);
  }
  map.fitBounds(routeLayer.getBounds().pad(0.13), { padding: [30, 30] });
  $('stats').innerHTML = `<span><b>${distance.toFixed(1)} km</b> ${approximate ? 'estimated direct distance' : 'walking route'}</span><span><b>${ordered.length}</b> stops</span>`;
  $('map-note').textContent = approximate
    ? 'Dashed lines show direct links; walking directions are temporarily unavailable.'
    : 'Walking paths shown. Stop order minimizes approximate travel distance.';
  message('Route ready. Add or remove pubs to adjust it.');
}

$('build').addEventListener('click', async () => {
  if (!origin) {
    message('Select a place from the suggestions or use your location first.');
    $('location').focus();
    return;
  }
  resetResults();
  const request = ++searchRequest;
  startMarker();
  const button = $('build');
  button.disabled = true;
  button.textContent = 'Finding pubs…';
  message('Searching nearby pubs…');
  try {
    const search = await findPubs();
    if (request !== searchRequest) return;
    const found = search.items.map((item) => {
      const rating = Number(item.tags?.['rating:average'] ?? item.tags?.rating);
      return {
        id: item.id, lat: item.lat, lon: item.lon, name: item.name,
        rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
      };
    }).filter((pub) => Number.isFinite(pub.lat) && Number.isFinite(pub.lon)
      && km(origin, pub) <= filters.distance
      && (!filters.rating || (pub.rating !== null && pub.rating >= filters.rating)));
    pubs = [...new Map(found.map((pub) => [`${pub.name.toLowerCase()}|${pub.lat.toFixed(4)}|${pub.lon.toFixed(4)}`, pub])).values()];
    if (!pubs.length) {
      $('map-note').textContent = 'No matching pubs in this area.';
      message('No pubs match these filters. Try a larger radius or lower rating.');
      return;
    }
    excluded = new Set();
    await renderRoute();
    if (search.source === 'nominatim') {
      $('map-note').textContent += ' Pub search used a 50-result fallback; some pubs may be missing.';
    }
  } catch (error) {
    message(error.message || 'Could not load pubs. Please try again.');
  } finally {
    if (request === searchRequest) {
      button.disabled = false;
      button.textContent = 'Find my route →';
    }
  }
});
