/*
 * Test specimen processing.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;

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
    it('should be able to split occurrenceID in different ways', function () {
      const specimen1 = { occurrenceID: 'MVZ225749' };
      const specimen2 = { catalogNumber: 'MVZ225749' };
      const specimen3 = { occurrenceID: 'urn:catalog:::MVZ225749' };

      const wrapper1 = new phyx.SpecimenWrapper(specimen1);
      const wrapper2 = new phyx.SpecimenWrapper(specimen2);
      const wrapper3 = new phyx.SpecimenWrapper(specimen3);

      assert.equal(wrapper1.catalogNumber, 'MVZ225749');
      assert.equal(wrapper2.catalogNumber, 'MVZ225749');
      assert.equal(wrapper3.catalogNumber, 'MVZ225749');
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
