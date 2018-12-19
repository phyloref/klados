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

// Testing methods.
const assert = chai.assert;
const expect = chai.expect;

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
  describe('given an empty phyloreference', function () {
    const wrapper = new phyx.PhylorefWrapper({});

    describe('#constructor', function () {
      it('should return a PhylorefWrapper', function () {
        expect(wrapper).to.be.an.instanceOf(phyx.PhylorefWrapper);
      });
    });

    describe('#label', function () {
      it('should return undefined', function () {
        expect(wrapper.label).to.be.undefined;
      });

      it('should be settable by assigning to .label', function () {
        wrapper.label = 'phyloref1';
        expect(wrapper.label).equals('phyloref1');
      });
    });

    describe('#specifiers', function () {
      it('should initially return an empty list', function () {
        expect(wrapper.specifiers).to.be.empty;
      });

      describe('when a new external specifier is added using .externalSpecifiers', function () {
        it('should return a list with the new specifier', function () {
          wrapper.phyloref.externalSpecifiers.push(specifier3);
          expect(wrapper.specifiers).to.deep.equal([specifier3]);
        });
      });

      describe('when a new external specifier is added using .externalSpecifiers', function () {
        it('should return a list with the new specifier', function () {
          wrapper.phyloref.externalSpecifiers.push(specifier2);
          expect(wrapper.specifiers).to.deep.equal([specifier3, specifier2]);
        });
      });

      describe('when a specifier is deleted using .deleteSpecifier', function () {
        it('should return the updated list', function () {
          wrapper.deleteSpecifier(specifier2);
          expect(wrapper.specifiers).to.deep.equal([specifier3]);
        });
      });

      describe('when a specifier is added using .externalSpecifiers', function () {
        it('should return the updated list', function () {
          wrapper.phyloref.externalSpecifiers.push(specifier1);
          expect(wrapper.specifiers).to.deep.equal([specifier3, specifier1]);
        });
      });

      describe('when a specifier is changed to an internal specifier using .setSpecifierType', function () {
        it('should remain in the list of specifiers', function () {
          wrapper.setSpecifierType(specifier1, 'Internal');
          expect(wrapper.specifiers).to.deep.equal([specifier1, specifier3]);
        });
      });

      describe('when a specifier is added using .internalSpecifiers', function () {
        it('should be included in the list of all specifiers', function () {
          wrapper.phyloref.internalSpecifiers.push(specifier2);
          expect(wrapper.specifiers).to.deep.equal([specifier1, specifier2, specifier3]);
        });
      });
    });

    describe('#getSpecifierType', function () {
      it('should return the correct specifier type for each specifier', function () {
        expect(wrapper.getSpecifierType(specifier1)).to.equal('Internal');
        expect(wrapper.getSpecifierType(specifier2)).to.equal('Internal');
        expect(wrapper.getSpecifierType(specifier3)).to.equal('External');
      });
    });

    describe('#getSpecifierLabel', function () {
      it('should return the correct label for each specifier', function () {
        expect(phyx.PhylorefWrapper.getSpecifierLabel(specifier1)).to.equal('Specimen MVZ:225749');
        expect(phyx.PhylorefWrapper.getSpecifierLabel(specifier2)).to.equal('Specimen MVZ:191016');
        expect(phyx.PhylorefWrapper.getSpecifierLabel(specifier3)).to.equal('Rana boylii');
      });
    });
  });

  describe('given a particular phylogeny', function () {
    describe('#getExpectedNodeLabels', function () {
      it('should be able to determine expected node labels for a phylogeny', function () {
        const phyloref1 = new phyx.PhylorefWrapper({
          label: 'phyloref1',
          internalSpecifiers: [specifier1, specifier2],
          externalSpecifiers: [specifier3],
        });

        expect(phyloref1.getExpectedNodeLabels(phylogeny1))
          .to.deep.equal(['Test']);
      });
    });
  });

  describe('given an empty phyloreference', function () {
    const wrapper = new phyx.PhylorefWrapper({});

    describe('#getCurrentStatus', function () {
      it('should return "pso:draft" as the default initial status', function () {
        // Initially, an empty phyloref should report a status of 'pso:draft'.
        expect(wrapper.getCurrentStatus().statusCURIE).to.equal('pso:draft');
      });
    });

    describe('#setStatus', function () {
      it('should throw an error if given a mistyped status', function () {
        expect(function () { wrapper.setStatus('pso:retracted-from_publication'); })
          .to.throw(
            TypeError,
            'setStatus() called with invalid status CURIE \'pso:retracted-from_publication\'',
            'PhylorefWrapper throws TypeError on a mistyped status',
          );
      });
    });

    describe('#getStatusChanges', function () {
      it('should return the empty list', function () {
        expect(wrapper.getStatusChanges()).to.be.empty;
      });

      describe('when modified by using .setStatus', function () {
        it('should return the updated list', function () {
          wrapper.setStatus('pso:final-draft');
          wrapper.setStatus('pso:under-review');
          wrapper.setStatus('pso:submitted');
          wrapper.setStatus('pso:published');
          wrapper.setStatus('pso:retracted-from-publication');

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
  });
});
