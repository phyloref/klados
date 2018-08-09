/*
 * Test phyloreferences.
 */

/* eslint-env mocha */

global.Vue = require('vue');

// Load moment as a global variable so it can be accessed by phyx.js.
global.moment = require('moment');

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;

// Some phylogenies to use in testing.
const phylogeny1 = {
  newick: '((MVZ225749, MVZ191016)Test, "Rana boylii")',
  additionalNodeProperties: {
    MVZ225749: {
      representsTaxonomicUnits: [{
        scientificNames: [{ scientificName: 'Rana luteiventris' }],
        includesSpecimens: [{ occurrenceID: 'MVZ:225749' }],
      }],
    },
    MVZ191016: {
      representsTaxonomicUnits: [{
        scientificNames: [{ scientificName: 'Rana luteiventris' }],
        includesSpecimens: [{ occurrenceID: 'MVZ:191016' }],
      }],
    },
    Test: {
      expectedPhyloreferenceNamed: 'phyloref1',
    },
  },
};

// Some specifiers to use in testing.
const specifier1 = {
  referencesTaxonomicUnits: [{
    includesSpecimens: [{
      occurrenceID: 'MVZ:225749',
    }],
  }],
};
const specifier2 = {
  referencesTaxonomicUnits: [{
    includesSpecimens: [{
      occurrenceID: 'MVZ:191016',
    }],
  }],
};
const specifier3 = {
  referencesTaxonomicUnits: [{
    scientificNames: [{
      scientificName: 'Rana boylii',
    }],
  }],
};

describe('PhylorefWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      const wrapper = new phyx.PhylogenyWrapper({});
      assert.isOk(wrapper);
      assert.isUndefined(wrapper.label);
    });
  });

  describe('#specifiers', function () {
    it('should be able to insert and delete specifiers', function () {
      const wrapper = new phyx.PhylorefWrapper({});
      assert.isUndefined(wrapper.label);

      wrapper.phyloref.label = 'phyloref1';
      assert.equal(wrapper.label, 'phyloref1');

      assert.deepEqual(wrapper.specifiers, []);

      wrapper.phyloref.externalSpecifiers.push(specifier3);
      assert.deepEqual(wrapper.specifiers, [specifier3]);

      wrapper.phyloref.externalSpecifiers.push(specifier2);
      assert.deepEqual(wrapper.specifiers, [specifier3, specifier2]);

      wrapper.deleteSpecifier(specifier2);
      assert.deepEqual(wrapper.specifiers, [specifier3]);

      wrapper.phyloref.externalSpecifiers.push(specifier1);
      assert.deepEqual(wrapper.specifiers, [specifier3, specifier1]);

      wrapper.setSpecifierType(specifier1, 'Internal');
      assert.deepEqual(wrapper.specifiers, [specifier1, specifier3]);

      wrapper.phyloref.internalSpecifiers.push(specifier2);
      assert.deepEqual(wrapper.specifiers, [specifier1, specifier2, specifier3]);

      assert.equal(wrapper.getSpecifierType(specifier1), 'Internal');
      assert.equal(wrapper.getSpecifierType(specifier2), 'Internal');
      assert.equal(wrapper.getSpecifierType(specifier3), 'External');

      assert.equal(phyx.PhylorefWrapper.getSpecifierLabel(specifier1), 'Specimen MVZ:225749');
      assert.equal(phyx.PhylorefWrapper.getSpecifierLabel(specifier2), 'Specimen MVZ:191016');
      assert.equal(phyx.PhylorefWrapper.getSpecifierLabel(specifier3), 'Rana boylii');
    });

    it('should be able to determine expected node labels for a phylogeny', function () {
      const phyloref1 = new phyx.PhylorefWrapper({
        label: 'phyloref1',
        internalSpecifiers: [specifier1, specifier2],
        externalSpecifiers: [specifier3],
      });

      assert.deepEqual(
        phyloref1.getExpectedNodeLabels(phylogeny1),
        ['Test'],
      );
    });
  });

  describe('#statuses', function () {
    it('should be able to update statuses while tracking them', function () {
      const wrapper = new phyx.PhylorefWrapper({});

      // Initially, an empty phyloref should report a status of 'pso:draft'.
      assert.equal(wrapper.getCurrentStatus().statusCURIE, 'pso:draft');

      // Let's try updating a bunch of status.
      wrapper.setStatus('pso:final-draft');
      wrapper.setStatus('pso:under-review');
      wrapper.setStatus('pso:submitted');
      wrapper.setStatus('pso:published');
      wrapper.setStatus('pso:retracted-from-publication');
      assert.throws(
        function () { wrapper.setStatus('pso:retracted-from_publication'); },
        TypeError,
        'setStatus() called with invalid status CURIE \'pso:retracted-from_publication\'',
        'PhylorefWrapper throws TypeError on a mistyped status',
      );

      // And see if we get the statuses back in the correct order.
      const statusChanges = wrapper.getStatusChanges();
      assert.equal(statusChanges.length, 5);
      assert.equal(statusChanges[0].statusCURIE, 'pso:final-draft');
      assert.equal(statusChanges[1].statusCURIE, 'pso:under-review');
      assert.equal(statusChanges[2].statusCURIE, 'pso:submitted');
      assert.equal(statusChanges[3].statusCURIE, 'pso:published');
      assert.equal(statusChanges[4].statusCURIE, 'pso:retracted-from-publication');
    });
  });
});
