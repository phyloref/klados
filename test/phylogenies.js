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
          expect(errors).to.have.length(1);
          expect(errors[0].title).to.equal('No phylogeny entered');
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
          expect(errors).to.have.lengthOf(2);

          // Should include an error about the unbalanced parentheses.
          expect(errors[0].title).to.equal('Unbalanced parentheses in Newick string');
          expect(errors[0].message).to.equal(entry.expected);

          // Should include an error passed on from the Newick parser.
          expect(errors[1].title).to.equal('Error parsing phylogeny');
          expect(errors[1].message).to.include('An error occured while parsing this phylogeny:');
        });
      });
    });

    describe('when given an incomplete Newick string', function () {
      const incompleteNewickStrings = [
        '(;)',
        '))(A, (B, ',
      ];

      it('should report an error parsing the phylogeny', function () {
        incompleteNewickStrings.forEach((newick) => {
          const errors = phyx.PhylogenyWrapper.getErrorsInNewickString(newick);

          expect(errors).to.have.lengthOf(1);
          expect(errors[0].title).to.equal('Error parsing phylogeny');
          expect(errors[0].message).to.include('An error occured while parsing this phylogeny:');
        });
      });
    });
  });

  describe('#getNodeLabels', function () {
    describe('given a valid phylogeny', function () {
      const tests = [
        {
          newick: '(A, (B, (C, D))E, F, (G, (H, I, J)K, L)M, N)O',
          nodeLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
          internalNodeLabels: ['E', 'K', 'M', 'O'],
          terminalNodeLabels: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'L', 'N'],
        },
      ];

      tests.forEach((test) => {
        const wrapper = new phyx.PhylogenyWrapper({ newick: test.newick });

        it('should return a list of all node labels in this phylogeny', function () {
          expect(wrapper.getNodeLabels().sort())
            .to.have.members(test.nodeLabels.sort());
        });

        it('should return a list of all internal labels in this phylogeny', function () {
          expect(wrapper.getNodeLabels('internal').sort())
            .to.have.members(test.internalNodeLabels.sort());
        });

        it('should return a list of all terminal labels in this phylogeny', function () {
          expect(wrapper.getNodeLabels('terminal').sort())
            .to.have.members(test.terminalNodeLabels.sort());
        });
      });
    });
  });

  describe('given a particular phylogeny with additional node properties', function () {
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

    describe('#getNodeLabels', function () {
      it('should return the list of node labels', function () {
        expect(wrapper.getNodeLabels().sort())
          .to.have.members([
            'MVZ191016',
            'MVZ225749',
            'Rana boylii',
            'root',
          ]);
      });
    });

    describe('#getTaxonomicUnitsForNodeLabel', function () {
      it('should return the list of expected taxonomic units for each node', function () {
        expect(wrapper.getTaxonomicUnitsForNodeLabel('MVZ191016')).to.deep.equal([{
          scientificNames: [{ scientificName: 'Rana luteiventris' }],
          includesSpecimens: [{ occurrenceID: 'MVZ:191016' }],
        }]);

        expect(wrapper.getTaxonomicUnitsForNodeLabel('MVZ225749')).to.deep.equal([{
          scientificNames: [{ scientificName: 'Rana luteiventris' }],
          includesSpecimens: [{ occurrenceID: 'MVZ:225749' }],
        }]);

        expect(wrapper.getTaxonomicUnitsForNodeLabel('Rana boylii')).to.deep.equal([{
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
      it('should match nodes to specifiers and return the matched node labels', function () {
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

        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier1))
          .to.have.members(['MVZ225749']);

        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier2))
          .to.have.members(['MVZ191016']);

        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier3))
          .to.have.members([]);
      });
    });
  });
});
