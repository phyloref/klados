/**
 * The download filename follows the phyloreference labels.
 *
 * A new phyloreference has no `label` key, so the filename depends on
 * noticing that key being added. getDownloadFilenameForPhyx is a cached Vuex
 * getter, and under Vue 3 a lodash.has() check on the label registered no
 * reactive dependency (see "Reactivity" in AGENTS.md): see #413.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Download filename', () => {
  test('labelling a new phyloreference renames the saved file', async ({ mockedPage: page }) => {
    const sidebar = new SidebarPage(page);
    const savedFilename = async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        sidebar.saveLink.click(),
      ]);
      return download.suggestedFilename();
    };

    // An unlabelled phyloreference is named by its position.
    await sidebar.addPhylorefLink.click();
    expect(await savedFilename()).toBe('Phyloref_1.json');

    await sidebar.clickPhyloref(0);
    await page.locator('#label').fill('Alligatoridae');
    await page.locator('#label').press('Tab');
    expect(await savedFilename()).toBe('Alligatoridae.json');
  });
});
