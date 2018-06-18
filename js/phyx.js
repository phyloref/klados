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

// Tell ESLint about globals imported in the HTML page.
/* global Vue */ // From https://vuejs.org/
/* global d3 */ // From https://d3js.org/

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
      (!hasOwnProperty(scname, 'genus') && !hasOwnProperty(scname, 'specificEpithet'))
    ) {
      // Do we also have a binomial name? If so, use that instead.
      if (hasOwnProperty(scname, 'binomialName')) this.parseFromScientificName(scname.binomialName);
      else this.parseFromScientificName(scname.scientificName);
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

  get label() {
    return this.scientificName;
  }
}

/* Specimen wrapper */

class SpecimenWrapper {
  // Wraps a specimen entry.

  constructor(specimen) {
    // Constructs a wrapper around a specimen.
    this.specimen = specimen;

    // If there is no catalogNumber, try to extract it from the 'occurrenceID'.
    // The two expected formats are:
    //  - 'urn:catalog:[institutionCode]:[collectionCode]:[catalogNumber]'
    //      (in which case, we ignore the first two "components" here)
    //  - '[institutionCode]:[collectionCode]:[catalogNumber]'
    if (
      hasOwnProperty(specimen, 'occurrenceID') &&
      !hasOwnProperty(specimen, 'catalogNumber') &&
      !hasOwnProperty(specimen, 'institutionCode') &&
      !hasOwnProperty(specimen, 'collectionCode')
    ) {
      let occurID = specimen.occurrenceID;
      if (occurID.startsWith('urn:catalog:')) occurID = occurID.substr(12);
      const comps = occurID.split(/:/);

      if (comps.length === 1) {
        // specimen.institutionCode = undefined;
        // specimen.collectionCode = undefined;
        [this.specimen.catalogNumber] = comps;
      } else if (comps.length === 2) {
        [this.specimen.institutionCode, this.specimen.catalogNumber] = comps;
      } else if (comps.length >= 3) {
        let catalogNumValues = []; // Store all split catalog number values.
        [this.specimen.institutionCode, this.specimen.collectionCode, ...catalogNumValues] = comps;
        this.specimen.catalogNumber = catalogNumValues.join(':');
      }
    }

    // There might be a catalogNumber, institutionCode or a collectionCode.
    // In which case, let's construct an occurrenceID!
    if (!hasOwnProperty(specimen, 'occurrenceID')) {
      if (hasOwnProperty(specimen, 'catalogNumber')) {
        if (hasOwnProperty(specimen, 'institutionCode')) {
          if (hasOwnProperty(specimen, 'collectionCode')) {
            this.specimen.occurrenceID = `urn:catalog:${specimen.institutionCode}:${specimen.collectionCode}:${specimen.catalogNumber}`;
          } else {
            this.specimen.occurrenceID = `urn:catalog:${specimen.institutionCode}::${specimen.catalogNumber}`;
          }
        } else {
          this.specimen.occurrenceID = `urn:catalog:::${specimen.catalogNumber}`;
        }
      } else {
        this.specimen.occurrenceID = 'urn:catalog:::';
      }
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

  get label() {
    return `Specimen ${this.occurrenceID}`;
  }
}

/* Taxonomic unit wrapper */

class TaxonomicUnitWrapper {
  // Wraps a taxonomic unit.
  // Also provides static methods for obtaining lists of wrapped taxonomic units
  // from node labels and other possible inputs.

  constructor(tunit) {
    // Wrap a taxonomic unit.
    this.tunit = tunit;
  }

  get label() {
    // Try to determine the label of a taxonomic unit. This checks the
    // 'label' and 'description' properties, and then tries to create a
    // descriptive label by combining the scientific names, specimens
    // and external references of the taxonomic unit.
    const labels = [];

    // A label or description for the TU?
    if (hasOwnProperty(this.tunit, 'label')) return this.tunit.label;
    if (hasOwnProperty(this.tunit, 'description')) return this.tunit.description;

    // Any scientific names?
    if (hasOwnProperty(this.tunit, 'scientificNames')) {
      this.tunit.scientificNames.forEach((scname) => {
        labels.push(new ScientificNameWrapper(scname).label);
      });
    }

    // Any specimens?
    if (hasOwnProperty(this.tunit, 'includesSpecimens')) {
      this.tunit.includesSpecimens.forEach((specimen) => {
        labels.push(new SpecimenWrapper(specimen).label);
      });
    }

    // Any external references?
    if (hasOwnProperty(this.tunit, 'externalReferences')) {
      this.tunit.externalReferences.forEach(externalRef => labels.push(`<${externalRef}>`));
    }

    if (labels.length === 0) return 'Unnamed taxonomic unit';

    return labels.join(', ');
  }

  static getTaxonomicUnitsFromNodeLabel(nodeLabel) {
    // Given a node label, attempt to parse it as a scientific name.
    // Returns a list of taxonomic units.
    if (nodeLabel === undefined || nodeLabel === null) return [];

    // Check if the label starts with a binomial name.
    const results = /^([A-Z][a-z]+) ([a-z-]+)\b/.exec(nodeLabel);
    if (results !== null) {
      return [{
        scientificNames: [{
          scientificName: nodeLabel,
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
          const specimenURN2 = new SpecimenWrapper(specimen2).occurrenceID;

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

/* Phylogeny wrapper */

// eslint-disable-next-line no-unused-vars
class PhylogenyWrapper {
  // Wraps a Phylogeny in a PHYX file and provides access to node, node label
  // and other information. Remember that a Phylogeny also has the
  // additionalNodeProperties object which provides additional properties for
  // nodes.

  constructor(phylogeny) {
    // Construct a phylogeny based on a Phylogeny object in a PHYX phylogeny.
    // Note that this version ONLY uses the `newick` property to determine the
    // phylogeny: if other representations are included (such as a node-based
    // format, as used in JSON-LD), they will be ignored and possibly overwritten
    // during export. So, to update the phylogeny, please only update the newick
    // string!
    //
    // This ensures that we don't need to reconcile between different
    // possible representations of a phylogeny.
    this.phylogeny = phylogeny;
  }

  static addNodeAndChildrenToNodeLabels(node, nodeLabels, nodeType = 'both') {
    // Recurse into the children of this node and add labels into the list of
    // nodeLabels as per the nodeType provided, which must be one of:
    //  - 'internal': internal nodes only
    //  - 'terminal': terminal nodes only
    //  - 'both': both internal and terminal nodes

    // console.log("Recursing into: " + JSON.stringify(node));

    if (hasOwnProperty(node, 'name') && node.name !== '') {
      const nodeHasChildren = hasOwnProperty(node, 'children') && node.children.length > 0;

      // Only add the node label if it is on the type of node
      // we're interested in.
      if (
        (nodeType === 'both') ||
        (nodeType === 'internal' && nodeHasChildren) ||
        (nodeType === 'terminal' && !nodeHasChildren)
      ) {
        nodeLabels.add(node.name);
      }
    }

    if (hasOwnProperty(node, 'children')) {
      node.children.forEach(child =>
        PhylogenyWrapper.addNodeAndChildrenToNodeLabels(child, nodeLabels, nodeType));
    }
  }

  getNodeLabels(nodeType = 'both') {
    // Return a list of all the node labels in a phylogeny. These
    // node labels come from two sources:
    //  1. We look for node names in the Newick string.
    //  2. We look for node names in the additionalNodeProperties.
    //
    // nodeType can be one of:
    // - 'internal': Return node labels on internal nodes.
    // - 'terminal': Return node labels on terminal nodes.
    // - 'both': Return node labels on both internal and terminal nodes.

    const nodeLabels = new Set();

    // Names from the Newick string.
    const { newick = '()' } = this.phylogeny;

    // Parse the Newick string; if parseable, recurse through the node labels,
    // adding them all to 'nodeLabels'.
    const parsed = d3.layout.newick_parser(newick);
    if (hasOwnProperty(parsed, 'json')) {
      // Recurse away!
      PhylogenyWrapper.addNodeAndChildrenToNodeLabels(parsed.json, nodeLabels, nodeType);
    }

    return Array.from(nodeLabels);
  }

  getTaxonomicUnitsForNodeLabel(nodeLabel) {
    // Return a list of taxonomic units for a node label.

    // Look up additional node properties.
    let additionalNodeProperties = {};
    if (
      hasOwnProperty(this.phylogeny, 'additionalNodeProperties') &&
      hasOwnProperty(this.phylogeny.additionalNodeProperties, nodeLabel)
    ) {
      additionalNodeProperties = this.phylogeny.additionalNodeProperties[nodeLabel];
    }

    // If there are explicit taxonomic units in the
    // representsTaxonomicUnits property, we need to use those.
    if (hasOwnProperty(additionalNodeProperties, 'representsTaxonomicUnits')) {
      return additionalNodeProperties.representsTaxonomicUnits;
    }

    // If that doesn't work, we can try to extract scientific names from
    // the node label.
    return TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(nodeLabel.trim());
  }

  getNodeLabelsMatchedBySpecifier(specifier) {
    // Return a list of node labels matched by a given specifier on
    // a given phylogeny.

    return this.getNodeLabels().filter((nodeLabel) => {
      // Does the specifier have any taxonomic units? If not, we can't
      // match anything!
      if (!hasOwnProperty(specifier, 'referencesTaxonomicUnits')) { return false; }

      // Find all the taxonomic units associated with the specifier and
      // with the node.
      const specifierTUnits = specifier.referencesTaxonomicUnits;
      const nodeTUnits = this.getTaxonomicUnitsForNodeLabel(nodeLabel);

      // Attempt pairwise matches between taxonomic units in the specifier
      // and associated with the node.
      return specifierTUnits.some(tunit1 =>
        nodeTUnits.some(tunit2 => new TaxonomicUnitMatcher(tunit1, tunit2).matched));
    });
  }
}

/* Phyloreference wrapper */

// eslint-disable-next-line no-unused-vars
class PhylorefWrapper {
  // Wraps a phyloreference in a PHYX model.

  constructor(phyloref) {
    // Wraps the provided phyloreference
    this.phyloref = phyloref;
  }

  get label() {
    if (hasOwnProperty(this.phyloref, 'label')) return this.phyloref.label;
    if (hasOwnProperty(this.phyloref, 'labels') && this.phyloref.labels.length > 0) return this.phyloref.labels[0];
    if (hasOwnProperty(this.phyloref, 'title')) return this.phyloref.title;

    return undefined;
  }

  get specifiers() {
    // Returns a list of all specifiers
    // Combine the internal and external specifiers into a single list,
    // with internal specifiers before external specifiers.
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
    if (hasOwnProperty(specifier, 'label')) return specifier.label;
    if (hasOwnProperty(specifier, 'description')) return specifier.description;

    // Look at the individual taxonomic units.
    if (hasOwnProperty(specifier, 'referencesTaxonomicUnits')) {
      const labels = specifier.referencesTaxonomicUnits
        .map(tu => new TaxonomicUnitWrapper(tu).label);
      if (labels.length > 0) return labels.join('; ');
    }

    // No idea!
    return 'Unnamed specifier';
  }

  getExpectedNodeLabels(phylogeny) {
    // Given a phylogeny, determine which node labels we expect this phyloref to
    // resolve to. To do this, we:
    //  1. Find all node labels that are case-sensitively identical
    //     to the phyloreference.
    //  2. Find all node labels that have additionalNodeProperties with
    //     expectedPhyloreferenceNamed case-sensitively identical to
    //     the phyloreference.
    const phylorefLabel = this.label;
    const nodeLabels = new Set();

    new PhylogenyWrapper(phylogeny).getNodeLabels().forEach((nodeLabel) => {
      // Is this node label identical to the phyloreference name?
      if (nodeLabel === phylorefLabel) {
        nodeLabels.add(nodeLabel);
      } else if (
        hasOwnProperty(phylogeny, 'additionalNodeProperties') &&
        hasOwnProperty(phylogeny.additionalNodeProperties, nodeLabel) &&
        hasOwnProperty(phylogeny.additionalNodeProperties[nodeLabel], 'expectedPhyloreferenceNamed')
      ) {
        // Does this node label have an expectedPhyloreferenceNamed that
        // includes this phyloreference name?

        const expectedPhylorefs = phylogeny
          .additionalNodeProperties[nodeLabel]
          .expectedPhyloreferenceNamed;

        if (expectedPhylorefs.includes(phylorefLabel)) {
          nodeLabels.add(nodeLabel);
        }
      }
    });

    // Return node labels sorted alphabetically.
    return Array.from(nodeLabels).sort();
  }
}
