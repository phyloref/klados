/*
 * Test taxonomic unit construction and matching.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

const assert = chai.assert;

describe('TaxonomicUnitWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({});
      assert.exists(wrapper);
      assert.isUndefined(wrapper.label);
    });
  });
  describe('#label', function () {
    it('should wrap a taxonomic unit with a scientific name', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Ornithorhynchus anatinus (Shaw, 1799)',
        }],
      });
      assert.equal(wrapper.label, 'Ornithorhynchus anatinus (Shaw, 1799)');

      const scname0 = new phyx.ScientificNameWrapper(wrapper.scientificNames[0]);
      assert.equal(scname0.genus, 'Ornithorhynchus');
      assert.equal(scname0.specificEpithet, 'anatinus');
    });
    it('should wrap a taxonomic unit with two scientific names', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Ornithorhynchus anatinus (Shaw, 1799)',
        }, {
          scientificName: 'Ornithorhynchus paradoxus Blumenbach, 1800',
        }],
      });
      assert.equal(wrapper.label, 'Ornithorhynchus anatinus (Shaw, 1799) or Ornithorhynchus paradoxus Blumenbach, 1800');

      const scname0 = new phyx.ScientificNameWrapper(wrapper.scientificNames[0]);
      const scname1 = new phyx.ScientificNameWrapper(wrapper.scientificNames[1]);

      assert.equal(scname0.scientificName, 'Ornithorhynchus anatinus (Shaw, 1799)');
      assert.equal(scname1.scientificName, 'Ornithorhynchus paradoxus Blumenbach, 1800');

      assert.equal(scname0.genus, 'Ornithorhynchus');
      assert.equal(scname1.genus, 'Ornithorhynchus');
      assert.equal(scname0.specificEpithet, 'anatinus');
      assert.equal(scname1.specificEpithet, 'paradoxus');
    });
    it('should wrap a taxonomic unit with a species name and a specimen identifier', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Rana luteiventris',
        }],
        includesSpecimens: [{
          institutionCode: 'MVZ',
          catalogNumber: '225749',
        }],
      });
      assert.equal(wrapper.label, 'Specimen urn:catalog:MVZ::225749 or Rana luteiventris');
    });
    it('should wrap a taxonomic unit with an external reference', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        externalReferences: [
          'http://arctos.database.museum/guid/MVZ:Herp:225749',
        ],
      });
      assert.equal(wrapper.label, '<http://arctos.database.museum/guid/MVZ:Herp:225749>');
    });
    it('should wrap a taxonomic unit with a specimen identifier, external reference and a scientific name', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        externalReferences: [
          'http://arctos.database.museum/guid/MVZ:Herp:225749',
        ],
        scientificNames: [{
          scientificName: 'Rana luteiventris',
        }],
        includesSpecimens: [{
          institutionCode: 'MVZ',
          catalogNumber: '225749',
        }],
      });
      assert.equal(wrapper.label, 'Specimen urn:catalog:MVZ::225749 or <http://arctos.database.museum/guid/MVZ:Herp:225749> or Rana luteiventris');
    });
  });
  describe('#getTaxonomicUnitsFromNodeLabel', function () {
    it('should catch invalid inputs', function () {
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(), []);
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(undefined), []);
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(null), []);
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(''), []);
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('    '), []);
    });
    it('should work for a scientific name with specimen label', function () {
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('Rana luteiventris MVZ225749'), [{
        scientificNames: [{
          scientificName: 'Rana luteiventris MVZ225749',
          genus: 'Rana',
          specificEpithet: 'luteiventris',
          binomialName: 'Rana luteiventris',
        }],
      }]);
    });
    it('should work for a scientific name separated with underscores', function () {
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('Rana_luteiventris_MVZ_225749'), [{
        scientificNames: [{
          scientificName: 'Rana luteiventris MVZ_225749',
          genus: 'Rana',
          specificEpithet: 'luteiventris',
          binomialName: 'Rana luteiventris',
        }],
      }]);
    });
    it('should update the cache manager as it works', function () {
      assert.deepEqual(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('Rana_luteiventris_MVZ_225749'), [{
        scientificNames: [{
          scientificName: 'Rana luteiventris MVZ_225749',
          genus: 'Rana',
          specificEpithet: 'luteiventris',
          binomialName: 'Rana luteiventris',
        }],
      }]);
      assert.isNotEmpty(phyx.phyxCacheManager.caches);
      assert.isNotEmpty(phyx.phyxCacheManager.caches['TaxonomicUnitWrapper.taxonomicUnitsFromNodeLabelCache']);
    });
  });
});

// To test matching, let's set up some taxonomic units.
const tunit1 = { scientificNames: [{ scientificName: 'Rana luteiventris' }] };
const tunit2 = {
  scientificNames: [{ scientificName: 'Rana luteiventris MVZ225749' }],
  includesSpecimens: [{ occurrenceID: 'urn:catalog:::MVZ225749' }],
};
const tunit3 = {
  includesSpecimens: [{ catalogNumber: 'MVZ225749' }],
  externalReferences: ['http://arctos.database.museum/guid/MVZ:Herp:225749'],
};
const tunit4 = {
  externalReferences: ['http://arctos.database.museum/guid/MVZ:Herp:225749'],
};

describe('TaxonomicUnitMarcher', function () {
  describe('#matchByBinomialName', function () {
    it('should match by binomial name', function () {
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchByExternalReferences());
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchBySpecimenIdentifier());
      assert.isOk(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchByBinomialName());

      const matcher = new phyx.TaxonomicUnitMatcher(tunit1, tunit2);
      assert.isOk(matcher.matched);
      assert.isDefined(matcher.matchReason);
      assert.include(matcher.matchReason, 'share the same binomial name');
    });
  });
  describe('#matchByExternalReferences', function () {
    it('should match by external references', function () {
      assert.isOk(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchByExternalReferences());
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchBySpecimenIdentifier());
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchByBinomialName());

      const matcher = new phyx.TaxonomicUnitMatcher(tunit3, tunit4);
      assert.isOk(matcher.matched);
      assert.isDefined(matcher.matchReason);
      assert.include(matcher.matchReason, 'External reference');
    });
  });
  describe('#matchBySpecimenIdentifier', function () {
    it('should match by specimen identifiers', function () {
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchByExternalReferences());
      assert.isOk(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchBySpecimenIdentifier());
      assert.isNotOk(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchByBinomialName());

      const matcher = new phyx.TaxonomicUnitMatcher(tunit2, tunit3);
      assert.isOk(matcher.matched);
      assert.isDefined(matcher.matchReason);
      assert.include(matcher.matchReason, 'Specimen identifier');
    });
  });
});
