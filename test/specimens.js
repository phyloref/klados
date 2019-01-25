/*
 * Test specimen processing.
 */

const chai = require('chai');
const phyx = require('../js/phyx');

const expect = chai.expect;

/*
 * Test whether SpecimenWrapper can parse specimen identifiers from simple specimen
 * identifiers, from institutionCode:catalogNumber format, and from Darwin Core triples.
 * However, URNs and HTTP URLs should not be accidentally parsed as Darwin Core triples.
 */

describe('SpecimenWrapper', function () {
  describe('#constructor', function () {
    it('should be able to wrap an empty specimen', function () {
      const wrapped = new phyx.SpecimenWrapper({});

      expect(wrapped).to.be.an.instanceOf(phyx.SpecimenWrapper);
      expect(wrapped.occurrenceID).to.equal('urn:catalog:::');
    });
    it('should be able to extract an occurenceID and catalogNumber from simple specimen IDs', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'Wall 2527, Fiji (uc)',
      });
      expect(wrapper.occurrenceID).to.equal('Wall 2527, Fiji (uc)');
      expect(wrapper.catalogNumber).to.equal('Wall 2527, Fiji (uc)');
    });
    it('should extract institutionCode and catalogNumber from a institutionCode:catalogNumber combination', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'FMNH:PR 2081',
      });
      expect(wrapper.occurrenceID).to.equal('FMNH:PR 2081');
      expect(wrapper.institutionCode).to.equal('FMNH');
      expect(wrapper.catalogNumber).to.equal('PR 2081');
    });
    it('should extract occurenceID, institutionCode and catalogNumber from Darwin Core triples', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'FMNH:PR:2081',
      });
      expect(wrapper.occurrenceID).to.equal('FMNH:PR:2081');
      expect(wrapper.institutionCode).to.equal('FMNH');
      expect(wrapper.collectionCode).to.equal('PR');
      expect(wrapper.catalogNumber).to.equal('2081');
    });
    it('should be able to extract the same occurrenceID from different representations', function () {
      expect(new phyx.SpecimenWrapper({ occurrenceID: 'urn:catalog:::MVZ225749' }).occurrenceID)
        .to.equal('urn:catalog:::MVZ225749');
      expect(new phyx.SpecimenWrapper({ catalogNumber: 'MVZ225749' }).occurrenceID)
        .to.equal('urn:catalog:::MVZ225749');
    });
    it('should not attempt to split a URN into occurenceID, institutionCode and catalogNumber', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'urn:lsid:biocol.org:col:34777',
      });
      expect(wrapper.occurrenceID).to.equal('urn:lsid:biocol.org:col:34777');
      expect(wrapper.institutionCode).to.be.undefined;
      expect(wrapper.collectionCode).to.be.undefined;
      expect(wrapper.catalogNumber).to.be.undefined;
    });
    it('should not attempt to split a URL into occurenceID, institutionCode and catalogNumber', function () {
      const wrapper = new phyx.SpecimenWrapper({
        occurrenceID: 'http://arctos.database.museum/guid/MVZ:Herp:148929?seid=886464',
      });
      expect(wrapper.occurrenceID).to.equal('http://arctos.database.museum/guid/MVZ:Herp:148929?seid=886464');
      expect(wrapper.institutionCode).to.be.undefined;
      expect(wrapper.collectionCode).to.be.undefined;
      expect(wrapper.catalogNumber).to.be.undefined;
    });
  });
});
