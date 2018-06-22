/*
 * Test taxonomic unit construction and matching.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

const { assert } = chai;

describe('TaxonomicUnitWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({});
      assert.exists(wrapper);
      assert.isUndefined(wrapper.label);
    });
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
  });
});
