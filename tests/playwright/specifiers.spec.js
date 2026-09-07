/**
 * Specifier structure drives the phyloreference type.
 *
 * The type is derived purely from how many internal and external specifiers a
 * phyloreference has, so this exercises the whole ladder without needing to
 * fill in any taxon details.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Specifiers and phyloreference type', () => {
  test('adding internal and external specifiers changes the reported type', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);
    const phylorefType = page.locator('#phyloref-type');

    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);

    // No specifiers at all.
    await expect(phylorefType).toHaveValue(
      'Invalid definition (must have at least one internal specifier)'
    );

    // One internal specifier is not enough to resolve to a node.
    await page.getByTestId('add-internal-specifier').click();
    await expect(phylorefType).toHaveValue(
      'Invalid definition (single internal specifier cannot be resolved)'
    );

    // Two internal specifiers define a minimum clade: the last common ancestor.
    await page.getByTestId('add-internal-specifier').click();
    await expect(phylorefType).toHaveValue('Minimum clade definition');

    // Adding an external specifier makes it a maximum clade definition.
    await page.getByTestId('add-external-specifier').click();
    await expect(phylorefType).toHaveValue('Maximum clade definition');
  });
});
