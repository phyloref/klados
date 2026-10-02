/**
 * Editing a specifier across all three of its kinds, and deleting it.
 *
 * Only the taxon-name path had any coverage. The specimen and external
 * reference paths, and deletion, were untested — and all three run through the
 * Vue.set and Vue.delete calls that Vue 3 removes, so they are the paths most
 * likely to break quietly during that migration.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Specifier kinds', () => {
  test('a specifier can be edited as a taxon, a specimen or an external reference', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);
    await page.getByTestId('add-internal-specifier').click();

    // Work inside this one specifier row: field ids repeat across specifiers.
    const specifier = page.getByTestId('internal-specifier-0');
    const label = specifier.getByTestId('specifier-label');

    await specifier.getByTestId('specifier-toggle').click();

    // A new specifier starts as a taxon concept.
    await expect(specifier.locator('#specifier-class')).toHaveValue('Taxon');

    // 1. Taxon: a name assembled from its parts.
    await specifier.locator('#genus').fill('Homo');
    await specifier.locator('#genus').press('Tab');
    await specifier.locator('#specific-epithet').fill('sapiens');
    await specifier.locator('#specific-epithet').press('Tab');
    await expect(label).toHaveValue('Homo sapiens');

    // 2. Specimen: identified by its occurrence ID.
    await selectSpecifierClass(specifier, 'Specimen');
    await specifier.locator('#occurrence-id').fill('urn:catalog:MVZ:Mammals:12345');
    await specifier.locator('#occurrence-id').press('Tab');
    await expect(label).toHaveValue('urn:catalog:MVZ:Mammals:12345');

    // 3. External reference: identified by a URI.
    await selectSpecifierClass(specifier, 'External reference');
    await specifier.locator('#external-reference').fill('https://example.org/taxon/1');
    await specifier.locator('#external-reference').press('Tab');
    await expect(label).toHaveValue('https://example.org/taxon/1');

    // The choice reaches the saved file, not just the form.
    const savedPath = await sidebar.saveToFile();
    const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    expect(saved.phylorefs[0].internalSpecifiers[0]).toHaveProperty(
      '@id',
      'https://example.org/taxon/1'
    );
  });

  test('deleting a specifier removes it and changes the phyloreference type', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);
    const phylorefType = page.locator('#phyloref-type');

    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);

    await page.getByTestId('add-internal-specifier').click();
    await page.getByTestId('add-internal-specifier').click();
    await expect(phylorefType).toHaveValue('Minimum clade definition');
    await expect(page.getByTestId('internal-specifier-1')).toBeVisible();

    // deleteSpecifier() asks before removing anything.
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('delete this specifier');
      return dialog.accept();
    });
    await page.getByTestId('internal-specifier-1').getByTestId('specifier-delete').click();

    // One specifier left, and the type falls back accordingly.
    await expect(page.getByTestId('internal-specifier-1')).toHaveCount(0);
    await expect(page.getByTestId('internal-specifier-0')).toBeVisible();
    await expect(phylorefType).toHaveValue(
      'Invalid definition (single internal specifier cannot be resolved)'
    );
  });
});

/**
 * Opens the specifier-kind dropdown and picks one. The dropdown is a Bootstrap 4
 * one, so the menu has to be opened before its items can be clicked.
 */
async function selectSpecifierClass(specifier, className) {
  await specifier.locator('button.dropdown-toggle').first().click();
  await specifier.getByRole('link', { name: className, exact: true }).click();
}
