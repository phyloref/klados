/**
 * Taxonomic units on phylogeny nodes.
 *
 * Two things worth covering at once:
 *
 *  - `addTaxonomicUnitToPhylogenyNode` builds up a nested structure with four
 *    chained Vue.set calls, which is the shape most at risk when Vue 3 removes
 *    Vue.set. Nothing tested it.
 *  - The table this happens in is a bootstrap-vue `b-table` using row details,
 *    `b-card` and `b-row`. bootstrap-vue 2 is Vue 2 only, so whatever replaces
 *    it has to keep this working, and this is the test that will say whether it
 *    does.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Taxonomic units on phylogeny nodes', () => {
  test('a taxonomic unit can be added to a node, edited, and saved', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    await sidebar.addPhylogenyLink.click();
    await sidebar.clickPhylogeny(0);

    const newick = page.getByTestId('phylogeny-newick');
    await newick.fill('(Homo_sapiens, Mus_musculus)');
    await newick.blur();

    // The table lists every labelled node in the phylogeny.
    const table = page.locator('table');
    await expect(table).toContainText('Homo_sapiens');
    await expect(table).toContainText('Mus_musculus');
    await expect(table.locator('tr', { hasText: 'Homo_sapiens' })).toContainText(
      '0 taxonomic units'
    );

    // Adding one reveals the row details, which is where the editor lives.
    await page.getByTestId('add-tunit-Homo_sapiens').click();
    await expect(table.locator('tr', { hasText: 'Homo_sapiens' }).first()).toContainText(
      '1 taxonomic units'
    );

    const specifier = page.getByTestId('specifier-label');
    await expect(specifier).toBeVisible();

    // Edit the unit through the same specifier editor used for phyloref
    // specifiers, but writing into the phylogeny instead.
    await page.getByTestId('specifier-toggle').click();
    await page.locator('#genus').fill('Homo');
    await page.locator('#genus').press('Tab');
    await page.locator('#specific-epithet').fill('sapiens');
    await page.locator('#specific-epithet').press('Tab');
    await expect(specifier).toHaveValue('Homo sapiens');

    // It reaches the file, under the node label it was added to.
    const savedPath = await sidebar.saveToFile();
    const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    const nodeProps = saved.phylogenies[0].additionalNodeProperties;

    expect(nodeProps).toHaveProperty('Homo_sapiens');
    const tunits = nodeProps.Homo_sapiens.representsTaxonomicUnits;
    expect(tunits).toHaveLength(1);
    expect(JSON.stringify(tunits[0])).toContain('Homo sapiens');

    // And only the node it was added to.
    expect(nodeProps.Mus_musculus).toBeUndefined();
  });
});
