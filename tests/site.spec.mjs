import {test, expect} from '@playwright/test';

const places = {
  features: [{
    properties: {name: 'Toronto City Hall', city: 'Toronto', country: 'Canada'},
    geometry: {coordinates: [-79.3849, 43.6535]},
  }],
};

const pubs = Array.from({length: 8}, (_, index) => ({
  type: 'node',
  id: index + 1,
  lat: 43.6535 + (index + 1) * 0.0007,
  lon: -79.3849 + (index + 1) * 0.0005,
  tags: {name: [
    'The Queen and Beaver', 'Bar Volo', 'The Rex', 'The Horseshoe Tavern',
    'The Cameron House', 'The Imperial Pub', 'The Rivoli', 'The Piston',
  ][index]},
}));

async function mockPublicData(page) {
  await page.route('https://photon.komoot.io/api/**', (route) => route.fulfill({json: places}));
  await page.route('https://overpass-api.de/api/interpreter**', (route) => route.fulfill({json: {elements: pubs}}));
  await page.route('https://routing.openstreetmap.de/**', (route) => route.fulfill({json: {
    code: 'Ok', routes: [{distance: 3200, geometry: {type: 'LineString', coordinates: [
      [-79.3849, 43.6535], [-79.381, 43.659],
    ]}}],
  }}));
}

async function contrast(page, foregroundSelector, backgroundSelector) {
  return page.evaluate(({foregroundSelector, backgroundSelector}) => {
    const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = (color) => {
      const channels = rgb(color).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const foreground = getComputedStyle(document.querySelector(foregroundSelector)).color;
    const background = getComputedStyle(document.querySelector(backgroundSelector)).backgroundColor;
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  }, {foregroundSelector, backgroundSelector});
}

test('built page has readable type and actions', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('./');
  await expect(page.locator('.hero h1')).toBeVisible();
  for (const [text, surface] of [
    ['.hero h1', 'body'],
    ['.hero h1 em', 'body'],
    ['.controls h2', '.controls'],
    ['.footer', 'body'],
    ['.hero-actions button span', '.hero-actions button'],
  ]) {
    expect(await contrast(page, text, surface), `${text} contrast`).toBeGreaterThanOrEqual(4.5);
  }
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  expect((await map.boundingBox()).width).toBeGreaterThan(600);
});

test('mobile layout and route editing work', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await mockPublicData(page);
  await page.goto('./');
  await expect(page.locator('.hero h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.getByRole('button', {name: 'Plan a crawl'}).click();
  await expect(page.locator('#location')).toBeFocused();
  await page.locator('#location').fill('Toronto');
  await page.getByRole('option', {name: /Toronto City Hall/}).click();
  await page.locator('#build').click();
  await expect(page.locator('#result-title')).toHaveText('6 pubs on your route');
  await expect(page.locator('#stats')).toContainText('6 stops');
  await expect(page.locator('.stop-toggle', {hasText: 'Add'})).toHaveCount(2);

  await page.locator('.stop-toggle', {hasText: 'Remove'}).first().click();
  await expect(page.locator('#result-title')).toHaveText('5 pubs on your route');
  await expect(page.locator('#stats')).toContainText('5 stops');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const controls = await page.locator('.controls').boundingBox();
  const map = await page.locator('.map-wrap').boundingBox();
  expect(map.y).toBeGreaterThanOrEqual(controls.y + controls.height - 1);
});
