/**
 * Round-trips a Phyx file through Save and re-load.
 *
 * This is the test that matters most for the file format: it checks that what
 * Klados writes out is something Klados can read back, with the curator's edits
 * intact. A change that silently drops a field on save would pass every other
 * test in this suite.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Saving and re-loading', () => {
  test('a saved Phyx file reloads with its phyloreferences and phylogeny intact', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    // Load a known example so there is something substantial to round-trip.
    await sidebar.clickReadExampleFile();
    await sidebar.clickExample('brochu-2003');
    await expect(page.getByTestId('sidebar-phyloref-0')).toBeVisible();

    // Edit it, so we can tell a real reload apart from a page that never changed.
    await sidebar.clickPhyloref(0);
    await page.locator('#label').fill('Renamed by test');
    await page.locator('#label').press('Tab');
    await expect(page.getByTestId('sidebar-phyloref-0')).toContainText('Renamed by test');

    // Save to disk.
    const savedPath = await sidebar.saveToFile();
    expect(savedPath).toBeTruthy();

    // Reload the app to clear all in-memory state, then read the file back.
    await page.reload();
    await expect(page.getByTestId('sidebar-phyloref-0')).toHaveCount(0);

    await sidebar.loadFromFile(savedPath);

    // The edit survived the round-trip.
    await expect(page.getByTestId('sidebar-phyloref-0')).toContainText('Renamed by test');

    // So did the rest of the file: all six phyloreferences and the phylogeny.
    await expect(page.getByTestId('sidebar-phyloref-5')).toBeVisible();
    await expect(page.getByTestId('sidebar-phyloref-6')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-phylogeny-0')).toBeVisible();

    // And the reloaded file still resolves, which exercises the specifiers and
    // the phylogeny together rather than just their labels.
    await sidebar.clickResolvePhylogenies();
    await sidebar.waitForResolutionComplete();
    await expect(
      page.getByTestId('phyloref-result-1-phylogeny-0')
    ).toContainText('resolved correctly to');
  });
});
