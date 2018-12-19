/*
 * Test aspects of the Curation Tool Vue model.
 */

/* eslint-env mocha */

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

// Load the Curation Tool code, which exports only the Vue model as 'vm'.
// Store that in a variable for easy access.
const vm = require('../js/curation-tool.js').vm;
const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;

// Test phylogeny spacingX and spacingY.
describe('Phylogeny spacing', function () {
  describe('spacingX', function () {
    it('should initially be set to vm.DEFAULT_SPACING_X', function () {
      // getPhylogenySpacing...() doesn't actually need the phylogeny to exist
      // when getting the values. In this test, we use only phylogenySpacingX[0].
      const spacingX = vm.getPhylogenySpacingX(0);
      expect(spacingX).to.equal(vm.DEFAULT_SPACING_X);
    });

    it('should be changeable using .changePhylogenySpacingX', function () {
      // To set the phylogeny, we need to update phylogenySpacingX directly.
      // We change the spacingX so it should equal 104 (an arbitrary number).
      vm.changePhylogenySpacingX(0, 104 - vm.DEFAULT_SPACING_X);
      expect(vm.getPhylogenySpacingX(0)).to.equal(104);
    });

    it('changing spacing for one phylogeny should not change it for another', function () {
      // Set the spacing value for the second phylogeny (phylogenySpacingX[1]).
      // We'll set it to 208 (another arbitrary number). We then make sure
      // that the first phylogeny spacingX remains at 104.
      vm.changePhylogenySpacingX(1, 208 - vm.DEFAULT_SPACING_X);
      expect(vm.getPhylogenySpacingX(1)).to.equal(208);
      expect(vm.getPhylogenySpacingX(0)).to.equal(104);
    });
  });

  describe('spacingY', function () {
    it('should initially be set to vm.DEFAULT_SPACING_Y', function () {
      // getPhylogenySpacing...() doesn't actually need the phylogeny to exist
      // when getting the values. In this test, we use only phylogenySpacingY[0].
      const spacingY = vm.getPhylogenySpacingY(0);
      expect(spacingY).to.equal(vm.DEFAULT_SPACING_Y);
    });

    it('should be changeable using .changePhylogenySpacingY', function () {
      // To set the phylogeny, we need to update phylogenySpacingY directly.
      // We change the spacingY so it should equal 35 (an arbitrary number).
      vm.changePhylogenySpacingY(0, 35 - vm.DEFAULT_SPACING_Y);
      expect(vm.getPhylogenySpacingY(0)).to.equal(35);
    });

    it('changing spacing for one phylogeny should not change it for another', function () {
      // Set the spacing value for the second phylogeny (phylogenySpacingY[1]).
      // We'll set it to 55 (another arbitrary number). We then make sure
      // that the first phylogeny spacingY remains at 35.
      vm.changePhylogenySpacingY(1, 55 - vm.DEFAULT_SPACING_Y);
      expect(vm.getPhylogenySpacingY(1)).to.equal(55);
      expect(vm.getPhylogenySpacingY(0)).to.equal(35);
    });
  });
});
