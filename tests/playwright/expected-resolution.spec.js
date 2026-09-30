/**
 * Setting a phyloreference's expected resolution for the first time.
 *
 * A phyloreference starts with no `expectedResolution` key, so the expected
 * node label shown for each phylogeny depends on noticing that key being
 * added. Under Vue 3 lodash.has() checks on it registered no reactive
 * dependency (see "Reactivity" in AGENTS.md), and the label never updated:
 * see #413.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Expected resolution', () => {
  test('choosing an expected node updates the label and the saved file', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);

    // A phylogeny with a labelled internal node.
    await sidebar.addPhylogenyLink.click();
    await sidebar.clickPhylogeny(0);
    const newickTextarea = page.getByTestId('phylogeny-newick');
    await newickTextarea.fill('((Homo_sapiens, Mus_musculus)Mammalia, Enteroctopus_dofleini)');
    await newickTextarea.blur();
    await expect(
      page.locator('.phylotree-node-text', { hasText: 'Enteroctopus_dofleini' })
    ).toBeVisible({ timeout: 10_000 });

    // A phyloreference whose label matches no node, so nothing is expected yet.
    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);
    await page.locator('#label').fill('Theria');
    await page.locator('#label').press('Tab');

    const expectedLabel = page.getByTestId('expected-node-label-0');
    await expect(expectedLabel).toHaveValue("No node labeled 'Theria' found in phylogeny");

    // Choose Mammalia from the "Change" menu.
    await page.getByTestId('expected-nodes-change-0').click();
    const menu = page.getByTestId('expected-nodes-menu-0');
    await menu.getByText('Mammalia', { exact: true }).click();

    await expect(expectedLabel).toHaveValue('Mammalia');

    // The choice is marked in the menu, and saved with the phyloreference.
    await page.getByTestId('expected-nodes-change-0').click();
    await expect(menu.getByText('Mammalia', { exact: true })).toHaveClass(/active/);

    const saved = JSON.parse(fs.readFileSync(await sidebar.saveToFile(), 'utf8'));
    const expectedResolution = Object.values(saved.phylorefs[0].expectedResolution);
    expect(expectedResolution).toEqual([expect.objectContaining({ nodeLabel: 'Mammalia' })]);
  });
});
