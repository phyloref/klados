/**
 * Newick parse errors on a newly added phylogeny.
 *
 * A new phylogeny is created as {}, with no `newick` key, so the errors panel
 * depends on noticing that key being added. Under Vue 3 a lodash.has() check
 * on it registered no reactive dependency (see "Reactivity" in AGENTS.md), and
 * the panel never appeared: see #413.
 */

const { test, expect } = require('./fixtures/index.js');
const { SidebarPage } = require('./pages/SidebarPage.js');

test.describe('Newick errors', () => {
  test('an unbalanced Newick string on a new phylogeny shows an error, and fixing it clears it', async ({
    mockedPage: page,
  }) => {
    const sidebar = new SidebarPage(page);
    const errors = page.getByText('Errors occurred while parsing Newick string');
    const newickTextarea = page.getByTestId('phylogeny-newick');

    await sidebar.addPhylogenyLink.click();
    await sidebar.clickPhylogeny(0);
    await expect(errors).toHaveCount(0);

    // Missing a closing parenthesis. The textarea is v-model.lazy, so blur it.
    await newickTextarea.fill('((Homo_sapiens, Mus_musculus), Enteroctopus_dofleini');
    await newickTextarea.blur();
    await expect(errors).toBeVisible();
    await expect(page.getByText('Unbalanced parentheses in Newick string.')).toBeVisible();

    // Correcting it removes the errors and draws the tree instead.
    await newickTextarea.fill('((Homo_sapiens, Mus_musculus), Enteroctopus_dofleini)');
    await newickTextarea.blur();
    await expect(errors).toHaveCount(0);
    await expect(
      page.locator('.phylotree-node-text', { hasText: 'Enteroctopus_dofleini' })
    ).toBeVisible({ timeout: 10_000 });
  });
});
