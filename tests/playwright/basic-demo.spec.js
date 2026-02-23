/**
 * Basic demo test: Brochu 2003 example
 *
 * Translates the "Basic demo" scenario from tests/selenium/Klados.side.
 *
 * Scenario:
 *  1. Load the Brochu 2003 example file.
 *  2. Resolve phyloreferences against the phylogeny (via mocked JPhyloRef).
 *  3. Assert all 6 phyloreferences resolved correctly.
 *  4. Click through to a phyloreference view and verify the expected node label.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');
const { PhyxViewPage } = require('./pages/PhyxViewPage.js');

test.describe('Basic demo — Brochu 2003', () => {
  test('loads example, resolves phylorefs, and shows correct results', async ({ mockedPage: page }) => {
    const sidebar = new SidebarPage(page);
    const summary = new PhyxViewPage(page);

    // Step 1: Load the Brochu 2003 example file.
    await sidebar.clickReadExampleFile();
    await sidebar.clickExample('brochu-2003');

    // Wait for the page to load the example (phylorefs should appear in sidebar).
    await expect(page.getByTestId('sidebar-phyloref-0')).toBeVisible();

    // Step 2: Trigger resolution.
    await sidebar.clickResolvePhylogenies();
    await sidebar.waitForResolutionComplete();

    // Step 3: Assert all 6 phyloreferences resolved correctly.
    // Phyloref 0: Alligatoridae → Alligatoridae
    await summary.assertResolvesCorrectly(0, 'Alligatoridae');

    // Phyloref 1: Alligatorinae → Alligator mississippiensis
    await summary.assertResolvesCorrectly(1, 'Alligator mississippiensis');

    // Phyloref 2: Caimaninae → Caiman crocodilus
    await summary.assertResolvesCorrectly(2, 'Caiman crocodilus');

    // Phyloref 3: Crocodyloidea → Crocodylidae
    await summary.assertResolvesCorrectly(3, 'Crocodylidae');

    // Phyloref 4: Crocodylidae → Crocodylidae
    await summary.assertResolvesCorrectly(4, 'Crocodylidae');

    // Phyloref 5: Diplocynodontinae → Diplocynodon ratelii
    await summary.assertResolvesCorrectly(5, 'Diplocynodon ratelii');

    // Step 4: Click through to Alligatoridae phyloreference and check expected node.
    await sidebar.clickPhyloref(0);
    // The phyloref view shows the expected label in #current_expected_label_phylogeny_0.
    await expect(page.locator('#current_expected_label_phylogeny_0')).toContainText('Alligatoridae');

    // Navigate to Crocodylidae (phyloref index 4) and check expected node.
    await sidebar.clickPhyloref(4);
    await expect(page.locator('#current_expected_label_phylogeny_0')).toContainText('Crocodylidae');
  });
});
