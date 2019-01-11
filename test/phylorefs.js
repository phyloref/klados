/*
 * Test phyloreferences.
 */

// These tests need to parse Newick strings, which requires phylotree.js which itself
// requires d3. These are set up here.

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

// These tests invoke code that uses Vue to set variables. We therefore need to
// set it up here.
global.Vue = require('vue');

// These tests invoke momentjs to parse dates. We therefore need to set it up here.
global.moment = require('moment');

// Require phyx.js, our PHYX library, and Chai for testing.
const phyx = require('../js/phyx');
const chai = require('chai');

// We use Chai's Expect API.
const expect = chai.expect;

/*
 * Phyloref tests cover three aspects of phyloreferences:
 *  - Whether we can create a phyloref with a particular set of specifiers,
 *    and whether we can correctly change the type of a specifer (from 'External'
 *    to 'Internal'), delete specifiers, and retrieve specifier labels.
 *  - Whether we can determine to which node a phyloref is expected to resolve to
 *    by using additionalNodeProperties.
 *  - Whether we can update the phyloref's status several times and retrieve the
 *    full history of its status changes.
 */

describe('PhylorefWrapper', function () {
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
    // Some phylogenies to use in testing.
    const phylogeny1 = {
      newick: '((MVZ225749, MVZ191016)Test, "Rana boylii")',
      additionalNodeProperties: {
        Test: {
          expectedPhyloreferenceNamed: 'phyloref1',
        },
      },
    };

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
          expect(statusChanges.length, 'number of status changes should be 5').to.equal(5);
          expect(statusChanges[0].statusCURIE, 'first status change should be "pso:final-draft"').to.equal('pso:final-draft');
          expect(statusChanges[1].statusCURIE, 'second status change should be "pso:under-review"').to.equal('pso:under-review');
          expect(statusChanges[2].statusCURIE, 'third status change should be a "pso:submitted"').to.equal('pso:submitted');
          expect(statusChanges[3].statusCURIE, 'fourth status change should be a "pso:published"').to.equal('pso:published');
          expect(statusChanges[4].statusCURIE, 'fifth status change should be a "pso:retracted-from-publication"').to.equal('pso:retracted-from-publication');
        });
      });
    });
  });
});
