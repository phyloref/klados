/**
 * Page object for Klados sidebar interactions.
 */
class SidebarPage {
  constructor(page) {
    this.page = page;
    this.readExampleFileLink = page.getByTestId('sidebar-read-example-file');
    this.resolveButton = page.getByTestId('sidebar-resolve-phylogenies');
    this.addPhylogenyLink = page.getByTestId('sidebar-add-phylogeny');
    this.addPhylorefLink = page.getByTestId('sidebar-add-phyloref');
    this.saveLink = page.getByTestId('sidebar-save');
    this.fileInput = page.locator('#file-input');
  }

  /**
   * Clicks Save and returns the path of the downloaded Phyx file.
   */
  async saveToFile() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.saveLink.click(),
    ]);
    return download.path();
  }

  /**
   * Loads a Phyx file from disk through the hidden file input.
   */
  async loadFromFile(filePath) {
    await this.fileInput.setInputFiles(filePath);
  }

  async clickReadExampleFile() {
    await this.readExampleFileLink.click();
  }

  async clickExample(titleSlug) {
    await this.page.getByTestId(`sidebar-example-${titleSlug}`).click();
  }

  async clickResolvePhylogenies() {
    await this.resolveButton.click();
  }

  async waitForResolutionComplete() {
    // Wait for the button text to return to "Resolve against phylogenies".
    await this.page.waitForFunction(() => {
      const span = document.querySelector('[data-testid="sidebar-resolve-phylogenies"] span');
      return span && span.textContent.trim() === 'Resolve against phylogenies';
    }, { timeout: 30_000 });
  }

  async clickPhyloref(index) {
    await this.page.getByTestId(`sidebar-phyloref-${index}`).click();
  }

  async clickPhylogeny(index) {
    await this.page.getByTestId(`sidebar-phylogeny-${index}`).click();
  }
}

module.exports = { SidebarPage };
