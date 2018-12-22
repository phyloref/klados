/*
 * Test scientific name processing.
 */

const chai = require('chai');
const phyx = require('../js/phyx');

const expect = chai.expect;

/*
 * Test whether ScientificNameWrapper parses scientific names correctly.
 */

describe('ScientificNameWrapper', function () {
  describe('#constructor', function () {
    it('should accept empty scientific names without errors', function () {
      const wrapper = new phyx.ScientificNameWrapper({});

      expect(wrapper).to.be.an.instanceOf(phyx.ScientificNameWrapper);
      expect(wrapper.scientificName).to.be.undefined;
    });
    it('should be able to parse uninomial names as genus names without a specific epithet', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus',
      });

      expect(wrapper.genus).to.equal('Mus');
      expect(wrapper.specificEpithet).to.be.undefined;
    });
    it('should be able to parse binomial names into genus and specific epithet', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus musculus',
      });

      expect(wrapper.genus).to.equal('Mus');
      expect(wrapper.specificEpithet).to.equal('musculus');
    });
    it('should ignore authority after a binomial name', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus musculus Linnaeus, 1758',
      });

      expect(wrapper.genus).to.equal('Mus');
      expect(wrapper.specificEpithet).to.equal('musculus');
    });
  });
});
