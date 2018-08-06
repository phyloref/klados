/*
 * Test scientific name processing.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;

describe('ScientificNameWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      const wrapper = new phyx.ScientificNameWrapper({});
      assert.exists(wrapper);
      assert.isUndefined(wrapper.scientificName);
    });
    it('should handle uninomial names', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus',
      });
      assert.equal(wrapper.genus, 'Mus');
      assert.isUndefined(wrapper.specificEpithet);
    });
    it('should handle binomial names', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus musculus',
      });
      assert.equal(wrapper.genus, 'Mus');
      assert.equal(wrapper.specificEpithet, 'musculus');
    });
    it('should handle scientific names with authority', function () {
      const wrapper = new phyx.ScientificNameWrapper({
        scientificName: 'Mus musculus Linnaeus, 1758',
      });
      assert.equal(wrapper.genus, 'Mus');
      assert.equal(wrapper.specificEpithet, 'musculus');
    });
  });
});
