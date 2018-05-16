/*
 * PHYX Library
 * Copyright (c) The Phyloreferencing Project, 2018
 *
 * PHYloreference eXchange (PHYX) files store phyloreferences along with
 * annotated phylogenies that allow their expected resolution to be curated
 * and tested. This library provides classes and methods that help read and
 * manipulate components of PHYX files.
 *
 * Note that our goal here isn't to provide a library for modeling an entire
 * PHYX file in Javascript. The Curation Tool can mostly access and edit
 * components of the PHYX file as text strings or JSON objects, and the terms
 * used in the PHYX file should be clearly defined on their own. This library
 * contains convenience classes and methods that make accessing those components
 * easier.
 */

/* Helper methods */

function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/* Scientific name processing */

class ScientificNameWrapper {
  // Wraps a scientific name to provide access to components of
  // the scientific name.

  constructor(scname) {
    // Create a new scientific name wrapper around the JSON representation of
    // a scientific name.
    this.scname = scname;

    // If binomialName, genus or specificEpithet are missing, we can derive
    // them from the scientificName.
    if (
      hasOwnProperty(scname, 'scientificName') &&
      !hasOwnProperty(scname, 'binomialName') &&
      !hasOwnProperty(scname, 'genus') &&
      !hasOwnProperty(scname, 'specificEpithet')
    ) {
      this.parseFromScientificName(scname.scientificName);
    }
  }

  parseFromScientificName(verbatimName) {
    // Returns true if a scientific name could be parsed, otherwise false.

    const comps = verbatimName.split(/\s+/);

    // Did we find a binomial?
    if (comps.length >= 2) {
      [, this.scname.specificEpithet] = comps;
      this.scname.binomialName = `${comps[0]} ${comps[1]}`;
    }

    // Did we find a uninomial?
    if (comps.length >= 1) {
      [this.scname.genus] = comps;
      return true;
    }

    return false;
  }

  asJSON() {
    const result = {
      '@id': 'dwc:Taxon',
      scientificName: this.scientificName,
    };

    if (this.binomialName !== undefined) result.binomialName = this.binomialName;
    if (this.genus !== undefined) result.genus = this.genus;
    if (this.specificEpithet !== undefined) result.specificEpithet = this.specificEpithet;

    return result;
  }

  get scientificName() {
    return this.scname.scientificName;
  }

  get binomialName() {
    return this.scname.binomialName;
  }

  get genus() {
    return this.scname.genus;
  }

  get specificEpithet() {
    return this.scname.specificEpithet;
  }
}

/* Specimen wrapper */

class SpecimenWrapper {
  // Wraps a specimen entry.

  constructor(specimen) {
    // Constructs a wrapper around a specimen.
    this.specimen = specimen;
  }

  get catalogNumber() {
    if (hasOwnProperty(this.specimen, 'catalogNumber')) return this.specimen.catalogNumber;
    return undefined;
  }

  get institutionCode() {
    if (hasOwnProperty(this.specimen, 'institutionCode')) return this.specimen.institutionCode;
    return undefined;
  }

  get collectionCode() {
    if (hasOwnProperty(this.specimen, 'collectionCode')) return this.specimen.collectionCode;
    return undefined;
  }

  get occurrenceID() {
    // Does it have an occurrenceID? If so, return it.
    // If not, we attempt to construct one in the form:
    //   "urn:catalog:" + institutionCode (if present) + ':' +
    //      collectionCode (if present) + ':' + catalogNumber (if present)
    // If all else fails, we return undefined.

    if (hasOwnProperty(this.specimen, 'occurrenceID') && this.specimen.occurrenceID.trim() !== '') {
      return this.specimen.occurrenceID.trim();
    }

    // Does it have a catalogNumber? We might need an institutionCode and a collectionCode as well.
    if (hasOwnProperty(this.specimen, 'catalogNumber')) {
      if (hasOwnProperty(this.specimen, 'institutionCode')) {
        if (hasOwnProperty(this.specimen, 'collectionCode')) {
          return `urn:catalog:${this.specimen.institutionCode.trim()}:${this.specimen.collectionCode.trim()}:${this.specimen.catalogNumber.trim()}`;
        }
        return `urn:catalog:${this.specimen.institutionCode.trim()}::${this.specimen.catalogNumber.trim()}`;
      }
      if (hasOwnProperty(this.specimen, 'collectionCode')) {
        return `urn:catalog::${this.specimen.collectionCode.trim()}:${this.specimen.catalogNumber.trim()}`;
      }
      return `urn:catalog:::${this.specimen.catalogNumber.trim()}`;
    }

    // None of our specimen identifier schemes worked.
    return undefined;
  }
}

/* Taxonomic unit matching */

// eslint-disable-next-line no-unused-vars
class TaxonomicUnitMatcher {
  // A taxonomic unit matcher tests for taxonomic matches between pairs of
  // taxonomic units.

  constructor(tunit1, tunit2) {
    // Construct a Taxonomic Unit Matcher to compare the two provided
    // taxonomic units.
    this.tunit1 = tunit1;
    this.tunit2 = tunit2;

    // Set up places to store the match results.
    this.matched = undefined; // Boolean variable for storing whether these TUnits matched.
    this.matchReason = undefined; // The reason provided for this match.

    // Execute the match.
    this.match();
  }

  get asJSON() {
    // Return this TUMatch as a JSON object for insertion into the PHYX file.
    if (!this.matched) return undefined;

    return {
      '@type': 'testcase:TUMatch',
      reason: this.matchReason,
      matchesTaxonomicUnits: [
        this.tunit1,
        this.tunit2,
      ],
    };
  }

  match() {
    // Execute the match
    if (
      this.matchByBinomialName(this.tunit1, this.tunit2) ||
      this.matchByExternalReferences(this.tunit1, this.tunit2) ||
      this.matchBySpecimenIdentifier(this.tunit1, this.tunit2)
    ) {
      this.matched = true;
    } else {
      this.matched = false;
      this.matchReason = undefined;
    }
  }

  matchByBinomialName(tunit1, tunit2) {
    // Try to match by binomial name, and return true if it could be matched.

    // Do both TUnits have scientificNames?
    if (hasOwnProperty(tunit1, 'scientificNames') && hasOwnProperty(tunit2, 'scientificNames')) {
      return tunit1.scientificNames.some(scname1 =>
        tunit2.scientificNames.some((scname2) => {
          const scname1wrapped = new ScientificNameWrapper(scname1);
          const scname2wrapped = new ScientificNameWrapper(scname2);

          const result = scname1wrapped.binomialName !== undefined &&
            scname2wrapped.binomialName !== undefined &&
            scname1wrapped.binomialName.trim().length > 0 &&
            scname1wrapped.binomialName.trim() === scname2wrapped.binomialName.trim();

          if (result) {
            this.matchResult = `Scientific name '${scname1wrapped.scientificName}' and scientific name '${scname2wrapped.scientificName}' share the same binomial name`;
          }

          return result;
        }));
    }

    return false;
  }

  matchByExternalReferences(tunit1, tunit2) {
    if (hasOwnProperty(tunit1, 'externalReferences') && hasOwnProperty(tunit2, 'externalReferences')) {
      // Each external reference is a URL as a string. We will lowercase it,
      // but do no other transformation.
      return tunit1.externalReferences.some(extref1 =>
        tunit2.externalReferences.some((extref2) => {
          const result = (
            // Make sure that the external reference isn't blank
            extref1.trim() !== '' &&

            // And that it is identical after trimming
            extref1.toLowerCase().trim() === extref2.toLowerCase().trim()
          );

          if (result) {
            this.matchResult = `External reference '${extref1}' is shared by taxonomic unit ${tunit1} and ${tunit2}`;
          }

          return result;
        }));
    }

    return false;
  }

  matchBySpecimenIdentifier(tunit1, tunit2) {
    if (hasOwnProperty(tunit1, 'includesSpecimens') && hasOwnProperty(tunit2, 'includesSpecimens')) {
      // Convert specimen identifiers (if present) into a standard format and compare those.
      return tunit1.includesSpecimens.some(specimen1 =>
        tunit2.includesSpecimens.some((specimen2) => {
          const specimenURN1 = new SpecimenWrapper(specimen1).occurrenceID;
          const specimenURN2 = new SpecimenWrapper(specimen2).occurenceID;

          const result = (specimenURN1 === specimenURN2);

          if (result) {
            this.matchResult = `Specimen identifier '${specimenURN1}' is shared by taxonomic units`;
          }

          return result;
        }));
    }

    return false;
  }
}
