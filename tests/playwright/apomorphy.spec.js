/**
 * Adding and removing a phyloreference's apomorphy.
 *
 * Whether a phyloreference has an apomorphy is decided by lodash.has() checks,
 * in PhylorefView's hasApomorphy computed and in the isApomorphyBasedPhyloref
 * getter that drives the phyloreference type. Under Vue 3, has() registers no
 * reactive dependency (see "Reactivity" in AGENTS.md), so this asserts that the
 * toggle, the apomorphy fields and the reported type all follow each change.
 */

const fs = require('fs');
const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

const DEFINITION = 'A complete turtle shell as inherited by Testudo graeca.';
const BEARING_ENTITY = 'http://purl.obolibrary.org/obo/UBERON_0008271';

test.describe('Apomorphy', () => {
  test('toggling the apomorphy shows, hides and restores its fields', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);
    const toggleOn = page.getByTestId('apomorphy-toggle-on');
    const toggleOff = page.getByTestId('apomorphy-toggle-off');
    const noApomorphy = page.getByText('No apomorphy in this phyloreference.');
    const definition = page.locator('#apomorphy-definition');
    const bearingEntity = page.locator('#bearing-entity');
    const phylorefType = page.locator('#phyloref-type');
    const savedPhyloref = async () =>
      JSON.parse(fs.readFileSync(await sidebar.saveToFile(), 'utf8')).phylorefs[0];

    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);

    // An apomorphy-based definition needs exactly one internal specifier.
    await page.getByTestId('add-internal-specifier').click();
    await expect(phylorefType).toHaveValue(
      'Invalid definition (single internal specifier cannot be resolved)'
    );

    // A new phyloreference has no apomorphy.
    await expect(toggleOff).toBeVisible();
    await expect(toggleOn).toHaveCount(0);
    await expect(noApomorphy).toBeVisible();
    await expect(definition).toHaveCount(0);

    // Turning it on shows the fields and flips the toggle.
    await toggleOff.click();
    await expect(toggleOn).toBeVisible();
    await expect(toggleOff).toHaveCount(0);
    await expect(noApomorphy).toHaveCount(0);
    await expect(definition).toBeVisible();

    // A definition makes this an apomorphy-based phyloreference.
    await definition.fill(DEFINITION);
    await bearingEntity.fill(BEARING_ENTITY);
    await expect(phylorefType).toHaveValue('Apomorphy-based clade definition');
    expect((await savedPhyloref()).apomorphy).toMatchObject({
      definition: DEFINITION,
      bearingEntity: BEARING_ENTITY,
    });

    // Turning it off removes the apomorphy from the page, the type and the file.
    await toggleOn.click();
    await expect(toggleOff).toBeVisible();
    await expect(toggleOn).toHaveCount(0);
    await expect(noApomorphy).toBeVisible();
    await expect(definition).toHaveCount(0);
    await expect(phylorefType).toHaveValue(
      'Invalid definition (single internal specifier cannot be resolved)'
    );
    expect(await savedPhyloref()).not.toHaveProperty('apomorphy');

    // Turning it back on restores what was typed, so an accidental click
    // loses nothing.
    await toggleOff.click();
    await expect(definition).toHaveValue(DEFINITION);
    await expect(bearingEntity).toHaveValue(BEARING_ENTITY);
    await expect(phylorefType).toHaveValue('Apomorphy-based clade definition');
  });
});
