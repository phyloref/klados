/**
 * Deleting a citation.
 *
 * Covers the behaviour changed in #405: deleting the last citation should
 * remove the key from the Phyx file entirely, rather than leaving an empty
 * value behind for the exporter to write out.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Citations', () => {
  test('deleting a citation clears it from the UI and from the saved file', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    await sidebar.clickReadExampleFile();
    await sidebar.clickExample('brochu-2003');
    await expect(page.getByTestId('sidebar-phyloref-0')).toBeVisible();

    // Alligatoridae carries a definitionSource citation in the example file.
    await sidebar.clickPhyloref(0);
    const summary = page.getByTestId('citation-summary-definitionSource-0');
    await expect(summary).toHaveValue(/Phylogenetic approaches toward crocodylian history/);

    // Confirm the deletion; deleteCitation() asks before removing anything.
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('delete this citation');
      return dialog.accept();
    });
    await page.getByTestId('citation-delete-definitionSource-0').click();

    // With no citations left, the editor offers to add one instead.
    await expect(summary).toHaveCount(0);
    await expect(page.getByTestId('citation-add-definitionSource')).toBeVisible();

    // The key is gone from the saved file, not left behind as an empty value.
    const savedPath = await sidebar.saveToFile();
    const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    const alligatoridae = saved.phylorefs.find((p) => p.label === 'Alligatoridae');

    expect(alligatoridae).toBeTruthy();
    expect(alligatoridae).not.toHaveProperty('definitionSource');

    // Other phyloreferences keep theirs, so this deleted one citation and not
    // every citation on the page.
    const alligatorinae = saved.phylorefs.find((p) => p.label === 'Alligatorinae');
    expect(alligatorinae).toHaveProperty('definitionSource');
  });
});
