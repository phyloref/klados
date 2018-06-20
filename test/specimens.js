/*
 * Test specimen processing.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

const { assert } = chai;

describe('SpecimenWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      const wrapper = new phyx.SpecimenWrapper({});
      assert.exists(wrapper);
      assert.equal(wrapper.occurrenceID, 'urn:catalog:::');
    });
    it('should handle simple specimen IDs', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'Wall 2527, Fiji (uc)',
      });
      assert.equal(wrapper.occurrenceID, 'Wall 2527, Fiji (uc)');
      assert.equal(wrapper.catalogNumber, 'Wall 2527, Fiji (uc)');
    });
    it('should handle Darwin Core doubles', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'FMNH:PR 2081',
      });
      assert.equal(wrapper.occurrenceID, 'FMNH:PR 2081');
      assert.equal(wrapper.institutionCode, 'FMNH');
      assert.equal(wrapper.catalogNumber, 'PR 2081');
    });
    it('should handle Darwin Core triples', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'FMNH:PR:2081',
      });
      assert.equal(wrapper.occurrenceID, 'FMNH:PR:2081');
      assert.equal(wrapper.institutionCode, 'FMNH');
      assert.equal(wrapper.collectionCode, 'PR');
      assert.equal(wrapper.catalogNumber, '2081');
    });
    it("shouldn't get confused by URNs", function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'urn:lsid:biocol.org:col:34777',
      });
      assert.equal(wrapper.occurrenceID, 'urn:lsid:biocol.org:col:34777');
      assert.isUndefined(wrapper.institutionCode);
      assert.isUndefined(wrapper.collectionCode);
      assert.isUndefined(wrapper.catalogNumber);
    });
    it("shouldn't get confused by URLs", function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'http://arctos.database.museum/guid/MVZ:Herp:148929?seid=886464',
      });
      assert.equal(wrapper.occurrenceID, 'http://arctos.database.museum/guid/MVZ:Herp:148929?seid=886464');
      assert.isUndefined(wrapper.institutionCode);
      assert.isUndefined(wrapper.collectionCode);
      assert.isUndefined(wrapper.catalogNumber);
    });
  });
});
