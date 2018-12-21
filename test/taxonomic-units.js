/*
 * Test taxonomic unit construction and matching.
 */

/* eslint-env mocha */

const chai = require('chai');
const phyx = require('../js/phyx');

// Use Chai's expect API.
const expect = chai.expect;

describe('TaxonomicUnitWrapper', function () {
  describe('#constructor', function () {
    it('should wrap a blank object with an undefined label', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({});
      expect(wrapper).to.be.instanceOf(phyx.TaxonomicUnitWrapper);
      expect(wrapper.label).to.be.undefined;
    });
  });
  describe('#label', function () {
    it('should return a wrapped scientific name', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Ornithorhynchus anatinus (Shaw, 1799)',
        }],
      });
      expect(wrapper.label).to.equal('Ornithorhynchus anatinus (Shaw, 1799)');
    });
    it('should return two wrapped scientific names separated by "or"', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Ornithorhynchus anatinus (Shaw, 1799)',
        }, {
          scientificName: 'Ornithorhynchus paradoxus Blumenbach, 1800',
        }],
      });
      expect(wrapper.label).to.equal('Ornithorhynchus anatinus (Shaw, 1799) or Ornithorhynchus paradoxus Blumenbach, 1800');
    });
    it('should return a wrapped specimen identifier preceded by "Specimen"', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        includesSpecimens: [{
          institutionCode: 'MVZ',
          catalogNumber: '225749',
        }],
      });
      expect(wrapper.label).to.equal('Specimen urn:catalog:MVZ::225749');
    });
    it('should return specimen identifiers and scientific names concatenated with "or"', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        scientificNames: [{
          scientificName: 'Rana luteiventris',
        }],
        includesSpecimens: [{
          institutionCode: 'MVZ',
          catalogNumber: '225749',
        }],
      });
      expect(wrapper.label).to.equal('Specimen urn:catalog:MVZ::225749 or Rana luteiventris');
    });
    it('should return a wrapped external reference by surrounding it with "<>"', function () {
      const wrapper = new phyx.TaxonomicUnitWrapper({
        externalReferences: [
          'http://arctos.database.museum/guid/MVZ:Herp:225749',
        ],
      });
      expect(wrapper.label).to.equal('<http://arctos.database.museum/guid/MVZ:Herp:225749>');
    });
    it('should return a concatenated label for a taxonomic unit', function () {
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
      expect(wrapper.label)
        .to.equal('Specimen urn:catalog:MVZ::225749 or <http://arctos.database.museum/guid/MVZ:Herp:225749> or Rana luteiventris');
    });
  });
  describe('#getTaxonomicUnitsFromNodeLabel', function () {
    it('should return empty lists when inputs are empty or undefined', function () {
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel()).to.be.empty;
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(undefined)).to.be.empty;
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(null)).to.be.empty;
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('')).to.be.empty;
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('    ')).to.be.empty;
    });
    it('when given a scientific name: should return a list of a single TU wrapping a scientific name', function () {
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('Rana luteiventris MVZ225749'))
        .to.be.deep.equal([{
          scientificNames: [{
            scientificName: 'Rana luteiventris MVZ225749',
            genus: 'Rana',
            specificEpithet: 'luteiventris',
            binomialName: 'Rana luteiventris',
          }],
        }]);
    });
    it('when given a scientific name separated with underscores: should return a list of a single TU wrapping the scientific name', function () {
      expect(phyx.TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel('Rana_luteiventris_MVZ_225749'))
        .to.be.deep.equal([{
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

// To test matching, let's set up some taxonomic units.
// Note that:
//  tunit1 and tunit2 should match by scientific name.
//  tunit2 and tunit3 should match by specimen identifier.
//  tunit3 and tunit4 should match by external references.
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
    it('should be able to match taxonomic units by binomial name', function () {
      expect(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchByExternalReferences()).to.be.false;
      expect(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchBySpecimenIdentifier()).to.be.false;
      expect(new phyx.TaxonomicUnitMatcher(tunit1, tunit2).matchByBinomialName()).to.be.true;
    });
  });
  describe('#matchByExternalReferences', function () {
    it('should match by external references', function () {
      expect(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchByExternalReferences()).to.be.true;
      expect(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchBySpecimenIdentifier()).to.be.false;
      expect(new phyx.TaxonomicUnitMatcher(tunit3, tunit4).matchByBinomialName()).to.be.false;
    });
  });
  describe('#matchBySpecimenIdentifier', function () {
    it('should match by specimen identifiers', function () {
      expect(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchByExternalReferences()).to.be.false;
      expect(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchBySpecimenIdentifier()).to.be.true;
      expect(new phyx.TaxonomicUnitMatcher(tunit2, tunit3).matchByBinomialName()).to.be.false;
    });
  });
  describe('#matched and #matchReason', function () {
    let matcher = new phyx.TaxonomicUnitMatcher(tunit1, tunit2);
    expect(matcher.matched).to.be.true;
    expect(matcher.matchReason).to.include('share the same binomial name');

    matcher = new phyx.TaxonomicUnitMatcher(tunit3, tunit4);
    expect(matcher.matched).to.be.true;
    expect(matcher.matchReason).to.include('External reference');

    matcher = new phyx.TaxonomicUnitMatcher(tunit2, tunit3);
    expect(matcher.matched).to.be.true;
    expect(matcher.matchReason).to.include('Specimen identifier');
  });
});
