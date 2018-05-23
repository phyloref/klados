/*
 * PHYX Library
 * Copyright (c) The Phyloreferencing Project, 2018
 *
 * PHYloreference eXchange (PHYX) files store phyloreferences along with
 * annotated phylogenies that allow their expected resolution to be curated
 * and tested. This library provides classes and methods that help read and
 * manipulate components of PHYX files.
 *
 * Note that this file is NOT a model, but a part of the controller. Our goal
 * here isn't to provide a library for modeling an entire PHYX file in Javascript.
 * The Curation Tool can mostly access and edit components of the PHYX file as
 * text strings or JSON objects, and the terms used in the PHYX file should be
 * clearly defined on their own. This library contains convenience classes and
 * methods that make accessing those components easier.
 */

// Some of these wrappers work on Vue modal objects. In order to manipulate them
// correctly, we need to import the Vue library and use it here.
/* global Vue */

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

    // If any of the binomialName, genus or specificEpithet are missing, we can
    // derive them from the scientificName.
    if (
      hasOwnProperty(scname, 'scientificName') &&
      !(
        hasOwnProperty(scname, 'binomialName') &&
        hasOwnProperty(scname, 'genus') &&
        hasOwnProperty(scname, 'specificEpithet')
      )
    ) {
      // Try to parse the name from the scientific name.
      const comps = scname.scientificName.split(/\s+/);

      // Did we find a binomial?
      if (comps.length >= 2) {
        [, this.scname.specificEpithet] = comps;
        this.scname.binomialName = `${comps[0]} ${comps[1]}`;
      }

      // Did we find a uninomial?
      if (comps.length >= 1) {
        [this.scname.genus] = comps;
      }
    }
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
  // TODO: This currently fails on URLs used as specimen identifiers.

  constructor(specimen) {
    // Constructs a wrapper around a specimen.
    this.specimen = specimen;

    if (
      hasOwnProperty(specimen, 'catalogNumber') ||
      hasOwnProperty(specimen, 'institutionCode') ||
      hasOwnProperty(specimen, 'collectionCode')
    ) {
      // Does this specimen already have a catalog number, institution code or collection code?
      // If so, then there's no need to do anything else!
    } else if (hasOwnProperty(specimen, 'occurrenceID')) {
      // If not, try to read it from the occurrence ID
      let occurID = specimen.occurrenceID;

      // Split the occurrence ID into components by splitting them at
      // colons. The two expected formats are:
      //  - 'urn:catalog:[institutionCode]:[collectionCode]:[catalogNumber]'
      //      (in which case, we ignore the first two "components" here)
      //  - '[institutionCode]:[collectionCode]:[catalogNumber]'
      if (occurID.startsWith('urn:catalog:')) {
        occurID = occurID.substr(12);
      }
      const components = occurID.split(/\s*:\s*/);

      switch (components.length) {
        case 0:
          // No components; could not parse! Do nothing.
          break;
        case 1:
          // Only one component. Treat it as a catalogNumber.
          Vue.set(specimen, 'catalogNumber', components[0]);
          break;
        case 2:
          // Two components. Treat it as a institutionCode:catalogNumber
          Vue.set(specimen, 'institutionCode', components[0]);
          Vue.set(specimen, 'catalogNumber', components[1]);
          break;
        case 3:
          // Three components. Treat it as institutionCode:collectionCode:catalogNumber.
          Vue.set(specimen, 'institutionCode', components[0]);
          Vue.set(specimen, 'collectionCode', components[1]);
          Vue.set(specimen, 'catalogNumber', components[2]);
          break;
        default:
          // Too many components! Don't try to parse it.
          break;
      }
    } else {
      // Could not read. Do nothing!
    }
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

/* Taxonomic unit wrapper */

// eslint-disable-next-line no-unused-vars
class TaxonomicUnitWrapper {
  // Wraps taxonomic units.

  constructor(tunit) {
    // Wraps a taxonomic unit.
    this.tunit = tunit;
  }

  get label() {
    // Try to determine the label of a taxonomic unit. This checks the
    // 'label' and 'description' properties, and then tries to create a
    // descriptive label by combining the scientific names, specimens
    // and external references of the taxonomic unit.
    const tu = this.tunit; // TODO fix once I get refactor working in Atom
    const labels = [];

    // A label or description for the TU?
    if ('label' in tu) return tu.label;
    if ('description' in tu) return tu.description;

    // Any scientific names?
    if ('scientificNames' in tu) {
      tu.scientificNames.forEach((scname) => {
        if ('scientificName' in scname) labels.push(scname.scientificName);
      });
    }

    // Any specimens?
    if ('includesSpecimens' in tu) {
      tu.includesSpecimens.forEach((specimen) => {
        if ('occurrenceID' in specimen) labels.push(`Specimen ${specimen.occurrenceID}`);
      });
    }

    // Any external references?
    if ('externalReferences' in tu) {
      tu.externalReferences.forEach(externalRef => labels.push(`<${externalRef}>`));
    }

    if (labels.length === 0) return 'Unnamed taxonomic unit';

    return labels.join(', ');
  }
}

/* Phyloreference wrapper */

// eslint-disable-next-line no-unused-vars
class PhyloreferenceWrapper {
  // Wraps phyloreferences

  constructor(phyloref) {
    // Wraps a phyloreference.
    this.phyloref = phyloref;
  }

  get specifiers() {
    // Return a list of all specifiers for this phyloreference.

    if (!hasOwnProperty(this.phyloref, 'internalSpecifiers')) Vue.set(this.phyloref, 'internalSpecifiers', []);
    if (!hasOwnProperty(this.phyloref, 'externalSpecifiers')) Vue.set(this.phyloref, 'externalSpecifiers', []);

    let specifiers = this.phyloref.internalSpecifiers;
    specifiers = specifiers.concat(this.phyloref.externalSpecifiers);
    return specifiers;
  }

  getSpecifierType(specifier) {
    // For a given specifier, return a string indicating whether it is
    // an 'Internal' or 'External' specifier.

    if (hasOwnProperty(this.phyloref, 'internalSpecifiers') && this.phyloref.internalSpecifiers.includes(specifier)) return 'Internal';
    if (hasOwnProperty(this.phyloref, 'externalSpecifiers') && this.phyloref.externalSpecifiers.includes(specifier)) return 'External';
    return 'Specifier';
  }

  setSpecifierType(specifier, specifierType) {
    // Change the type of a given specifier. To do this, we first need
    // to determine if it was originally an internal or external
    // specifier, then move it into the other list.

    if (!hasOwnProperty(this.phyloref, 'internalSpecifiers')) Vue.set(this.phyloref, 'internalSpecifiers', []);
    if (!hasOwnProperty(this.phyloref, 'externalSpecifiers')) Vue.set(this.phyloref, 'externalSpecifiers', []);

    let index;
    if (specifierType === 'Internal') {
      index = this.phyloref.externalSpecifiers.indexOf(specifier);
      if (index !== -1) { this.phyloref.externalSpecifiers.splice(index, 1); }

      if (!this.phyloref.internalSpecifiers.includes(specifier)) {
        this.phyloref.internalSpecifiers.unshift(specifier);
      }
    } else if (specifierType === 'External') {
      index = this.phyloref.internalSpecifiers.indexOf(specifier);
      if (index !== -1) {
        this.phyloref.internalSpecifiers.splice(index, 1);
      }

      if (!this.phyloref.externalSpecifiers.includes(specifier)) {
        this.phyloref.externalSpecifiers.unshift(specifier);
      }
    } else {
      // Neither internal nor external? Ignore.
    }
  }

  deleteSpecifier(specifier) {
    // Since the user interface combines specifiers into a single list,
    // it doesn't remember if the specifier to be deleted is internal
    // or external. We delete the intended specifier from both arrays.

    if (hasOwnProperty(this.phyloref, 'internalSpecifiers')) {
      const index = this.phyloref.internalSpecifiers.indexOf(specifier);
      if (index !== -1) this.phyloref.internalSpecifiers.splice(index, 1);
    }

    if (hasOwnProperty(this.phyloref, 'externalSpecifiers')) {
      const index = this.phyloref.externalSpecifiers.indexOf(specifier);
      if (index !== -1) this.phyloref.externalSpecifiers.splice(index, 1);
    }
  }

  static getSpecifierLabel(specifier) {
    // Try to determine the label of a specifier. This checks the
    // 'label' and 'description' properties, and then tries to create a
    // descriptive label by using the list of referenced taxonomic units.

    // Is this specifier even non-null?
    if (specifier === undefined) return '(undefined)';
    if (specifier === null) return '(null)';

    // Maybe there is a label or description right there?
    if ('label' in specifier) return specifier.label;
    if ('description' in specifier) return specifier.description;

    // Look at the individual taxonomic units.
    if ('referencesTaxonomicUnits' in specifier) {
      const labels = specifier.referencesTaxonomicUnits
        .map(tu => new TaxonomicUnitWrapper(tu).label);
      if (labels.length > 0) return labels.join('; ');
    }

    // No idea!
    return 'Unnamed specifier';
  }
}

/* Node wrappers */

// eslint-disable-next-line no-unused-vars
class NodeLabelWrapper {
  // Wraps node labels in phylogenies.

  constructor(nodeLabel) {
    // Wraps a node label.
    this.nodeLabel = nodeLabel;
  }

  get tunits() {
    // Return a list of taxonomic units extractable from this node label.
    if (this.nodeLabel === undefined) return [];

    // Check if the label starts with a binomial name.
    const results = /^([A-Z][a-z]+) ([a-z-]+)\b/.exec(this.nodeLabel);
    if (results !== null) {
      return [{
        scientificNames: [{
          scientificName: this.nodeLabel,
          binomialName: `${results[1]} ${results[2]}`,
          genus: results[1],
          specificEpithet: results[2],
        }],
      }];
    }

    // It may be a scientific name, but we don't know how to parse it as such.
    return [];
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
