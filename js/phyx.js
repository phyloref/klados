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
 *
 * Most of these classes are wrappers. Because the object they wrap may be
 * unexpectedly modified through the UI, wrapper constructors should be extremely
 * lightweight so that the wrapper can be created quickly. Individual methods
 * can be complex and slow if necessary.
 */

// Tell ESLint about globals imported in the HTML page.
/* global Vue */ // From https://vuejs.org/
/* global d3 */ // From https://d3js.org/
/* global moment */ // From https://momentjs.com/

// Our global variables
// eslint-disable-next-line no-var
var phyxCacheManager;

/* Helper methods */

function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/* Cache manager */

class CacheManager {
  // The Cache Manager helps manage the various caches we use in this library
  // Ideally, caches should be created in the global phyxCacheManager object.
  // A library can then call phyxCacheManager.clear() to empty the entire cache.

  constructor() {
    // Construct a new cache manager.
    this.clear();
  }

  clear() {
    // Clear all current caches
    this.caches = {};
  }

  has(cacheName, cacheKey) {
    // Return true if we have a value for this particular cache key.
    return hasOwnProperty(this.caches, cacheName) &&
      hasOwnProperty(this.caches[cacheName], cacheKey);
  }

  get(cacheName, cacheKey) {
    // Look up the value of a key in a particular cache key.
    if (!hasOwnProperty(this.caches, cacheName)) this.caches[cacheName] = {};
    if (!hasOwnProperty(this.caches[cacheName], cacheKey)) return undefined;
    return this.caches[cacheName][cacheKey];
  }

  put(cacheName, cacheKey, value) {
    // Set the value of a key in a particular cache key.
    if (!hasOwnProperty(this.caches, cacheName)) this.caches[cacheName] = {};
    if (!hasOwnProperty(this.caches[cacheName], cacheKey)) this.caches[cacheName][cacheKey] = {};
    this.caches[cacheName][cacheKey] = value;
  }
}
phyxCacheManager = new CacheManager();

/* Scientific name processing */

class ScientificNameWrapper {
  // Wraps a scientific name to provide access to components of
  // the scientific name. For now, we ignore binomialName, genus and
  // specificEpithet and rederive them from the scientific name.

  constructor(scname) {
    // Create a new scientific name wrapper around the JSON representation of
    // a scientific name.
    this.scname = scname;
  }

  static createFromVerbatimName(verbatimName) {
    // Returns a scientific name object created from a particular verbatim name.
    // Not that the returned object will NOT be wrapped -- so remember to wrap it
    // if necessary!

    // Start with the 'scientific name' as the verbatim name.
    const scname = {
      scientificName: verbatimName,
    };

    // Split the verbatim name into a genus and specific epithet, if possible.
    // Splitting the verbatim name takes some time, so let's memoize this.
    if (phyxCacheManager.has('ScientificNameWrapper.scnameCache', verbatimName)) {
      return phyxCacheManager.get('ScientificNameWrapper.scnameCache', verbatimName);
    }

    const comps = verbatimName.split(/\s+/);

    // Did we find a binomial?
    if (comps.length >= 2) {
      [, scname.specificEpithet] = comps;
    }

    // Did we find a uninomial?
    if (comps.length >= 1) {
      [scname.genus] = comps;
    }

    // Store in the cache.
    phyxCacheManager.put('ScientificNameWrapper.scnameCache', verbatimName, scname);

    return scname;
  }

  get scientificName() {
    // Get the "dwc:scientificName" -- the complete scientific name.
    return this.scname.scientificName;
  }

  get binomialName() {
    // Get the binomial name. Constructed from the genus and specific epithet
    // if available.
    if (this.genus === undefined || this.specificEpithet === undefined) return undefined;
    return `${this.genus} ${this.specificEpithet}`;
  }

  get genus() {
    // Try to read the genus if available.
    if (hasOwnProperty(this.scname, 'genus')) return this.scname.genus;

    // If there is no genus but there is a scientificName, try to extract a genus
    // from it.
    if (hasOwnProperty(this.scname, 'scientificName')) {
      const scname = ScientificNameWrapper.createFromVerbatimName(this.scname.scientificName);
      if (hasOwnProperty(scname, 'genus')) return scname.genus;
    }
    return undefined;
  }

  get specificEpithet() {
    // Try to read the specific epithet if available.
    if (hasOwnProperty(this.scname, 'specificEpithet')) return this.scname.specificEpithet;

    // If there is no specific epithet but there is a scientificName, try to
    // extract a specific epithet from it.
    if (hasOwnProperty(this.scname, 'scientificName')) {
      const scname = ScientificNameWrapper.createFromVerbatimName(this.scname.scientificName);
      if (hasOwnProperty(scname, 'specificEpithet')) return scname.specificEpithet;
    }
    return undefined;
  }

  get label() {
    // Return a label corresponding to this scientific name -- we use the complete verbatim name.
    return this.scientificName;
  }
}

/* Specimen wrapper */

class SpecimenWrapper {
  // Wraps a specimen identifier.

  constructor(specimen) {
    // Constructs a wrapper around a specimen.
    this.specimen = specimen;

    if (!hasOwnProperty(specimen, 'occurrenceID')) {
      // There might be a catalogNumber, institutionCode or a collectionCode.
      // In which case, let's construct an occurrenceID!
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

  static createFromOccurrenceID(occurrenceID) {
    // Create a specimen object from the occurrence ID.
    // The two expected formats are:
    //  - 'urn:catalog:[institutionCode]:[collectionCode]:[catalogNumber]'
    //      (in which case, we ignore the first two "components" here)
    //  - '[institutionCode]:[collectionCode]:[catalogNumber]'
    // Note that the returned object is NOT wrapped -- so please wrap it if needed!

    // Copy the occurrence ID so we can truncate it if necessary.
    let occurID = occurrenceID;
    if (occurID.startsWith('urn:catalog:')) occurID = occurID.substr(12);

    // Prepare the specimen.
    const specimen = {
      occurrenceID: occurID,
    };

    // Look for certain prefixes that suggest that we've been passed a URN or
    // URL instead. If so, don't do any further processing!
    const URL_URN_PREFIXES = [
      'http://',
      'https://',
      'ftp://',
      'sftp://',
      'file://',
      'urn:',
    ];
    if (URL_URN_PREFIXES.filter(prefix => occurID.toLowerCase().startsWith(prefix)).length > 0) {
      return specimen;
    }

    // Parsing an occurrence ID takes some time, so we should memoize it.
    if (phyxCacheManager.has('SpecimenWrapper.occurrenceIDCache', occurID)) {
      return phyxCacheManager.get('SpecimenWrapper.occurrenceIDCache', occurID);
    }

    // Split the occurrence ID into components, and store them in the appropriate fields.
    const comps = occurID.split(/:/);
    if (comps.length === 1) {
      // specimen.institutionCode = undefined;
      // specimen.collectionCode = undefined;
      [specimen.catalogNumber] = comps;
    } else if (comps.length === 2) {
      [specimen.institutionCode, specimen.catalogNumber] = comps;
    } else if (comps.length >= 3) {
      let catalogNumValues = []; // Store all split catalog number values.
      [specimen.institutionCode, specimen.collectionCode, ...catalogNumValues] = comps;
      specimen.catalogNumber = catalogNumValues.join(':');
    }

    phyxCacheManager.put('SpecimenWrapper.occurrenceIDCache', occurID, specimen);
    return specimen;
  }

  get catalogNumber() {
    // Get the catalog number from the specimen object if present.
    if (hasOwnProperty(this.specimen, 'catalogNumber')) return this.specimen.catalogNumber;

    // Otherwise, try to parse the occurrenceID and see if we can extract a
    // catalogNumber from there.
    if (hasOwnProperty(this.specimen, 'occurrenceID')) {
      const specimen = SpecimenWrapper.createFromOccurrenceID(this.specimen.occurrenceID);
      if (hasOwnProperty(specimen, 'catalogNumber')) return specimen.catalogNumber;
    }
    return undefined;
  }

  get institutionCode() {
    // Get the institution code from the specimen object if present.
    if (hasOwnProperty(this.specimen, 'institutionCode')) return this.specimen.institutionCode;

    // Otherwise, try to parse the occurrenceID and see if we can extract an
    // occurrenceID from there.
    if (hasOwnProperty(this.specimen, 'occurrenceID')) {
      const specimen = SpecimenWrapper.createFromOccurrenceID(this.specimen.occurrenceID);
      if (hasOwnProperty(specimen, 'institutionCode')) return specimen.institutionCode;
    }
    return undefined;
  }

  get collectionCode() {
    // Get the collection code from the specimen object if present.
    if (hasOwnProperty(this.specimen, 'collectionCode')) return this.specimen.collectionCode;

    // Otherwise, try to parse the occurrenceID and see if we can extract an
    // occurrenceID from there.
    if (hasOwnProperty(this.specimen, 'occurrenceID')) {
      const specimen = SpecimenWrapper.createFromOccurrenceID(this.specimen.occurrenceID);
      if (hasOwnProperty(specimen, 'collectionCode')) return specimen.collectionCode;
    }
    return undefined;
  }

  get occurrenceID() {
    // Does this specimen have an occurrenceID? If so, return it.
    // If not, we attempt to construct one in the form:
    //   "urn:catalog:" + institutionCode (if present) + ':' +
    //      collectionCode (if present) + ':' + catalogNumber (if present)
    // If all else fails, we return undefined.
    //
    // If this was a full wrapper, we might create a setter on the occurrenceID;
    // however, the Vue model modifies the underlying specimen object, not the
    // wrapper.

    // Return the occurrenceID if it exists.
    if (hasOwnProperty(this.specimen, 'occurrenceID') && this.specimen.occurrenceID.trim() !== '') {
      return this.specimen.occurrenceID.trim();
    }

    // Otherwise, we could try to construct the occurrenceID from its components.
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
    // Return a label for this specimen
    return `Specimen ${this.occurrenceID}`;
  }
}

/* Taxonomic unit wrapper */

class TaxonomicUnitWrapper {
  // Wraps a taxonomic unit.
  // Also provides static methods for obtaining lists of wrapped taxonomic units
  // from node labels.

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

    // Any scientific names?
    if (hasOwnProperty(this.tunit, 'scientificNames')) {
      this.tunit.scientificNames.forEach((scname) => {
        labels.push(new ScientificNameWrapper(scname).label);
      });
    }

    // If we don't have any properties of a taxonomic unit, return undefined.
    if (labels.length === 0) return undefined;

    return labels.join(' or ');
  }

  // Access variables in the underlying wrapped taxonomic unit.
  get scientificNames() {
    return this.tunit.scientificNames;
  }

  get includeSpecimens() {
    return this.tunit.includesSpecimens;
  }

  get externalReferences() {
    return this.tunit.externalReferences;
  }

  static getTaxonomicUnitsFromNodeLabel(nodeLabel) {
    // Given a node label, attempt to parse it as a scientific name.
    // Returns a list of taxonomic units.
    if (nodeLabel === undefined || nodeLabel === null) return [];

    // This regular expression times a while to run, so let's memoize this.
    if (phyxCacheManager.has('TaxonomicUnitWrapper.taxonomicUnitsFromNodeLabelCache', nodeLabel)) {
      return phyxCacheManager.get('TaxonomicUnitWrapper.taxonomicUnitsFromNodeLabelCache', nodeLabel);
    }

    // Check if the label starts with a binomial name.
    let tunits = [];
    const results = /^([A-Z][a-z]+)[ _]([a-z-]+)(?:\b|_)\s*(.*)/.exec(nodeLabel);
    if (results !== null) {
      tunits = [{
        scientificNames: [{
          scientificName: `${results[1]} ${results[2]} ${results[3]}`.trim(),
          binomialName: `${results[1]} ${results[2]}`,
          genus: results[1],
          specificEpithet: results[2],
        }],
      }];
    } else {
      // It may be a scientific name, but we don't know how to parse it as such.
      tunits = [];
    }

    // Record in the cache
    phyxCacheManager.put('TaxonomicUnitWrapper.taxonomicUnitsFromNodeLabelCache', nodeLabel, tunits);

    return tunits;
  }
}

/* Taxonomic unit matching */

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

  asJSON(idURI) {
    // Return this TUMatch as a JSON object for insertion into the PHYX file.
    if (!this.matched) return undefined;

    return {
      '@id': idURI,
      '@type': 'testcase:TUMatch',
      reason: this.matchReason,
      matchesTaxonomicUnits: [
        { '@id': this.tunit1['@id'] },
        { '@id': this.tunit2['@id'] },
      ],
    };
  }

  match() {
    // Try to match the two taxonomic units using a number of matching methods.
    if (
      this.matchByBinomialName() ||
      this.matchByExternalReferences() ||
      this.matchBySpecimenIdentifier()
    ) {
      this.matched = true;
    } else {
      this.matched = false;
      this.matchReason = undefined;
    }
  }

  matchByBinomialName() {
    // Try to match by binomial name, and return true if it could be matched.

    // Do both TUnits have scientificNames?
    if (!hasOwnProperty(this.tunit1, 'scientificNames') || !hasOwnProperty(this.tunit2, 'scientificNames')) return false;

    return this.tunit1.scientificNames.some((scname1) => {
      const scname1wrapped = new ScientificNameWrapper(scname1);
      return this.tunit2.scientificNames.some((scname2) => {
        const scname2wrapped = new ScientificNameWrapper(scname2);

        const result = scname1wrapped.binomialName !== undefined &&
          scname2wrapped.binomialName !== undefined &&
          scname1wrapped.binomialName.trim().length > 0 &&
          scname1wrapped.binomialName.trim() === scname2wrapped.binomialName.trim();

        if (result) {
          this.matchReason = `Scientific name '${scname1wrapped.scientificName}' and scientific name '${scname2wrapped.scientificName}' share the same binomial name`;
        }

        return result;
      });
    });
  }

  matchByExternalReferences() {
    // Try to match by external references.

    if (hasOwnProperty(this.tunit1, 'externalReferences') && hasOwnProperty(this.tunit2, 'externalReferences')) {
      // Each external reference is a URL as a string. We will lowercase it,
      // but do no other transformation.
      return this.tunit1.externalReferences.some(extref1 =>
        this.tunit2.externalReferences.some((extref2) => {
          const result = (
            // Make sure that the external reference isn't blank
            extref1.trim() !== '' &&

            // And that it is identical after trimming
            extref1.toLowerCase().trim() === extref2.toLowerCase().trim()
          );

          if (result) {
            this.matchReason = `External reference '${extref1}' is shared by taxonomic unit ${this.tunit1} and ${this.tunit2}`;
          }

          return result;
        }));
    }

    return false;
  }

  matchBySpecimenIdentifier() {
    // Try to match by specimen identifier (i.e. occurrence ID).

    if (hasOwnProperty(this.tunit1, 'includesSpecimens') && hasOwnProperty(this.tunit2, 'includesSpecimens')) {
      // Convert specimen identifiers (if present) into a standard format and compare those.
      return this.tunit1.includesSpecimens.some((specimen1) => {
        const specimenURN1 = new SpecimenWrapper(specimen1).occurrenceID;
        return this.tunit2.includesSpecimens.some((specimen2) => {
          const specimenURN2 = new SpecimenWrapper(specimen2).occurrenceID;

          const result = (specimenURN1 === specimenURN2);

          if (result) {
            this.matchReason = `Specimen identifier '${specimenURN1}' is shared by taxonomic units`;
          }

          return result;
        });
      });
    }

    return false;
  }
}

/* Phylogeny wrapper */

class PhylogenyWrapper {
  // Wraps a Phylogeny in a PHYX file and provides access to node, node labels
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

  static getErrorsInNewickString(newick) {
    // Given a Newick string, return a list of errors found in parsing this
    // string. The errors are returned as a list of objects, each of which
    // has two properties:
    //  - title: A short title of the error, distinct for each type of error.
    //  - message: A longer description of the error, which might include
    //    information specific to a particular error.
    //
    // We try to order errors from most helpful ('Unbalanced parentheses in
    // Newick string') to least helpful ('Error parsing phylogeny').
    const newickTrimmed = newick.trim();
    const errors = [];

    // Look for an empty Newick string.
    if (newickTrimmed === '' || newickTrimmed === '()' || newickTrimmed === '();') {
      // None of the later errors are relevant here, so bail out now.
      return [{
        title: 'No phylogeny entered',
        message: 'Click on "Edit as Newick" to enter a phylogeny below.',
      }];
    }

    // Look for an unbalanced Newick string.
    let parenLevels = 0;
    for (let x = 0; x < newickTrimmed.length; x += 1) {
      if (newickTrimmed[x] === '(') parenLevels += 1;
      if (newickTrimmed[x] === ')') parenLevels -= 1;
    }

    if (parenLevels !== 0) {
      errors.push({
        title: 'Unbalanced parentheses in Newick string',
        message: (parenLevels > 0 ?
          `You have ${parenLevels} too many open parentheses` :
          `You have ${-parenLevels} too few open parentheses`
        ),
      });
    }

    // Finally, try parsing it with newick_parser and see if we get an error.
    const parsed = d3.layout.newick_parser(newickTrimmed);
    if (!hasOwnProperty(parsed, 'json') || parsed.json === null) {
      const error = (hasOwnProperty(parsed, 'error') ? parsed.error : 'unknown error');
      errors.push({
        title: 'Error parsing phylogeny',
        message: `An error occured while parsing this phylogeny: ${error}`,
      });
    }

    return errors;
  }

  static recurseNodes(node, func, nodeCount = 0, parentCount = undefined) {
    // Recurse through PhyloTree nodes, executing function on each node.
    //  - node: The node to recurse from. The function will be called on node
    //          *before* being called on its children.
    //  - func: The function to call on `node` and all of its children.
    //  - nodeCount: `node` will be called with this nodeCount. All of its
    //          children will be called with consecutively increasing nodeCounts.
    //  - parentCount: The nodeCount associated with the parent of this node
    //          within this run of recurseNodes. For instance, immediate children
    //          of `node` will have a parentCount of 0. By default, `node` itself
    //          will have a parentCount of `undefined`.
    // When the function `func` is called, it is given three arguments:
    //  - The current node object (initially: `node`)
    //  - The count of the current node object (initially: `nodeCount`)
    //  - The parent count of the current node object (initially: `parentCount`)
    func(node, nodeCount, parentCount);

    let nextID = nodeCount + 1;

    // Recurse through all children of this node.
    if (hasOwnProperty(node, 'children')) {
      node.children.forEach((child) => {
        nextID = PhylogenyWrapper.recurseNodes(
          child,
          func,
          nextID,
          nodeCount,
        );
      });
    }

    return nextID;
  }

  getTaxonomicUnits(nodeType = 'both') {
    // Return a list of all taxonomic units in this phylogeny.
    // Node labels will be extracted from:
    //  - internal nodes only (if nodeType == 'internal')
    //  - terminal nodes only (if nodeType == 'terminal')
    //  - both internal and terminal nodes (if nodeType == 'both')
    //
    // See `getTaxonomicUnitsForNodeLabel` to see how node labels are converted
    // into node labels, but in brief:
    //  1. We look for taxonomic units in the additionalNodeProperties.
    //  2. If none are found, we attempt to parse the node label as a scientific name.
    //
    const nodeLabels = this.getNodeLabels(nodeType);
    const tunits = new Set();

    nodeLabels.forEach(nodeLabel =>
      this.getTaxonomicUnitsForNodeLabel(nodeLabel).forEach(tunit => tunits.add(tunit)));

    return tunits;
  }

  getNodeLabels(nodeType = 'both') {
    // Return a list of all the node labels in a phylogeny.
    //
    // nodeType can be one of:
    // - 'internal': Return node labels on internal nodes.
    // - 'terminal': Return node labels on terminal nodes.
    // - 'both': Return node labels on both internal and terminal nodes.

    const nodeLabels = new Set();

    // Names from the Newick string.
    const newick = this.phylogeny.newick || '()';

    // Parse the Newick string; if parseable, recurse through the node labels,
    // adding them all to 'nodeLabels'.
    const parsed = d3.layout.newick_parser(newick);
    if (hasOwnProperty(parsed, 'json') && parsed.json !== null) {
      // Recurse away!
      PhylogenyWrapper.recurseNodes(parsed.json, (node) => {
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
      });
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
    // the node label. Note that taxonomic units will NOT be extracted from
    // the label if there is a taxonomic unit present!
    return TaxonomicUnitWrapper.getTaxonomicUnitsFromNodeLabel(nodeLabel.trim());
  }

  getNodeLabelsMatchedBySpecifier(specifier) {
    // Return a list of node labels matched by a given specifier on
    // a given phylogeny.

    // Does the specifier have any taxonomic units? If not, we can't
    // match anything!
    if (!hasOwnProperty(specifier, 'referencesTaxonomicUnits')) { return []; }
    const specifierTUnits = specifier.referencesTaxonomicUnits;

    return this.getNodeLabels().filter((nodeLabel) => {
      // Find all the taxonomic units associated with the specifier and
      // with the node.
      const nodeTUnits = this.getTaxonomicUnitsForNodeLabel(nodeLabel);

      // Attempt pairwise matches between taxonomic units in the specifier
      // and associated with the node.
      return specifierTUnits.some(tunit1 =>
        nodeTUnits.some(tunit2 => new TaxonomicUnitMatcher(tunit1, tunit2).matched));
    });
  }

  getParsedNewickWithIRIs(baseURI) {
    // Return the parsed Newick string, but with EVERY node given an IRI.
    // baseURI: The base URI to use for node elements (e.g. ':phylogeny1').

    const newick = this.phylogeny.newick || '()';
    const parsed = d3.layout.newick_parser(newick);
    if (hasOwnProperty(parsed, 'json')) {
      PhylogenyWrapper.recurseNodes(parsed.json, (node, nodeCount) => {
        // Start with the additional node properties.
        const nodeAsJSONLD = node;

        // Set @id and @type.
        const nodeURI = `${baseURI}_node${nodeCount}`;
        nodeAsJSONLD['@id'] = nodeURI;
      });
    }

    return parsed;
  }

  getNodesAsJSONLD(baseURI) {
    // Returns a list of all nodes in this phylogeny as a series of nodes.
    // - baseURI: The base URI to use for node elements (e.g. ':phylogeny1').

    // List of nodes we have identified.
    const nodes = [];

    // We need to track the identifiers we give each node as we go.
    const nodesById = {};
    const nodeIdsByParentId = {};

    // Extract the newick string.
    const { additionalNodeProperties } = this.phylogeny;

    // Parse the Newick string; if parseable, recurse through the nodes,
    // added them to the list of JSON-LD nodes as we go.

    const parsed = this.getParsedNewickWithIRIs(baseURI);
    if (hasOwnProperty(parsed, 'json')) {
      PhylogenyWrapper.recurseNodes(parsed.json, (node, nodeCount, parentCount) => {
        // Start with the additional node properties.
        const nodeAsJSONLD = {};

        // Set @id and @type. '@id' should already be set by getParsedNewickWithIRIs()!
        const nodeURI = node['@id'];
        nodeAsJSONLD['@id'] = nodeURI;
        nodeAsJSONLD['@type'] = 'http://purl.obolibrary.org/obo/CDAO_0000140';

        // Add labels, additional node properties and taxonomic units.
        if (hasOwnProperty(node, 'name') && node.name !== '') {
          // Add node label.
          nodeAsJSONLD.labels = [node.name];

          // Add additional node properties, if any.
          if (additionalNodeProperties && hasOwnProperty(additionalNodeProperties, node.name)) {
            Object.keys(additionalNodeProperties[node.name]).forEach((key) => {
              nodeAsJSONLD[key] = additionalNodeProperties[node.name][key];
            });
          }

          // Add taxonomic units.
          nodeAsJSONLD.representsTaxonomicUnits = this.getTaxonomicUnitsForNodeLabel(node.name);

          // Apply @id and @type to each taxonomic unit.
          let countTaxonomicUnits = 0;
          nodeAsJSONLD.representsTaxonomicUnits.forEach((tunitToChange) => {
            const tunit = tunitToChange;

            tunit['@id'] = `${nodeURI}_taxonomicunit${countTaxonomicUnits}`;
            tunit['@type'] = 'http://purl.obolibrary.org/obo/CDAO_0000138';
            countTaxonomicUnits += 1;
          });
        }

        // Add references to parents and siblings.
        if (parentCount !== undefined) {
          const parentURI = `${baseURI}_node${parentCount}`;
          nodeAsJSONLD.parent = parentURI;

          // Update list of nodes by parent IDs.
          if (!hasOwnProperty(nodeIdsByParentId, parentURI)) {
            nodeIdsByParentId[parentURI] = new Set();
          }
          nodeIdsByParentId[parentURI].add(nodeURI);
        }

        // Add nodeAsJSONLD to list
        if (hasOwnProperty(nodesById, nodeURI)) {
          throw new Error('Error in programming: duplicate node URI generated');
        }
        nodesById[nodeURI] = nodeAsJSONLD;
        nodes.push(nodeAsJSONLD);
      });
    }

    // Go through nodes again and set children and sibling relationships.
    Object.keys(nodeIdsByParentId).forEach((parentId) => {
      // What are the children of this parentId?
      const childrenIDs = Array.from(nodeIdsByParentId[parentId]);
      const children = childrenIDs.map(childId => nodesById[childId]);

      // Is this the root node?
      if (hasOwnProperty(nodesById, parentId)) {
        const parent = nodesById[parentId];
        parent.children = childrenIDs;
      }

      children.forEach((child) => {
        const childToModify = child;
        // Add all other sibling to node.siblings, but don't add this node itself!
        childToModify.siblings = childrenIDs.filter(childId => childId !== child['@id']);
      });
    });

    return nodes;
  }
}

/* Phyloreference wrapper */

// We need some OWL constants for this.
const CDAO_HAS_CHILD = 'obo:CDAO_0000149';
const CDAO_HAS_DESCENDANT = 'obo:CDAO_0000174';
const PHYLOREF_HAS_SIBLING = 'phyloref:has_Sibling';
const PHYLOREFERENCE_TEST_CASE = 'testcase:PhyloreferenceTestCase';
const PHYLOREFERENCE_PHYLOGENY = 'testcase:PhyloreferenceTestPhylogeny';
const TESTCASE_SPECIFIER = 'testcase:Specifier';

// eslint-disable-next-line no-unused-vars
class PhylorefWrapper {
  // Wraps a phyloreference in a PHYX model.

  constructor(phyloref) {
    // Wraps the provided phyloreference
    this.phyloref = phyloref;
  }

  get label() {
    // Return a label for this phyloreference.
    if (hasOwnProperty(this.phyloref, 'label')) return this.phyloref.label;
    if (hasOwnProperty(this.phyloref, 'labels') && this.phyloref.labels.length > 0) return this.phyloref.labels[0];
    if (hasOwnProperty(this.phyloref, 'title')) return this.phyloref.title;

    return undefined;
  }

  get specifiers() {
    // Returns a list of all specifiers by combining the internal and external
    // specifiers into a single list, with internal specifiers before
    // external specifiers.
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
      // To set a specifier to 'Internal', we might need to delete it from the
      // list of external specifiers first.
      index = this.phyloref.externalSpecifiers.indexOf(specifier);
      if (index !== -1) this.phyloref.externalSpecifiers.splice(index, 1);

      // Don't add it to the list of internal specifiers if it's already there.
      if (!this.phyloref.internalSpecifiers.includes(specifier)) {
        this.phyloref.internalSpecifiers.unshift(specifier);
      }
    } else if (specifierType === 'External') {
      // To set a specifier to 'External', we might need to delete it from the
      // list of internal specifiers first.
      index = this.phyloref.internalSpecifiers.indexOf(specifier);
      if (index !== -1) this.phyloref.internalSpecifiers.splice(index, 1);

      // Don't add it to the list of internal specifiers if it's already there.
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
    //
    // This logically belongs in PhylorefWrapper, but we don't actually need to
    // know the phyloreference to figure out the specifier label, which is why
    // this is a static method.

    // Is this specifier even non-null?
    if (specifier === undefined) return undefined;
    if (specifier === null) return undefined;

    // Maybe there is a label or description right there?
    if (hasOwnProperty(specifier, 'label')) return specifier.label;
    if (hasOwnProperty(specifier, 'description')) return specifier.description;

    // Look at the individual taxonomic units.
    if (hasOwnProperty(specifier, 'referencesTaxonomicUnits')) {
      const labels = specifier.referencesTaxonomicUnits
        .map(tu => new TaxonomicUnitWrapper(tu).label)
        .filter(label => (label !== undefined));
      if (labels.length > 0) return labels.join('; ');
    }

    // No idea!
    return undefined;
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

  static getStatusCURIEsInEnglish() {
    // Return dictionary of all phyloref statuses in English
    return {
      'pso:draft': 'Draft',
      'pso:final-draft': 'Final draft',
      'pso:under-review': 'Under review',
      'pso:submitted': 'Tested',
      'pso:published': 'Published',
      'pso:retracted-from-publication': 'Retracted',
    };
  }

  getCurrentStatus() {
    // Return a result object that contains:
    //  - status: phyloreference status as a short URI (CURIE)
    //  - statusInEnglish: an English representation of the phyloref status
    //  - intervalStart: the start of the interval
    //  - intervalEnd: the end of the interval

    if (
      hasOwnProperty(this.phyloref, 'pso:holdsStatusInTime') &&
      Array.isArray(this.phyloref['pso:holdsStatusInTime']) &&
      this.phyloref['pso:holdsStatusInTime'].length > 0
    ) {
      // If we have any pso:holdsStatusInTime entries, pick the first one and
      // extract the CURIE and time interval information from it.
      const lastStatusInTime = this.phyloref['pso:holdsStatusInTime'][this.phyloref['pso:holdsStatusInTime'].length - 1];
      const statusCURIE = lastStatusInTime['pso:withStatus']['@id'];

      // Look for time interval information
      let intervalStart;
      let intervalEnd;

      if (hasOwnProperty(lastStatusInTime, 'tvc:atTime')) {
        const atTime = lastStatusInTime['tvc:atTime'];
        if (hasOwnProperty(atTime, 'timeinterval:hasIntervalStartDate')) intervalStart = atTime['timeinterval:hasIntervalStartDate'];
        if (hasOwnProperty(atTime, 'timeinterval:hasIntervalEndDate')) intervalEnd = atTime['timeinterval:hasIntervalEndDate'];
      }

      // Return result object
      return {
        statusCURIE,
        statusInEnglish: PhylorefWrapper.getStatusCURIEsInEnglish()[statusCURIE],
        intervalStart,
        intervalEnd,
      };
    }

    // If we couldn't figure out a status for this phyloref, assume it's a draft.
    return {
      statusCURIE: 'pso:draft',
      statusInEnglish: PhylorefWrapper.getStatusCURIEsInEnglish()['pso:draft'],
    };
  }

  getStatusChanges() {
    // Return a list of status changes for a particular phyloreference
    if (hasOwnProperty(this.phyloref, 'pso:holdsStatusInTime')) {
      return this.phyloref['pso:holdsStatusInTime'].map((entry) => {
        const result = {};

        // Create a statusCURIE convenience field.
        if (hasOwnProperty(entry, 'pso:withStatus')) {
          result.statusCURIE = entry['pso:withStatus']['@id'];
          result.statusInEnglish = PhylorefWrapper.getStatusCURIEsInEnglish()[result.statusCURIE];
        }

        // Create intervalStart/intervalEnd convenient fields
        if (hasOwnProperty(entry, 'tvc:atTime')) {
          const atTime = entry['tvc:atTime'];
          if (hasOwnProperty(atTime, 'timeinterval:hasIntervalStartDate')) {
            result.intervalStart = atTime['timeinterval:hasIntervalStartDate'];
            result.intervalStartAsCalendar = moment(result.intervalStart).calendar();
          }

          if (hasOwnProperty(atTime, 'timeinterval:hasIntervalEndDate')) {
            result.intervalEnd = atTime['timeinterval:hasIntervalEndDate'];
            result.intervalEndAsCalendar = moment(result.intervalEnd).calendar();
          }
        }

        return result;
      });
    }

    // No changes? Return an empty list.
    return [];
  }

  setStatus(status) {
    // Set the status of a phyloreference
    //
    // Check whether we have a valid status CURIE.
    if (!hasOwnProperty(PhylorefWrapper.getStatusCURIEsInEnglish(), status)) {
      throw new TypeError(`setStatus() called with invalid status CURIE '${status}'`);
    }

    // See if we can end the previous interval.
    const currentTime = new Date(Date.now()).toISOString();

    if (!hasOwnProperty(this.phyloref, 'pso:holdsStatusInTime')) {
      Vue.set(this.phyloref, 'pso:holdsStatusInTime', []);
    }

    // Check to see if there's a previous time interval we should end.
    if (
      Array.isArray(this.phyloref['pso:holdsStatusInTime']) &&
      this.phyloref['pso:holdsStatusInTime'].length > 0
    ) {
      const lastStatusInTime = this.phyloref['pso:holdsStatusInTime'][this.phyloref['pso:holdsStatusInTime'].length - 1];

      if (!hasOwnProperty(lastStatusInTime, 'tvc:atTime')) Vue.set(lastStatusInTime, 'tvc:atTime', {});
      if (!hasOwnProperty(lastStatusInTime['tvc:atTime'], 'timeinterval:hasIntervalEndDate')) {
        // If the last time entry doesn't already have an interval end date, set it to now.
        lastStatusInTime['tvc:atTime']['timeinterval:hasIntervalEndDate'] = currentTime;
      }
    }

    // Create new entry.
    this.phyloref['pso:holdsStatusInTime'].push({
      '@type': 'http://purl.org/spar/pso/StatusInTime',
      'pso:withStatus': { '@id': status },
      'tvc:atTime': {
        'timeinterval:hasIntervalStartDate': currentTime,
      },
    });
  }

  exportAsJSONLD(phylorefURI) {
    // Keep all currently extant data.
    // - baseURI: the base URI for this phyloreference
    const phylorefAsJSONLD = JSON.parse(JSON.stringify(this.phyloref));

    // Set the @id and @type.
    phylorefAsJSONLD['@id'] = phylorefURI;
    phylorefAsJSONLD['@type'] = [
      // These classes are phyloreferences, and so should be classified as such.
      'phyloref:Phyloreference',

      // Since we're writing this in RDF, just adding a '@type' of
      // phyloref:Phyloreference would imply that phylorefURI is a named
      // individual of class phyloref:Phyloreference. We need to explicitly
      // let OWL know that this phylorefURI is an owl:Class.
      //
      // (This is implied by some of the properties that we apply to phylorefURI,
      // such as by the domain of owl:equivalentClass. But it's nice to make that
      // explicit as well!)
      'owl:Class',
    ];

    // What if we're missing either internal or external specifiers?
    if (!hasOwnProperty(phylorefAsJSONLD, 'internalSpecifiers')) {
      phylorefAsJSONLD.internalSpecifiers = [];
    }

    if (!hasOwnProperty(phylorefAsJSONLD, 'externalSpecifiers')) {
      phylorefAsJSONLD.externalSpecifiers = [];
    }

    // Add identifiers for each internal specifier.
    let internalSpecifierCount = 0;
    phylorefAsJSONLD.internalSpecifiers.forEach((internalSpecifierToChange) => {
      internalSpecifierCount += 1;

      const internalSpecifier = internalSpecifierToChange;
      const specifierId = `${phylorefURI}_specifier_internal${internalSpecifierCount}`;

      internalSpecifier['@id'] = specifierId;
      internalSpecifier['@type'] = [
        TESTCASE_SPECIFIER,
      ];

      // Add identifiers to all taxonomic units.
      let countTaxonomicUnits = 0;
      if (hasOwnProperty(internalSpecifier, 'referencesTaxonomicUnits')) {
        internalSpecifier.referencesTaxonomicUnits.forEach((tunitToChange) => {
          const tunit = tunitToChange;

          tunit['@id'] = `${specifierId}_tunit${countTaxonomicUnits}`;
          tunit['@type'] = 'http://purl.obolibrary.org/obo/CDAO_0000138';
          countTaxonomicUnits += 1;
        });
      }
    });

    // Add identifiers for each external specifier.
    let externalSpecifierCount = 0;
    phylorefAsJSONLD.externalSpecifiers.forEach((externalSpecifierToChange) => {
      externalSpecifierCount += 1;

      const externalSpecifier = externalSpecifierToChange;
      const specifierId = `${phylorefURI}_specifier_external${externalSpecifierCount}`;

      externalSpecifier['@id'] = specifierId;
      externalSpecifier['@type'] = [
        TESTCASE_SPECIFIER,
      ];

      // Add identifiers to all taxonomic units.
      let countTaxonomicUnits = 0;
      if (hasOwnProperty(externalSpecifier, 'referencesTaxonomicUnits')) {
        externalSpecifier.referencesTaxonomicUnits.forEach((tunitToChange) => {
          const tunit = tunitToChange;

          tunit['@id'] = `${specifierId}_tunit${countTaxonomicUnits}`;
          tunit['@type'] = 'http://purl.obolibrary.org/obo/CDAO_0000138';
          countTaxonomicUnits += 1;
        });
      }
    });

    // For historical reasons, the Clade Ontology uses 'hasInternalSpecifier' to
    // store the specifiers as OWL classes and 'internalSpecifiers' to store them
    // as RDF annotations. We simplify that here by duplicating them here, but
    // this should really be fixed in the Clade Ontology and in phyx.json.
    phylorefAsJSONLD.hasInternalSpecifier = phylorefAsJSONLD.internalSpecifiers;
    phylorefAsJSONLD.hasExternalSpecifier = phylorefAsJSONLD.externalSpecifiers;

    if (internalSpecifierCount === 0 && externalSpecifierCount === 0) {
      phylorefAsJSONLD.malformedPhyloreference = 'No specifiers provided';
    } else if (externalSpecifierCount > 1) {
      phylorefAsJSONLD.malformedPhyloreference = 'Multiple external specifiers are not yet supported';
    } else if (internalSpecifierCount === 1 && externalSpecifierCount === 0) {
      phylorefAsJSONLD.malformedPhyloreference = 'Only a single internal specifier was provided';
    } else if (externalSpecifierCount === 0) {
      // This phyloreference is made up entirely of internal specifiers.

      // We can write this in an accumulative manner by creating class expressions
      // in the form:
      //  mrca(mrca(mrca(node1, node2), node3), node4)

      // We could write this as a single giant expression, but this tends to
      // slow down the reasoner dramatically. So instead, we break it up into a
      // series of "additional classes", each of which represents a part of the
      // overall expression.
      phylorefAsJSONLD.hasAdditionalClass = [];

      let equivalentClassAccumulator = PhylorefWrapper.getClassExpressionForMRCA(
        phylorefURI,
        phylorefAsJSONLD.hasAdditionalClass,
        phylorefAsJSONLD.internalSpecifiers[0],
        phylorefAsJSONLD.internalSpecifiers[1],
      );

      for (let index = 2; index < internalSpecifierCount; index += 1) {
        equivalentClassAccumulator = PhylorefWrapper.getClassExpressionForMRCA(
          phylorefURI,
          phylorefAsJSONLD.hasAdditionalClass,
          equivalentClassAccumulator,
          phylorefAsJSONLD.internalSpecifiers[index],
        );
      }

      phylorefAsJSONLD.equivalentClass = equivalentClassAccumulator;
    } else {
      // This phyloreference is made up of one external specifier and some number
      // of internal specifiers.

      const internalSpecifierRestrictions = phylorefAsJSONLD.internalSpecifiers
        .map(specifier => PhylorefWrapper
          .wrapInternalOWLRestriction(PhylorefWrapper.getOWLRestrictionForSpecifier(specifier)));

      const externalSpecifierRestrictions = phylorefAsJSONLD.externalSpecifiers
        .map(specifier => PhylorefWrapper
          .wrapExternalOWLRestriction(PhylorefWrapper.getOWLRestrictionForSpecifier(specifier)));

      phylorefAsJSONLD.equivalentClass = {
        '@type': 'owl:Class',
        intersectionOf: internalSpecifierRestrictions.concat(externalSpecifierRestrictions),
      };
    }

    return phylorefAsJSONLD;
  }

  static getOWLRestrictionForSpecifier(specifier) {
    // Return an OWL restriction corresponding to a specifier.
    return {
      '@type': 'owl:Restriction',
      onProperty: 'testcase:matches_specifier',
      hasValue: {
        '@id': specifier['@id'],
      },
    };
  }

  static wrapInternalOWLRestriction(restriction) {
    // Wraps a restriction to act as an internal specifier.
    // Mainly, we just need to extend the restriction to match:
    //  restriction or cdao:has_Descendant some restriction
    return {
      '@type': 'owl:Restriction',
      unionOf: [
        restriction,
        {
          '@type': 'owl:Restriction',
          onProperty: CDAO_HAS_DESCENDANT,
          someValuesFrom: restriction,
        },
      ],
    };
  }

  static wrapExternalOWLRestriction(restriction) {
    // Wraps a restriction to act as an external specifier.
    // This needs to match:
    //  cdao:has_Sibling some (restriction or cdao:has_Descendant some restriction)
    // Since that second part is just an internal specifier restriction, we can
    // incorporate that in here.
    return {
      '@type': 'owl:Restriction',
      onProperty: PHYLOREF_HAS_SIBLING,
      someValuesFrom: PhylorefWrapper.wrapInternalOWLRestriction(restriction),
    };
  }

  static getClassExpressionForMRCA(baseURI, additionalClasses, specifier1, specifier2) {
    // Create an OWL restriction for the most recent common ancestor (MRCA)
    // of the nodes matched by two specifiers.
    const additionalClassesIds = new Set(additionalClasses.map(cl => cl['@id']));

    // Specifiers might be either a real specifier or an additional class.
    // We can check their @ids here and translate specifiers into class expressions.
    let owlRestriction1;
    if (additionalClassesIds.has(specifier1['@id'])) {
      owlRestriction1 = specifier1;
    } else {
      owlRestriction1 = PhylorefWrapper.getOWLRestrictionForSpecifier(specifier1);
    }

    let owlRestriction2;
    if (additionalClassesIds.has(specifier2['@id'])) {
      owlRestriction2 = specifier2;
    } else {
      owlRestriction2 = PhylorefWrapper.getOWLRestrictionForSpecifier(specifier2);
    }

    // Construct OWL expression.
    const mrcaAsOWL = {
      '@type': 'owl:Class',
      unionOf: [
        {
          // What if specifier2 is a descendant of specifier1? If so, the MRCA
          // is specifier1!
          '@type': 'owl:Class',
          intersectionOf: [
            owlRestriction1,
            {
              '@type': 'owl:Restriction',
              onProperty: CDAO_HAS_DESCENDANT,
              someValuesFrom: owlRestriction2,
            },
          ],
        },
        {
          // What if specifier1 is a descendant of specifier2? If so, the MRCA
          // is specifier2!
          '@type': 'owl:Class',
          intersectionOf: [
            owlRestriction2,
            {
              '@type': 'owl:Restriction',
              onProperty: CDAO_HAS_DESCENDANT,
              someValuesFrom: owlRestriction1,
            },
          ],
        },
        {
          // If neither specifier is a descendant of the other, we can use our
          // standard formula.
          '@type': 'owl:Class',
          intersectionOf: [{
            '@type': 'owl:Restriction',
            onProperty: CDAO_HAS_CHILD,
            someValuesFrom: {
              '@type': 'owl:Class',
              intersectionOf: [
                PhylorefWrapper.wrapInternalOWLRestriction(owlRestriction1),
                PhylorefWrapper.wrapExternalOWLRestriction(owlRestriction2),
              ],
            },
          }, {
            '@type': 'owl:Restriction',
            onProperty: CDAO_HAS_CHILD,
            someValuesFrom: {
              '@type': 'owl:Class',
              intersectionOf: [
                PhylorefWrapper.wrapInternalOWLRestriction(owlRestriction2),
                PhylorefWrapper.wrapExternalOWLRestriction(owlRestriction1),
              ],
            },
          }],
        },
      ],
    };

    // Instead of building a single, large, complex expression, reasoners appear
    // to prefer smaller expressions for classes that are assembled together.
    // To help with that, we'll store the class expression in the additionalClasses
    // list, and return a reference to this class.
    const additionalClassId = `${baseURI}_additional${additionalClasses.length}`;
    additionalClasses.push({
      '@id': additionalClassId,
      '@type': 'owl:Class',
      equivalentClass: mrcaAsOWL,
    });

    return { '@id': additionalClassId };
  }
}

/* PHYX file wrapper */

// eslint-disable-next-line no-unused-vars
class PHYXWrapper {
  // Wraps an entire PHYX document.

  constructor(phyx) {
    // Wraps an entire PHYX document.
    this.phyx = phyx;
  }

  static get BASE_URI() {
    // Returns the default base URI for PHYX documents in JSON-LD.
    return '';
  }

  static getBaseURIForPhyloref(phylorefCount) {
    // Return the base URI for a phyloreference based on its index.
    return `${PHYXWrapper.BASE_URI}#phyloref${phylorefCount}`;
  }

  static getBaseURIForPhylogeny(phylogenyCount) {
    // Return the base URI for phylogenies based on its index.
    return `${PHYXWrapper.BASE_URI}#phylogeny${phylogenyCount}`;
  }

  static getBaseURIForTUMatch(countTaxonomicUnitMatches) {
    // Return the base URI for taxonomic unit matches.
    return `${PHYXWrapper.BASE_URI}#taxonomic_unit_match${countTaxonomicUnitMatches}`;
  }

  asJSONLD() {
    // Export this PHYX document as a JSON-LD document. This replicates what
    // phyx2owl.py does in the Clade Ontology.
    //
    // The document is mostly in JSON-LD already, except for two important
    // things:
    //  1. We have to convert all phylogenies into a series of statements
    //     relating to the nodes inside these phylogenies.
    //  2. We have to convert phylogenies into OWL restrictions.
    //  3. Insert all matches between taxonomic units in this file.
    //
    const jsonld = jQuery.extend(true, {}, this.phyx);

    // Add descriptions for individual nodes in each phylogeny.
    if (hasOwnProperty(jsonld, 'phylogenies')) {
      let countPhylogeny = 0;
      jsonld.phylogenies.forEach((phylogenyToChange) => {
        const phylogeny = phylogenyToChange;

        // Set name and class for phylogeny.
        phylogeny['@id'] = PHYXWrapper.getBaseURIForPhylogeny(countPhylogeny);
        phylogeny['@type'] = PHYLOREFERENCE_PHYLOGENY;

        // Extract nodes from phylogeny.
        const wrapper = new PhylogenyWrapper(phylogeny);
        countPhylogeny += 1;

        // Translate nodes into JSON-LD objects.
        const nodes = wrapper.getNodesAsJSONLD(PHYXWrapper.getBaseURIForPhylogeny(countPhylogeny));

        phylogeny.nodes = nodes;
        if (nodes.length > 0) {
          // We don't have a better way to identify the root node, so we just
          // default to the first one.
          [phylogeny.hasRootNode] = nodes;
        }
      });
    }

    // Convert phyloreferences into an OWL class restriction
    if (hasOwnProperty(jsonld, 'phylorefs')) {
      let countPhyloref = 0;
      jsonld.phylorefs = jsonld.phylorefs.map((phyloref) => {
        countPhyloref += 1;
        return new PhylorefWrapper(phyloref)
          .exportAsJSONLD(PHYXWrapper.getBaseURIForPhyloref(countPhyloref));
      });
    }

    // Match all specifiers with nodes.
    if (hasOwnProperty(jsonld, 'phylorefs') && hasOwnProperty(jsonld, 'phylogenies')) {
      jsonld.hasTaxonomicUnitMatches = [];

      // Used to create unique identifiers for each taxonomic unit match.
      let countTaxonomicUnitMatches = 0;

      jsonld.phylorefs.forEach((phylorefToChange) => {
        const phyloref = phylorefToChange;
        let specifiers = [];

        if (hasOwnProperty(phyloref, 'internalSpecifiers')) {
          specifiers = specifiers.concat(phyloref.internalSpecifiers);
        }

        if (hasOwnProperty(phyloref, 'externalSpecifiers')) {
          specifiers = specifiers.concat(phyloref.externalSpecifiers);
        }

        specifiers.forEach((specifier) => {
          if (!hasOwnProperty(specifier, 'referencesTaxonomicUnits')) return;
          const specifierTUs = specifier.referencesTaxonomicUnits;
          let nodesMatchedCount = 0;

          jsonld.phylogenies.forEach((phylogenyToChange) => {
            const phylogeny = phylogenyToChange;

            specifierTUs.forEach((specifierTU) => {
              phylogeny.nodes.forEach((node) => {
                if (!hasOwnProperty(node, 'representsTaxonomicUnits')) return;
                const nodeTUs = node.representsTaxonomicUnits;

                nodeTUs.forEach((nodeTU) => {
                  const matcher = new TaxonomicUnitMatcher(specifierTU, nodeTU);
                  if (matcher.matched) {
                    const tuMatchAsJSONLD =
                      matcher.asJSON(PHYXWrapper.getBaseURIForTUMatch(countTaxonomicUnitMatches));
                    jsonld.hasTaxonomicUnitMatches.push(tuMatchAsJSONLD);
                    nodesMatchedCount += 1;
                    countTaxonomicUnitMatches += 1;
                  }
                });
              });
            });
          });

          if (nodesMatchedCount === 0) {
            // No nodes matched? Record this as an unmatched specifier.
            if (!hasOwnProperty(phyloref, 'hasUnmatchedSpecifiers')) phyloref.hasUnmatchedSpecifiers = [];
            phyloref.hasUnmatchedSpecifiers.push(specifier);
          }
        });
      });
    }

    // Finally, add the base URI as an ontology.
    jsonld['@id'] = PHYXWrapper.BASE_URI;
    jsonld['@type'] = [PHYLOREFERENCE_TEST_CASE, 'owl:Ontology'];
    jsonld['owl:imports'] = [
      'http://raw.githubusercontent.com/phyloref/curation-workflow/develop/ontologies/phyloref_testcase.owl',
      // - Will become 'http://vocab.phyloref.org/phyloref/testcase.owl'
      'http://ontology.phyloref.org/phyloref.owl',
      // - The Phyloreferencing ontology.
      'http://purl.obolibrary.org/obo/bco.owl',
      // - Contains OWL definitions for Darwin Core terms
    ];

    // If the '@context' is missing, add it here.
    if (!hasOwnProperty(jsonld, '@context')) {
      jsonld['@context'] = 'http://www.phyloref.org/curation-tool/json/phyx.json';
    }

    return jsonld;
  }
}

/* Exports */
if (!hasOwnProperty(this, 'window')) {
  module.exports = {
    ScientificNameWrapper,
    SpecimenWrapper,
    TaxonomicUnitWrapper,
    TaxonomicUnitMatcher,
    PhylogenyWrapper,
    PhylorefWrapper,
    PHYXWrapper,
    phyxCacheManager,
  };
}
