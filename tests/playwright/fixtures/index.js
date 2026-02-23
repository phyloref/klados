/**
 * Shared Playwright fixtures for Klados integration tests.
 *
 * Provides a `mockedPage` fixture that automatically:
 *  - Intercepts JPhyloRef POST requests and returns the Brochu 2003 fixture response.
 *  - Aborts Open Tree of Life API requests (unless a test specifically needs them).
 *  - Navigates to the Klados app root before each test.
 */

const { test: base, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const bruchuResponse = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'brochu-jphyloref-response.json'), 'utf8')
);

const test = base.extend({
  mockedPage: async ({ page }, use) => {
    // Mock the JPhyloRef reasoner endpoint.
    await page.route('https://reasoner.phyloref.org/reason', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bruchuResponse),
      });
    });

    // Abort Open Tree of Life requests so tests don't depend on external state.
    await page.route('https://api.opentreeoflife.org/**', async (route) => {
      await route.abort();
    });

    await page.goto('/klados/');
    await use(page);
  },
});

module.exports = { test, expect };
