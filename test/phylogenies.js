/*
 * Test phylogenies.
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

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;
const expect = chai.expect;

describe('PhylogenyWrapper', function () {
  describe('#constructor', function () {
    describe('when used to wrap a blank object', function () {
      it('should return a PhylogenyWrapper object', function () {
        expect(new phyx.PhylogenyWrapper({}))
          .to.be.an.instanceOf(phyx.PhylogenyWrapper);
      });
    });
  });

  describe('#getErrorsInNewickString', function () {
    describe('when given a correct Newick string', function () {
      const correctNewickStrings = [
        '(A:3, B:5, (C:6, N:7));',
      ];

      it('should return an empty list of errors', function () {
        correctNewickStrings.forEach((str) => {
          expect(phyx.PhylogenyWrapper.getErrorsInNewickString(str))
            .to.be.empty
        });
      });
    });

    describe('when given an empty Newick string', function () {
      const emptyNewickStrings = [
        '()',
        '();  ',
      ];

      it('should return a single "No phylogeny entered" error', function () {
        emptyNewickStrings.forEach((newick) => {
          const errors = phyx.PhylogenyWrapper.getErrorsInNewickString(newick);
          assert.equal(errors.length, 1);
          assert.equal(errors[0].title, 'No phylogeny entered');
        });
      });
    });

    describe('when given an unbalanced Newick string', function () {
      const unbalancedNewickString = [
        {
          newick: '(A, B))',
          expected: 'You have 1 too few open parentheses',
        },
        {
          newick: '(A, (B, (C, D))',
          expected: 'You have 1 too many open parentheses',
        },
        {
          newick: '(A, (B, (C, (((D))',
          expected: 'You have 4 too many open parentheses',
        },
      ];

      it('should report how many parantheses are missing', function () {
        unbalancedNewickString.forEach((entry) => {
          const errors = phyx.PhylogenyWrapper.getErrorsInNewickString(entry.newick);

          // We should get two errors.
          assert.equal(errors.length, 2);

          // Should include an error about the unbalanced parentheses.
          assert.equal(errors[0].title, 'Unbalanced parentheses in Newick string');
          assert.equal(errors[0].message, entry.expected);

          // Should include an error passed on from the Newick parser.
          assert.equal(errors[1].title, 'Error parsing phylogeny');
          assert(errors[1].message.startsWith('An error occured while parsing this phylogeny:'));
        });
      });
    });

    it('should be able to identify an incomplete Newick string', function () {
      let errors = phyx.PhylogenyWrapper.getErrorsInNewickString('(;)');
      assert.equal(errors.length, 1);
      assert.equal(errors[0].title, 'Error parsing phylogeny');

      errors = phyx.PhylogenyWrapper.getErrorsInNewickString('))(A, (B, ');
      assert.equal(errors.length, 1);
      assert.equal(errors[0].title, 'Error parsing phylogeny');
    });
  });
  describe('#getNodeLabels', function () {
    it('should be able extract all node labels in a phylogeny', function () {
      const wrapper = new phyx.PhylogenyWrapper({
        newick: '(A, (B, (C, D))E, F, (G, (H, I, J)K, L)M, N)O',
      });
      assert.deepEqual(wrapper.getNodeLabels().sort(), [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
      ]);
      assert.deepEqual(wrapper.getNodeLabels('internal').sort(), [
        'E', 'K', 'M', 'O',
      ]);
      assert.deepEqual(wrapper.getNodeLabels('terminal').sort(), [
        'A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'L', 'N',
      ]);
    });
  });
  describe('#getTaxonomicUnitsForNodeLabel', function () {
    it('should be able to combine additional node properties with node labels', function () {
      const wrapper = new phyx.PhylogenyWrapper({
        newick: '((MVZ225749, MVZ191016), "Rana boylii")',
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
        },
      });

      assert.deepEqual(wrapper.getNodeLabels().sort(), [
        'MVZ191016',
        'MVZ225749',
        'Rana boylii',
        'root',
      ]);

      assert.deepEqual(wrapper.getTaxonomicUnitsForNodeLabel('MVZ191016'), [{
        scientificNames: [{ scientificName: 'Rana luteiventris' }],
        includesSpecimens: [{ occurrenceID: 'MVZ:191016' }],
      }]);
      assert.deepEqual(wrapper.getTaxonomicUnitsForNodeLabel('MVZ225749'), [{
        scientificNames: [{ scientificName: 'Rana luteiventris' }],
        includesSpecimens: [{ occurrenceID: 'MVZ:225749' }],
      }]);
      assert.deepEqual(wrapper.getTaxonomicUnitsForNodeLabel('Rana boylii'), [{
        scientificNames: [{
          scientificName: 'Rana boylii',
          binomialName: 'Rana boylii',
          genus: 'Rana',
          specificEpithet: 'boylii',
        }],
      }]);
    });
  });
  describe('#getNodeLabelsMatchedBySpecifier', function () {
    it('should match specifiers by specimen identifier', function () {
      const wrapper = new phyx.PhylogenyWrapper({
        newick: '((MVZ225749, MVZ191016), "Rana boylii")',
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
        },
      });

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
            scientificName: 'Rana boyli',
          }],
        }],
      };

      assert.deepEqual(
        wrapper.getNodeLabelsMatchedBySpecifier(specifier1),
        ['MVZ225749'],
      );
      assert.deepEqual(
        wrapper.getNodeLabelsMatchedBySpecifier(specifier2),
        ['MVZ191016'],
      );
      assert.deepEqual(
        wrapper.getNodeLabelsMatchedBySpecifier(specifier3),
        [],
      );
    });
  });
});
