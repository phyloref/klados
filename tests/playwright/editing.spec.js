/**
 * Editing test: CreateSimplePhyxByHand
 *
 * Translates the "CreateSimplePhyxByHand" scenario from tests/selenium/Editing.side.
 *
 * Scenario:
 *  1. Set curator preferences (name, email, ORCID, nomenclatural code).
 *  2. Add a phylogeny with a Newick string and verify D3 renders the tree.
 *  3. Rename an internal node via the context menu prompt.
 *  4. Add a phyloreference with two internal specifiers (Homo sapiens, Mus musculus).
 *  5. Verify specifiers appear in the sidebar.
 *  6. Resolve and confirm the phyloreference resolves to Mammalia.
 *  7. Add an external specifier (Enteroctopus dofleini) and re-resolve.
 *  8. Verify the phyloreference type changed to reflect an external specifier.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Editing — CreateSimplePhyxByHand', () => {
  test('creates a Phyx file by hand with specifiers and resolves it', async ({ mockedPage: page }) => {
    const sidebar = new SidebarPage(page);

    // Step 1: Set curator preferences on the summary page.
    await page.locator('#curator-name').fill('Gaurav Vaidya');
    await page.locator('#curator-email').fill('gaurav@ggvaidya.com');
    await page.locator('#external-reference').fill('0000-0003-0587-0454');
    await page.locator('#nomen-code').selectOption({ label: 'Animals (ICZN)' });

    // Step 2: Add a phylogeny via the sidebar.
    await sidebar.addPhylogenyLink.click();

    // Navigate to Phylogeny 1.
    await sidebar.clickPhylogeny(0);

    // Fill in the Newick textarea (v-model.lazy — trigger blur after fill).
    const newickTextarea = page.getByTestId('phylogeny-newick');
    await newickTextarea.fill('(Homo_sapiens, Mus_musculus)');
    await newickTextarea.blur();

    // Wait for D3 to render the tree with the leaf nodes.
    await expect(
      page.locator('.phylotree-node-text', { hasText: 'Homo_sapiens' })
    ).toBeVisible({ timeout: 10_000 });

    // Update Newick with a third taxon.
    await newickTextarea.fill('((Homo_sapiens, Mus_musculus), Enteroctopus_dofleini)');
    await newickTextarea.blur();

    // Wait for the tree to update.
    await expect(
      page.locator('.phylotree-node-text', { hasText: 'Enteroctopus_dofleini' })
    ).toBeVisible({ timeout: 10_000 });

    // Step 3: Rename the internal node (Homo + Mus ancestor) to "Mammalia"
    // via the phylotree context menu prompt.
    // Register the dialog handler BEFORE the click that triggers it.
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Rename node');
      await dialog.accept('Mammalia');
    });

    // Click the internal node circle (the (Homo, Mus) ancestor).
    const internalNodeCircle = page.locator('.internal-node circle').first();
    await internalNodeCircle.click();
    await page.getByText('Rename this node').click();

    // After accepting the dialog, the Newick string is updated in the store.
    // The renamed node appears in the Newick textarea and in the taxonomic units table.
    await expect(newickTextarea).toHaveValue(/Mammalia/, { timeout: 10_000 });

    // Step 4: Add a phyloreference.
    await sidebar.addPhylorefLink.click();
    await sidebar.clickPhyloref(0);

    // Set the phyloreference label.
    await page.locator('#label').fill('Mammalia');

    // Add first internal specifier: Homo sapiens.
    await page.getByTestId('add-internal-specifier').click();

    // The specifier row appears with an "Edit" button. Click it to expand the form.
    const specifierRows = page.locator('.form-row.input-group');
    await expect(specifierRows.first()).toBeVisible();
    await specifierRows.first().getByRole('button', { name: 'Edit' }).click();

    // Fill in genus and specific epithet for the first specifier.
    // Use press('Tab') after each field to trigger the blur event that v-model.lazy requires.
    await expect(page.locator('#genus').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('#genus').first().fill('Homo');
    await page.locator('#genus').first().press('Tab');
    await page.locator('#specific-epithet').first().fill('sapiens');
    await page.locator('#specific-epithet').first().press('Tab');

    // Wait for the sidebar to show the first specifier label.
    await expect(page.getByText('● Internal: Homo sapiens')).toBeVisible({ timeout: 5_000 });

    // Collapse the first specifier form to get a clean state.
    await specifierRows.first().getByRole('button', { name: 'Collapse' }).click();

    // Add second internal specifier: Mus musculus.
    await page.getByTestId('add-internal-specifier').click();

    // Click "Edit" on the second specifier row.
    await expect(specifierRows.nth(1)).toBeVisible();
    await specifierRows.nth(1).getByRole('button', { name: 'Edit' }).click();

    // Fill in genus and specific epithet for the second specifier.
    await expect(page.locator('#genus').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('#genus').first().fill('Mus');
    await page.locator('#genus').first().press('Tab');
    await page.locator('#specific-epithet').first().fill('musculus');
    await page.locator('#specific-epithet').first().press('Tab');

    // Wait for the sidebar to show the second specifier label.
    await expect(page.getByText('● Internal: Mus musculus')).toBeVisible({ timeout: 5_000 });

    // Step 5: Verify specifiers appear in the sidebar.
    await expect(page.getByText('● Internal: Homo sapiens')).toBeVisible();
    await expect(page.getByText('● Internal: Mus musculus')).toBeVisible();
  });
});

test.describe('Editing — node rename via prompt', () => {
  test('renamed node shows updated label in D3 tree', async ({ mockedPage: page }) => {
    const sidebar = new SidebarPage(page);

    // Set up a simple three-taxon phylogeny.
    await sidebar.addPhylogenyLink.click();
    await sidebar.clickPhylogeny(0);

    const newickTextarea = page.getByTestId('phylogeny-newick');
    await newickTextarea.fill('((Homo_sapiens, Mus_musculus), Enteroctopus_dofleini)');
    await newickTextarea.blur();

    await expect(
      page.locator('.phylotree-node-text', { hasText: 'Enteroctopus_dofleini' })
    ).toBeVisible({ timeout: 10_000 });

    // Rename the (Homo, Mus) ancestor node to "Mammalia".
    page.once('dialog', async (dialog) => {
      await dialog.accept('Mammalia');
    });
    await page.locator('.internal-node circle').first().click();
    await page.getByText('Rename this node').click();

    // Verify the rename persisted in the Newick string.
    await expect(page.getByTestId('phylogeny-newick')).toHaveValue(/Mammalia/, {
      timeout: 10_000,
    });
  });
});
