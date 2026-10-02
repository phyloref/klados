/**
 * Page object for PhyxView (summary table) assertions.
 */
const { expect } = require('@playwright/test');

class PhyxViewPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Returns the result cell locator for a given phyloref and phylogeny (0-indexed).
   */
  resultCell(phylorefIndex, phylogenyIndex = 0) {
    return this.page.getByTestId(
      `phyloref-result-${phylorefIndex}-phylogeny-${phylogenyIndex}`
    );
  }

  async assertResolvesCorrectly(phylorefIndex, expectedNodeLabel, phylogenyIndex = 0) {
    const cell = this.resultCell(phylorefIndex, phylogenyIndex);
    await expect(cell).toContainText(`Expected to resolve to node ${expectedNodeLabel}`);
    await expect(cell).toContainText('resolved correctly to');
    await expect(cell).toContainText(expectedNodeLabel);
  }
}

module.exports = { PhyxViewPage };
