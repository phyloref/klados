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
const ct = require('../js/curation-tool.js');
const vm = ct.vm;

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;

// Test phylogeny spacingX and spacingY.
describe('Phylogeny spacing', function () {
  describe('spacingX', function () {
    it('should be modifiable', function () {
      // getPhylogenySpacing...() doesn't actually need the phylogeny to exist
      // when getting the values. In this test, we use only phylogenySpacingX[0].
      var spacingX = vm.getPhylogenySpacingX(0);
      assert.isOk(spacingX);
      assert.equal(spacingX, vm.DEFAULT_SPACING_X, 'Initial spacingX should be set to the default');

      // To set the phylogeny, we need to update phylogenySpacingX directly.
      vm.phylogenySpacingX[0] = 104;
      assert.equal(vm.getPhylogenySpacingX(0), 104, 'spacingX can be changed by modifying the returned value');
    });

    it('should not be shared by all phylogenies', function () {
      // Set the spacing value for the second phylogeny (phylogenySpacingX[1]).
      vm.phylogenySpacingX[1] = 208;
      assert.equal(vm.getPhylogenySpacingX(1), 208, 'spacingX[1] has a new value');
      assert.equal(vm.getPhylogenySpacingX(0), 104, 'spacingX[0] retains its existing value from the previous test');
    });
  });
  describe('spacingY', function () {
    it('should be modifiable', function () {
      // getPhylogenySpacing...() doesn't actually need the phylogeny to exist
      // when getting the values. In this test, we use only phylogenySpacingY[0].
      var spacingY = vm.getPhylogenySpacingY(0);
      assert.isOk(spacingY);
      assert.equal(spacingY, vm.DEFAULT_SPACING_Y, 'Initial spacingY should be set to the default');

      // To set the phylogeny, we need to update phylogenySpacingY directly.
      vm.phylogenySpacingY[0] = 17;
      assert.equal(vm.getPhylogenySpacingY(0), 17, 'spacingY can be changed by modifying the returned value');
    });
    
    it('should not be shared by all phylogenies', function () {
      // Set the spacing value for the second phylogeny (phylogenySpacingY[1]).
      vm.phylogenySpacingY[1] = 19;
      assert.equal(vm.getPhylogenySpacingY(1), 19, 'spacingY[1] has a new value');
      assert.equal(vm.getPhylogenySpacingY(0), 17, 'spacingY[0] retains its existing value from the previous test');
    });
  });
});
