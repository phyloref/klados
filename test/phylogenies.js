/*
 * Test phylogenies.
 */

/* eslint-env mocha */

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

global.d3.layout = {};
require('../lib/phylotree.js/phylotree.js');

const chai = require('chai');
const phyx = require('../js/phyx');

const { assert } = chai;

describe('PhylogenyWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      assert.isOk(new phyx.PhylogenyWrapper({}));
    });

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
});
