/**
 * Adding a citation and filling it in.
 *
 * A new citation is {}, so its summary depends on noticing each field being
 * added. The citation getters test fields with lodash.has(), which under Vue 3
 * registers no reactive dependency (see "Reactivity" in AGENTS.md): see #413.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Citation editing', () => {
  test('a new citation shows each field as it is entered, and saves them', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);

    await page.getByTestId('citation-add-definitionSource').click();
    const summary = page.getByTestId('citation-summary-definitionSource-0');
    await expect(summary).toHaveValue('Empty citation, click to enter');
    await summary.click();

    // Each field is committed on change, so move focus away after filling it.
    await page.locator('#authors').fill('Christopher A. Brochu');
    await page.locator('#authors').press('Tab');
    await expect(summary).toHaveValue(/Brochu/);

    await page.locator('#title').fill('Phylogenetic approaches toward crocodylian history');
    await page.locator('#title').press('Tab');
    await expect(summary).toHaveValue(/Phylogenetic approaches toward crocodylian history/);

    await page.locator('#year').fill('2003');
    await page.locator('#year').press('Tab');
    await expect(summary).toHaveValue(/2003/);

    // The editors field starts empty and shows what was entered once saved.
    await page.locator('#editors').fill('Kevin de Queiroz');
    await page.locator('#editors').press('Tab');
    await expect(page.locator('#editors')).toHaveValue('Kevin de Queiroz');

    const saved = JSON.parse(fs.readFileSync(await sidebar.saveToFile(), 'utf8'));
    expect(saved.phylorefs[0].definitionSource).toMatchObject({
      title: 'Phylogenetic approaches toward crocodylian history',
      authors: [{ name: 'Christopher A. Brochu' }],
      editors: [{ name: 'Kevin de Queiroz' }],
    });
  });
});
