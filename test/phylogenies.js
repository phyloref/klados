/*
 * Test phylogenies.
 */

// The phylogeny processing needs phylotree.js to parse the Newick string.
// We therefore have to include it here.

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

// Load phyx.js, our PHYX library, and chai for testing.
const phyx = require('../js/phyx');
const chai = require('chai');

// Use Chai's expect API for testing.
const expect = chai.expect;

/*
 * These tests focus on three aspects of PhylogenyWrapper:
 *  - Whether it can detect errors in an input Newick string.
 *  - Retrieve taxonomic units from the phylogeny based on either their node label
 *    or on the additional properties associated with the phylogeny.
 *  - Whether we can match specifiers with nodes on the phylogeny if they share
 *    taxonomic units that match.
 */

describe('PhylogenyWrapper', function () {
  describe('#constructor', function () {
    describe('when used to wrap an empty object', function () {
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
          expect(phyx.PhylogenyWrapper.getErrorsInNewickString(str)).to.be.empty;
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

      it('should report how many parentheses are missing', function () {
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
    const tests = [
      {
        // Note that 'newick' is the input for this test.
        newick: '(A, (B, (C, D))E, F, (G, (H, I, J)K, L)M, N)O',
        // The following keys indicate the expected all/internal/terminal node labels
        // for the given Newick string.
        nodeLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
        internalNodeLabels: ['E', 'K', 'M', 'O'],
        terminalNodeLabels: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J', 'L', 'N'],
      },
    ];

    tests.forEach((test) => {
      const wrapper = new phyx.PhylogenyWrapper({ newick: test.newick });

      describe('For a particular Newick phylogeny', function () {
        it('should return a list of all node labels by default', function () {
          expect(wrapper.getNodeLabels().sort())
            .to.have.members(test.nodeLabels.sort());
        });

        it('should return a list of internal labels when asked for internal labels', function () {
          expect(wrapper.getNodeLabels('internal').sort())
            .to.have.members(test.internalNodeLabels.sort());
        });

        it('should return a list of terminal labels when asked for terminal labels', function () {
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
      it('should return the list of node labels from the Newick string', function () {
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
      it('should return the list of taxonomic units using information from additional node properties', function () {
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
      it('should match a specifier to MVZ225749 based on occurrence ID', function () {
        const specifier1 = {
          referencesTaxonomicUnits: [{
            includesSpecimens: [{
              occurrenceID: 'MVZ:225749',
            }],
          }],
        };
        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier1))
          .to.have.members(['MVZ225749']);
      });

      it('should match a specifier to MVZ191016 based on occurrence ID', function () {
        const specifier2 = {
          referencesTaxonomicUnits: [{
            includesSpecimens: [{
              occurrenceID: 'MVZ:191016',
            }],
          }],
        };

        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier2))
          .to.have.members(['MVZ191016']);
      });

      it('should match a specifier to node "Rana boylii" based on the parsed scientific name', function () {
        const specifier3 = {
          referencesTaxonomicUnits: [{
            scientificNames: [{
              scientificName: 'Rana boyli',
            }],
          }],
        };

        expect(wrapper.getNodeLabelsMatchedBySpecifier(specifier3))
          .to.have.members([]);
      });
    });
  });
});
