/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// GLOBAL VARIABLES

// Tell ESLint about globals imported in the HTML page.
/* global Vue */ // From https://vuejs.org/
/* global _ */ // From http://underscorejs.org/
/* global d3 */ // From https://d3js.org/
/* global moment */ // From https://momentjs.com/

// List of example files to provide in the "Examples" dropdown.
const examplePHYXURLs = [
  {
    url: 'examples/fisher_et_al_2007.json',
    title: 'Fisher et al, 2007',
  },
  {
    url: 'examples/hillis_and_wilcox_2005.json',
    title: 'Hillis and Wilcox, 2005',
  },
  {
    url: 'examples/brochu_2003.json',
    title: 'Brochu 2003',
  },
];

// Helper methods for this library.

/**
 * hasProperty(obj, propName)
 *
 * Returns true if object 'obj' has property 'propName'.
 */
function hasProperty(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
}

// The following functions test whether a pair of taxonomic units match
// given certain properties. Eventually, we will encapsulate taxonomic units
// into their own Javascript class; once we do, these functions will become
// methods in that class.

/**
 * testWhetherTUnitsMatchByExternalReferences(tunit1, tunit2)
 *
 * Test whether two Tunits have matching external references.
 */
function testWhetherTUnitsMatchByExternalReferences(tunit1, tunit2) {
  if (tunit1 === undefined || tunit2 === undefined) return false;
  if (hasProperty(tunit1, 'externalReferences') && hasProperty(tunit2, 'externalReferences')) {
    // Each external reference is a URL as a string. We will lowercase it,
    // but do no other transformation.
    return tunit1.externalReferences.some(extref1 =>
      tunit2.externalReferences.some(extref2 =>
        (
          // Make sure that the external reference isn't blank
          extref1.trim() !== '' &&

          // And that it is identical after trimming
          extref1.toLowerCase().trim() === extref2.toLowerCase().trim()
        )));
  }

  return false;
}

// Methods for parsing scientific names. Note that these functions will
// eventually be reorganized into a separate class.

/**
 * getScientificNameComponents(scname)
 *
 * Return the components of a scientific name by splitting its
 * scientificName field using spaces.
 */
function getScientificNameComponents(scname) {
  if (!this.hasProperty(scname, 'scientificName')) return [];
  return scname.scientificName.split(/\s+/);
}

/**
 * getGenus(scname)
 *
 * Guess the genus name of a scientific name by using its first component.
 */
function getGenus(scname) {
  const comps = getScientificNameComponents(scname);
  if (comps.length >= 1) return comps[0];
  return undefined;
}

/**
 * getSpecificEpithet(scname)
 *
 * Get the specific epithet name of a scientific name by using its
 * second component.
 */
function getSpecificEpithet(scname) {
  const comps = getScientificNameComponents(scname);
  if (comps.length >= 2) return comps[1];
  return undefined;
}

/**
 * getBinomialName(scname)
 *
 * Get the binomial name of a scientific name by combining its
 * first and second components.
 */
function getBinomialName(scname) {
  const genus = getGenus(scname);
  const specificEpithet = getSpecificEpithet(scname);

  if (genus !== undefined && specificEpithet !== undefined) return `${genus} ${specificEpithet}`;
  return undefined;
}

/**
 * testWhetherTUnitsMatchByBinomialName(scname1, scname2)
 *
 * Test whether two scientific names match on the basis of their binomial names.
 */
function testWhetherScientificNamesMatchByBinomialName(scname1, scname2) {
  // Step 1. Try matching by explicit binomial name, if one is available.
  if (hasProperty(scname1, 'binomialName') && hasProperty(scname2, 'binomialName')) {
    if (scname1.binomialName.trim() !== '' && scname1.binomialName.toLowerCase().trim() === scname2.binomialName.toLowerCase().trim()) { return true; }
  }

  // Step 2. Otherwise, try to extract the binomial name from the scientificName
  // and compare those.
  const binomial1 = getBinomialName(scname1);
  const binomial2 = getBinomialName(scname2);

  if (binomial1 !== undefined && binomial2 !== undefined && binomial1.trim() !== '' && binomial1.trim() === binomial2.trim()) { return true; }

  return false;
}

/**
 * testWhetherTUnitsMatchByBinomialName(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their binomial names.
 */
function testWhetherTUnitsMatchByBinomialName(tunit1, tunit2) {
  if (tunit1 === undefined || tunit2 === undefined) return false;
  if (hasProperty(tunit1, 'scientificNames') && hasProperty(tunit2, 'scientificNames')) {
    // Each external reference is a URL as a string.
    return tunit1.scientificNames.some(scname1 =>
      tunit2.scientificNames
        .some(scname2 => testWhetherScientificNamesMatchByBinomialName(scname1, scname2)));
  }

  return false;
}

/**
 * getSpecimenIdentifierAsURN(specimen)
 *
 * Given a specimen, return a specimen identifier as a URN in the form:
 *   "urn:catalog:" + institutionCode (if present) + ':' +
 *      collectionCode (if present) + ':' + catalogNumber (if present)
 */
function getSpecimenIdentifierAsURN(specimen) {
  if (specimen === undefined) return undefined;

  // Does it have an occurrenceID?
  if (hasProperty(specimen, 'occurrenceID') && specimen.occurrenceID.trim() !== '') return specimen.occurrenceID.trim();

  // Does it have a catalogNumber? We might need an institutionCode and a collectionCode as well.
  if (hasProperty(specimen, 'catalogNumber')) {
    if (hasProperty(specimen, 'institutionCode')) {
      if (hasProperty(specimen, 'collectionCode')) {
        return `urn:catalog:${specimen.institutionCode.trim()}:${specimen.collectionCode.trim()}:${specimen.catalogNumber.trim()}`;
      }
      return `urn:catalog:${specimen.institutionCode.trim()}::${specimen.catalogNumber.trim()}`;
    }
    if (hasProperty(specimen, 'collectionCode')) {
      return `urn:catalog::${specimen.collectionCode.trim()}:${specimen.catalogNumber.trim()}`;
    }
    return `urn:catalog:::${specimen.catalogNumber.trim()}`;
  }

  // None of our specimen identifier schemes worked.
  return undefined;
}

/**
 * testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their specimen identifiers.
 */
function testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2) {
  if (tunit1 === undefined || tunit2 === undefined) return false;
  if (hasProperty(tunit1, 'includesSpecimens') && hasProperty(tunit2, 'includesSpecimens')) {
    // Convert specimen identifiers (if present) into a standard format and compare those.
    return tunit1.includesSpecimens.some(specimen1 =>
      tunit2.includesSpecimens.some((specimen2) => {
        const specimenURN1 = getSpecimenIdentifierAsURN(specimen1);
        const specimenURN2 = getSpecimenIdentifierAsURN(specimen2);

        return specimenURN1 === specimenURN2;
      }));
  }

  return false;
}

/**
 * getTaxonomicUnitsFromNodeLabel(nodeLabel)
 *
 * Given a node label, attempt to parse it as a scientific name.
 * Returns a list of taxonomic units.
 */
function getTaxonomicUnitsFromNodeLabel(nodeLabel) {
  if (nodeLabel === undefined || nodeLabel === null) return [];

  // Check if the label starts with a binomial name.
  const results = /^([A-Z][a-z]+)[\s_]([a-z-]+)(\b.*|\s.*|_.*)$/.exec(nodeLabel);
  if (results !== null) {
    // Add an extra space before the rest of the name if it exists
    let rest = results[3];
    if (rest !== undefined) rest = ` ${rest}`;

    // Return all the components of each name including binomial, genus and specificEpithet.
    return [{
      scientificNames: [{
        scientificName: `${results[1]} ${results[2]}${rest}`,
        binomialName: `${results[1]} ${results[2]}`,
        genus: results[1],
        specificEpithet: results[2],
      }],
    }];
  }

  // It may be a scientific name, but we don't know how to parse it as such.
  return [];
}

/**
 * identifyDOI(testcase)
 *
 * DOIs should be entered into their own 'doi' field. This method looks through
 * all possible places where a DOI might be entered -- including the 'url'
 * field -- and attempts to extract a DOI using the regular expression DOI_REGEX.
 *
 * @return The best guess DOI or undefined.
 */
function identifyDOI(testcaseToIdentify) {
  const testcase = testcaseToIdentify;
  const DOI_REGEX = /^https?:\/\/(?:dx\.)?doi\.org\/(.+?)[#/]?$/i;

  const possibilities = [];

  if (hasProperty(testcase, 'doi')) {
    possibilities.push(testcase.doi);
  }

  if (hasProperty(testcase, 'url')) {
    possibilities.push(testcase.url);
  }

  // Look for possible matches.
  const dois = possibilities
    // Try to find a DOI
    .map(possibility => DOI_REGEX.exec(possibility))
    // Restrict to possibilities in which the regex match was successful
    .filter(matches => matches);

  if (dois.length > 0) {
    // Retrieve the matched DOI -- it's the first group in the matched results.
    const [[, doi]] = dois;
    return doi;
  }

  // No matches found
  return undefined;
}

// Set up the Vue object which contains the entire model.
// This is used by Vue.js, and so should not be considered unused.
// eslint-disable-next-line no-unused-vars
const vm = new Vue({
  // The element to install Vue onto.
  el: '#app',

  // Filters to be used in the template.
  filters: {
    capitalize(value) {
      // Capitalize the input value.
      if (!value) return '';
      const valstr = value.toString();
      return valstr.charAt(0).toUpperCase() + valstr.slice(1);
    },
  },

  // The data, consisting of the model and UI elements.
  data: {
    // Constants: used during rendering.
    DOI_PREFIX: 'https://dx.doi.org/',

    // The main data model.
    testcase: {
      '@context': 'http://phyloref.org/curation-tool/json/phyx.json',
      doi: '',
      url: '',
      citation: '',
      phylogenies: [{}],
      phylorefs: [],
    },

    // A copy of the data model, used to test when the data model has been
    // modified.
    testcaseAsLoaded: {
      '@context': 'http://phyloref.org/curation-tool/json/phyx.json',
      doi: '',
      url: '',
      citation: '',
      phylogenies: [{}],
      phylorefs: [],
    },

    // UI elements.
    selectedPhyloref: undefined,
    selectedTUnitListContainer: undefined,
    selectedTUnit: undefined,

    // Phylogeny view modes
    editingNewickForPhylogeny: undefined,
    editingAnnotationsForPhylogeny: undefined,

    // Display the delete buttons on the specifiers.
    deletingSpecifiersMode: false,

    // Which phylogeny label is currently being edited?
    phylogenyDescriptionBeingEdited: undefined,

    // Display one of the two dropdown menus for the specifiers.
    dropdownTargetForSpecifier: 'none',

    // Example PHYX URLs to display
    examplePHYXURLs,
  },

  // Computed values inside the data model.
  computed: {
    modified() {
      // Return true if the testcase has been modified.
      if (this.testcaseAsLoaded === undefined) return false;

      // Make a deep comparison.
      return !_.isEqual(this.testcase, this.testcaseAsLoaded);
    },
    phyxAsJSON: {
      // Get or set the testcase as JSON text.
      get() {
        // Pretty print JSON with 4 spaces at the start of each line.
        return JSON.stringify(this.testcase, undefined, 4);
      },
      set(jsonText) {
        this.testcase = JSON.parse(jsonText);
      },
    },
    doiWithoutPrefix: {
      // Extract the DOI from the 'url'.
      get() {
        // Is there a DOI? If so, use that.
        if (this.hasProperty(this.testcase, 'doi') && this.testcase.doi !== '') {
          return this.testcase.doi;
        }

        // If not, look for a DOI among the 'url'.
        return identifyDOI(this.testcase);
      },
      set(newDOI) {
        // Set the DOI.
        this.testcase.doi = newDOI;
      },
    },
    doiAsURL() {
      // We compute this from testcase.doi, which should always be without
      // the prefix.
      return this.DOI_PREFIX + this.testcase.doi;
    },
  },

  // Methods for carrying out various tasks.
  methods: {
    // Helper methods.
    hasProperty(obj, propName) {
      // Returns true if object obj has a property named propName.
      return Object.prototype.hasOwnProperty.call(obj, propName);
    },
    openURL(url, target = '_blank') {
      // Open the specified URL.
      if (url === undefined || url === null) return;
      if (url === '') return;

      window.open(url, target);
    },
    createOrAppend(dict, key, value) {
      // A common case is where we need to append to an array for a key
      // in a dictionary, but we don't know if the key exists or not.
      // Furthermore, in order for Vue to track the new array, it needs
      // to be set using Vue.set. This method takes care of all of this.

      if (!(key in dict)) Vue.set(dict, key, []);
      dict[key].push(value);
      return dict;
    },
    alert(message) {
      // Display an error message to the user.
      // For the Curation Tool, just using window.alert() is adequate.
      // eslint-disable-next-line no-alert
      window.alert(message);
    },
    confirm(message, func) {
      // Confirm an action with the user, then execute it if confirmed.
      // For the Curation Tool, just using window.confirm() is adequate.
      // eslint-disable-next-line no-alert
      const result = window.confirm(message);

      if (result && func !== undefined) func();
      return result;
    },
    promptAndSetDict(message, dict, key) {
      // Prompt the user for a string, then set it in a dict.
      // For the Curation Tool, just using window.prompt() is adequate.
      let result;
      if (this.hasProperty(dict, key)) {
        // eslint-disable-next-line no-alert
        result = window.prompt(message, dict[key]);
      } else {
        // eslint-disable-next-line no-alert
        result = window.prompt(message);
      }

      if (result !== null) Vue.set(dict, key, result);
    },

    // Data model management methods.
    loadPHYXFromURL(url) {
      // Change the current PHYX to that in the provided URL.
      // Will ask the user to confirm before replacing it.

      $.getJSON(url, data => this.setPHYX(data)).fail((error) => {
        if (error.status === 200) {
          this.alert(`Could not load PHYX file '${url}': file malformed, see console for details.`);
        } else {
          this.alert(`Could not load PHYX file '${url}': server error ${error.status} ${error.statusText}`);
        }
        // throw new Error(`Could not load PHYX file ${url}: ${error}`);
      });
    },

    loadPHYXFromFileInputById(fileInputId) {
      // loadPHYXFromFileInput(fileInput)
      //
      // Load a JSON file from the local file system using FileReader. fileInput
      // needs to be an HTML element representing an <input type="file"> in which
      // the user has selected the local file they wish to load.
      //
      // This code is based on https://stackoverflow.com/a/21446426/27310

      if (typeof window.FileReader !== 'function') {
        this.alert('The FileReader API is not supported on this browser.');
        return;
      }

      const $fileInput = $(fileInputId);
      if (!$fileInput) {
        this.alert('Programmer error: No file input element specified.');
        return;
      }

      if (!$fileInput.prop('files')) {
        this.alert('File input element found, but files property missing: try another browser?');
        return;
      }

      if (!$fileInput.prop('files')[0]) {
        this.alert('Please select a file before attempting to load it.');
        return;
      }

      const [file] = $fileInput.prop('files');
      const fr = new FileReader();
      fr.onload = ((e) => {
        const lines = e.target.result;
        const testcase = JSON.parse(lines);
        this.setPHYX(testcase);
      });
      fr.readAsText(file);
    },

    setPHYX(testcaseToLoad) {
      // Updates the user interface to reflect the JSON document provided in 'testcase'.

      if (!this.closeCurrentStudy()) return;

      const testcase = testcaseToLoad;

      try {
        // Specifiers act weird unless every phyloreference has both
        // internalSpecifiers and externalSpecifiers set, even if they
        // are blank.
        if (!hasProperty(testcase, 'phylorefs')) testcase.phylorefs = [];
        testcase.phylorefs.forEach((p) => {
          const phyloref = p;

          if (!hasProperty(phyloref, 'internalSpecifiers')) phyloref.internalSpecifiers = [];
          if (!hasProperty(phyloref, 'externalSpecifiers')) phyloref.externalSpecifiers = [];
        });

        // Check for DOI in other fields if not provided explicitly.
        if (!hasProperty(testcase, 'doi') || testcase.doi === '') {
          testcase.doi = identifyDOI(testcase);
        }

        // Deep-copy the testcase into a 'testcaseAsLoaded' variable in our
        // model. We deep-compare this.testcase with this.testcaseAsLoaded to
        // determine if the loaded model has been modified.
        this.testcaseAsLoaded = jQuery.extend(true, {}, testcase);
        this.testcase = testcase;

        // Reset all UI selections.
        this.selectedPhyloref = undefined;
        this.selectedSpecifier = undefined;
        this.selectedTUnit = undefined;
      } catch (err) {
        throw new Error(`Error occurred while displaying new testcase: ${err}`);
      }
    },

    // User interface helper methods.
    closeCurrentStudy() {
      // Close the current study. If it has been modified,
      // warn the user before closing in order to allow changes to be
      // saved.

      if (this.modified) {
        return this.confirm('This study has been modified! Are you sure you want to close it?');
      }
      return true;
    },
    startTUnitEditorModal(type, label, tunitListContainer) {
      // Start a modal dialog box that allows the taxonomic units associated
      // with either a specifier or a node to be edited.
      //  - type: must be 'specifier' or 'node'
      //  - label: the label of the TUnit list container being edited.
      //      This is not currently used for any processing or filtering,
      //      but is used solely to let the user know what they are editing.
      //  - tunitListContainer: an object that has a 'referencesTaxonomicUnits'
      //      property (for specifiers) or 'representsTaxonomicUnits' property
      //      (for nodes), from which we can extract a list of taxonomic units.

      // Check that the list container is defined.
      if (tunitListContainer === null || tunitListContainer === undefined) {
        throw new Error('Tunit editor modal started with undefined or null taxonomic unit list container');
      }

      // Look for the taxonomic units depending on type.
      if (type === 'specifier') {
        // Specifiers store their taxonomic units in their
        // 'referencesTaxonomicUnits' property.

        // Specifiers store their tunit list in referencesTaxonomicUnits.
        if (!this.hasProperty(tunitListContainer, 'referencesTaxonomicUnits')) { Vue.set(tunitListContainer, 'referencesTaxonomicUnits', []); }

        this.selectedTUnitListContainer = {
          type: 'specifier',
          label,
          container: tunitListContainer,
          list: tunitListContainer.referencesTaxonomicUnits,
        };
      } else if (type === 'node') {
        // Nodes store their taxonomic units in their
        // 'representsTaxonomicUnits' property.

        if (!this.hasProperty(tunitListContainer, 'representsTaxonomicUnits')) { Vue.set(tunitListContainer, 'representsTaxonomicUnits', []); }

        this.selectedTUnitListContainer = {
          type: 'node',
          label,
          container: tunitListContainer,
          list: tunitListContainer.representsTaxonomicUnits,
        };
      } else {
        throw new Error(`Tunit editor modal started with invalid type: ${type}.`);
      }

      // If we don't have a first tunit, create an empty, blank one
      // so we don't have to display an empty website.
      if (this.selectedTUnitListContainer.list.length > 0) {
        // We have a first tunit, so select it!
        [this.selectedTUnit] = this.selectedTUnitListContainer.list;
      } else {
        // Specifier doesn't represent any taxonomic unit, but it's
        // bad UX to just display a blank screen. So let's create a
        // blank taxonomic unit to work with.
        const newTUnit = this.createEmptyTaxonomicUnit();
        this.selectedTUnitListContainer.list.push(newTUnit);
        this.selectedTUnit = newTUnit;
      }

      // Make the modal draggable and display it.
      $('.modal-dialog').draggable({
        handle: '.modal-header',
      });
      $('#tunit-editor-modal').modal();
    },
    closeTUnitEditorModal() {
      // Close the taxonomic unit editor modal.

      // We've set up a data-dismiss to do that, so we don't need to do
      // anything here, but the function is here in case we need it later.
    },

    // Methods for listing and modifying specifiers.
    getSpecifiers(phylorefWithSpecifiers) {
      // Combine the internal and external specifiers into a single list,
      // with internal specifiers before external specifiers.
      const phyloref = phylorefWithSpecifiers;

      if (!this.hasProperty(phyloref, 'internalSpecifiers')) phyloref.internalSpecifiers = [];
      if (!this.hasProperty(phyloref, 'externalSpecifiers')) phyloref.externalSpecifiers = [];

      let specifiers = phyloref.internalSpecifiers;
      specifiers = specifiers.concat(phyloref.externalSpecifiers);
      return specifiers;
    },
    getSpecifierType(phyloref, specifier) {
      // For a given specifier, return a string indicating whether it is
      // an 'Internal' or 'External' specifier.

      if (this.hasProperty(phyloref, 'internalSpecifiers') && phyloref.internalSpecifiers.includes(specifier)) return 'Internal';
      if (this.hasProperty(phyloref, 'externalSpecifiers') && phyloref.externalSpecifiers.includes(specifier)) return 'External';
      return 'Specifier';
    },
    setSpecifierType(phylorefWithSpecifiers, specifier, specifierType) {
      // Change the type of a given specifier. To do this, we first need
      // to determine if it was originally an internal or external
      // specifier, then move it into the other list.

      const phyloref = phylorefWithSpecifiers;

      if (!this.hasProperty(phyloref, 'internalSpecifiers')) phyloref.internalSpecifiers = [];
      if (!this.hasProperty(phyloref, 'externalSpecifiers')) phyloref.externalSpecifiers = [];

      let index;
      if (specifierType === 'Internal') {
        index = phyloref.externalSpecifiers.indexOf(specifier);
        if (index !== -1) { phyloref.externalSpecifiers.splice(index, 1); }

        if (!phyloref.internalSpecifiers.includes(specifier)) {
          phyloref.internalSpecifiers.unshift(specifier);
        }
      } else if (specifierType === 'External') {
        index = phyloref.internalSpecifiers.indexOf(specifier);
        if (index !== -1) {
          phyloref.internalSpecifiers.splice(index, 1);
        }

        if (!phyloref.externalSpecifiers.includes(specifier)) {
          phyloref.externalSpecifiers.unshift(specifier);
        }
      } else {
        // Neither internal nor external? Ignore.
      }
    },
    deleteSpecifier(phyloref, specifier) {
      // Since the user interface combines specifiers into a si**ngle list,
      // it doesn't remember if the specifier to be deleted is internal
      // or external. We delete the intended specifier from both arrays.

      if (this.hasProperty(phyloref, 'internalSpecifiers')) {
        const index = phyloref.internalSpecifiers.indexOf(specifier);
        if (index !== -1) phyloref.internalSpecifiers.splice(index, 1);
      }

      if (this.hasProperty(phyloref, 'externalSpecifiers')) {
        const index = phyloref.externalSpecifiers.indexOf(specifier);
        if (index !== -1) phyloref.externalSpecifiers.splice(index, 1);
      }
    },

    // Methods for building human-readable labels for model elements.
    getTaxonomicUnitLabel(tu) {
      // Try to determine the label of a taxonomic unit. This checks the
      // 'label' and 'description' properties, and then tries to create a
      // descriptive label by combining the scientific names, specimens
      // and external references of the taxonomic unit.
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
    },
    getSpecifierLabel(specifier) {
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
        const labels = specifier.referencesTaxonomicUnits.map(tu => this.getTaxonomicUnitLabel(tu));
        if (labels.length > 0) return labels.join('; ');
      }

      // No idea!
      return 'Unnamed specifier';
    },
    getPhylorefStatus(phyloref) {
      // Return a result object that contains:
      //  - status: phyloreference status as a short URI (CURIE)
      //  - statusInEnglish: an English representation of the phyloref status
      //  - intervalStart: the start of the interval
      //  - intervalEnd: the end of the interval

      if (
        this.hasProperty(phyloref, 'pso:holdsStatusInTime') &&
        Array.isArray(phyloref['pso:holdsStatusInTime']) &&
        phyloref['pso:holdsStatusInTime'].length > 0
      ) {
        // If we have any pso:holdsStatusInTime entries, pick the first one and
        // extract the CURIE and time interval information from it.
        const lastStatusInTime = phyloref['pso:holdsStatusInTime'][phyloref['pso:holdsStatusInTime'].length - 1];
        const statusCURIE = lastStatusInTime['pso:withStatus']['@id'];

        // Look for time interval information
        let intervalStart;
        let intervalEnd;

        if (this.hasProperty(lastStatusInTime, 'tvc:atTime')) {
          const atTime = lastStatusInTime['tvc:atTime'];
          if (this.hasProperty(atTime, 'timeinterval:hasIntervalStartDate')) intervalStart = atTime['timeinterval:hasIntervalStartDate'];
          if (this.hasProperty(atTime, 'timeinterval:hasIntervalEndDate')) intervalEnd = atTime['timeinterval:hasIntervalEndDate'];
        }

        // Return result object
        return {
          status: statusCURIE,
          statusInEnglish: this.getPhylorefStatusCURIEsInEnglish()[statusCURIE],
          intervalStart,
          intervalEnd,
        };
      }

      // If we couldn't figure out a status for this phyloref, assume it's a draft.
      return {
        status: 'pso:draft',
        statusInEnglish: this.getPhylorefStatusCURIEsInEnglish()['pso:draft'],
      };
    },
    getPhylorefStatusCURIEsInEnglish() {
      // Return dictionary of all phyloref statuses in English
      return {
        'pso:draft': 'Draft',
        'pso:final-draft': 'Final draft',
        'pso:under-review': 'Under review',
        'pso:submitted': 'Tested',
        'pso:published': 'Published',
        'pso:retracted-from-publication': 'Retracted',
      };
    },
    getPhylorefStatusChanges(phyloref) {
      // Return a list of status changes for a particular phyloreference
      if (this.hasProperty(phyloref, 'pso:holdsStatusInTime')) {
        return phyloref['pso:holdsStatusInTime'].map((entry) => {
          const result = {};

          // Create a statusCURIE convenience field.
          if (this.hasProperty(entry, 'pso:withStatus')) {
            result.statusCURIE = entry['pso:withStatus']['@id'];
            result.statusInEnglish = this.getPhylorefStatusCURIEsInEnglish()[result.statusCURIE];
          }

          // Create intervalStart/intervalEnd convenient fields
          if (this.hasProperty(entry, 'tvc:atTime')) {
            const atTime = entry['tvc:atTime'];
            if (this.hasProperty(atTime, 'timeinterval:hasIntervalStartDate')) {
              result.intervalStart = atTime['timeinterval:hasIntervalStartDate'];
              result.intervalStartAsCalendar = moment(result.intervalStart).calendar();
            }

            if (this.hasProperty(atTime, 'timeinterval:hasIntervalEndDate')) {
              result.intervalEnd = atTime['timeinterval:hasIntervalEndDate'];
              result.intervalEndAsCalendar = moment(result.intervalEnd).calendar();
            }
          }

          return result;
        });
      }

      // No changes? Return an empty list.
      return [];
    },
    setPhylorefStatus(phylorefToChange, status) {
      // Set the status of a phyloreference
      const phyloref = phylorefToChange;

      if (!this.hasProperty(this.getPhylorefStatusCURIEsInEnglish(), status)) {
        this.alert(`Status '${status}' is not a possible status for a Phyloreference`);
        return;
      }

      // See if we can end the previous interval.
      const currentTime = new Date(Date.now()).toISOString();

      if (!this.hasProperty(phyloref, 'pso:holdsStatusInTime')) Vue.set(phyloref, 'pso:holdsStatusInTime', []);

      // Check to see if there's a previous time interval we should end.
      if (
        Array.isArray(phyloref['pso:holdsStatusInTime']) &&
        phyloref['pso:holdsStatusInTime'].length > 0
      ) {
        const lastStatusInTime = phyloref['pso:holdsStatusInTime'][phyloref['pso:holdsStatusInTime'].length - 1];

        if (!this.hasProperty(lastStatusInTime, 'tvc:atTime')) Vue.set(lastStatusInTime, 'tvc:atTime', {});
        if (!this.hasProperty(lastStatusInTime['tvc:atTime'], 'timeinterval:hasIntervalEndDate')) {
          // If the last time entry doesn't already have an interval end date, set it to now.
          lastStatusInTime['tvc:atTime']['timeinterval:hasIntervalEndDate'] = currentTime;
        }
      }

      // Create new entry.
      phyloref['pso:holdsStatusInTime'].push({
        '@type': 'http://purl.org/spar/pso/StatusInTime',
        'pso:withStatus': { '@id': status },
        'tvc:atTime': {
          'timeinterval:hasIntervalStartDate': currentTime,
        },
      });
    },
    getPhylorefLabel(phyloref) {
      // Try to determine what the label of a particular phyloreference is,
      // or default to 'Phyloreference <count>'. This checks the 'label' and
      // 'title' properties, and truncates them to 50 characters.

      const phylorefIndex = this.testcase.phylorefs.indexOf(phyloref);
      let potentialLabel = `Phyloreference ${phylorefIndex + 1}`;

      if (this.hasProperty(phyloref, 'label')) potentialLabel = phyloref.label;
      if (this.hasProperty(phyloref, 'title')) potentialLabel = phyloref.title;

      if (potentialLabel.length > 54) { return `${potentialLabel.substr(0, 50)} ...`; }

      return potentialLabel;
    },
    getPhylorefExpectedNodeLabels(phylogeny, phyloref) {
      // Given a specifier, determine which node labels we expect it to
      // resolve to. To do this, we:
      //  1. Find all node labels that are case-sensitively identical
      //     to the phyloreference.
      //  2. Find all node labels that have additionalNodeProperties with
      //     expectedPhyloreferenceNamed case-sensitively identical to
      //     the phyloreference.
      const phylorefLabel = this.getPhylorefLabel(phyloref);
      const nodeLabels = new Set();

      this.getNodeLabelsInPhylogeny(phylogeny).forEach((nodeLabel) => {
        // Is this node label identical to the phyloreference name?
        if (nodeLabel === phylorefLabel) {
          nodeLabels.add(nodeLabel);
        } else if (
          this.hasProperty(phylogeny, 'additionalNodeProperties') &&
          this.hasProperty(phylogeny.additionalNodeProperties, nodeLabel) &&
          this.hasProperty(phylogeny.additionalNodeProperties[nodeLabel], 'expectedPhyloreferenceNamed')
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
    },
    togglePhylorefExpectedNodeLabel(phylogenyToToggle, phyloref, nodeLabelToToggle) {
      // Change the PHYX model so that the provided node label is either
      // added to the list of nodes we expect this phyloreference to resolve
      // to, or removed from that list.
      //
      // In the user interface, the expected node label is a property of
      // the phyloreference, which is the most reasonable approach for
      // curators. However, in the data model, this is a property of the
      // phylogeny, which is where all phyloreference resolution expectations
      // should be. Therefore, this method will actually modify the phylogeny in
      // order to set where this phyloreference is expected to resolve.
      // See https://github.com/phyloref/curation-tool/issues/32 for more
      // information.
      //
      const phylogeny = phylogenyToToggle;
      const phylorefLabel = this.getPhylorefLabel(phyloref);
      const currentExpectedNodeLabels = this.getPhylorefExpectedNodeLabels(phylogeny, phyloref);

      if (currentExpectedNodeLabels.includes(nodeLabelToToggle)) {
        // We need to delete this node label.
        if (
          this.hasProperty(phylogeny, 'additionalNodeProperties') &&
          this.hasProperty(phylogeny.additionalNodeProperties, nodeLabelToToggle) &&
          this.hasProperty(phylogeny.additionalNodeProperties[nodeLabelToToggle], 'expectedPhyloreferenceNamed')
        ) {
          // Delete this phyloreference from the provided node label.
          Vue.set(
            phylogeny.additionalNodeProperties[nodeLabelToToggle],
            'expectedPhyloreferenceNamed',
            phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed
              .filter(label => (phylorefLabel !== label)),
          );
        }
      } else {
        // We need to add this node label.

        // First, we need to make sure we have additional node properties
        // and expected phyloreference named for this node. If not, make them!
        if (!this.hasProperty(phylogeny, 'additionalNodeProperties')) Vue.set(phylogeny, 'additionalNodeProperties', {});
        if (!this.hasProperty(phylogeny.additionalNodeProperties, nodeLabelToToggle)) {
          Vue.set(phylogeny.additionalNodeProperties, nodeLabelToToggle, {});
        }

        if (!this.hasProperty(phylogeny.additionalNodeProperties[nodeLabelToToggle], 'expectedPhyloreferenceNamed')) {
          Vue.set(phylogeny.additionalNodeProperties[nodeLabelToToggle], 'expectedPhyloreferenceNamed', []);
        }

        // Finally, add it to the list unless it's already there!
        const expectedPhylorefNameds = phylogeny
          .additionalNodeProperties[nodeLabelToToggle]
          .expectedPhyloreferenceNamed;
        if (!expectedPhylorefNameds.includes(phylorefLabel)) {
          expectedPhylorefNameds.push(phylorefLabel);
        }
      }

      // Did that work?
      // console.log(`Additional node properties for '${nodeLabelToToggle}'`,
      // phylogeny.additionalNodeProperties[nodeLabelToToggle]);
    },
    getPhylogenyAsNewick(nodeExpr, phylogeny) {
      // Returns the phylogeny as a Newick string. Since this method is
      // called frequently in rendering the "Edit as Newick" textareas,
      // we hijack it to redraw the phylogenies.

      // Redraw the phylogeny.
      const phylotree = this.renderTree(nodeExpr, phylogeny);

      // Return the Newick string that was rendered.
      if (phylotree === undefined) { return '()'; }

      return phylotree.get_newick_with_internal_labels();
    },
    renderTree(nodeExpr, phylogenyToRender) {
      // renderTree(nodeExpr, phylogeny) {
      // Given a phylogeny, try to render it as a tree using Phylotree.
      //
      // - 'nodeExpr' is the expression provided to d3.select(...) to indicate the
      //   SVG node to draw the phylogeny into.
      // - 'phylogeny' is a Phylogeny in the data model.

      // Extract the Newick string to render.
      const phylogeny = phylogenyToRender;
      const { newick = '()' } = phylogeny;

      // Using Phylotree is a four step process:
      //  1. You use d3.layout.phyloref() to create a tree object, which you
      //     can configure with options, selecting the SVG node to draw in,
      //     and so on.
      //  2. You then call the tree object with a parsed Newick tree to update
      //     its nodes.
      //  3. At this point, you can go through the nodes and modify them if
      //     you need to.
      //  4. Finally, you call tree.placenodes().update() to calculate node
      //     locations and move the actual nodes to the correct locations on
      //     the SVG element in which you are drawing the tree.
      //

      const tree = d3.layout.phylotree()
        .svg(d3.select(nodeExpr))
        .options({
          transitions: false,
        })
        .style_nodes((element, data) => {
          // Instructions used to style nodes in Phylotree
          // - element: The D3 element of the node being styled
          // - data: The data associated with the node being styled

          if (hasProperty(data, 'name') && data.children) {
            // If the node has a label and has children (i.e. is an internal node),
            // we display it next to the node by creating a new 'text' element.

            // Make sure we don't already have an internal label node on this SVG node!
            const label = element.selectAll('.internal-label');
            if (label.empty()) {
              const textLabel = element.append('text');

              // Place internal label .3em to the right and below the node itself.
              textLabel.classed('internal-label', true)
                .text(data.name)
                .attr('dx', '.3em')
                .attr('dy', '.3em');

              // If the internal label has the same label as the currently
              // selected phyloreference, make it bolder and turn it blue.
              if (
                this.selectedPhyloref !== undefined &&
                hasProperty(this.selectedPhyloref, 'label') &&
                this.getPhylorefExpectedNodeLabels(phylogeny, this.selectedPhyloref)
                  .includes(data.name)
              ) {
                textLabel.classed('selected-internal-label', true);
              }
            }
          }

          if (data.name !== undefined && data.children === undefined) {
            // Labeled leaf node! Look for taxonomic units.
            const tunits = this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, data.name);

            if (tunits.length === 0) {
              element.classed('terminal-node-without-tunits', true);
            } else if (this.selectedPhyloref !== undefined) {
              // If there's a selected phyloref, we should highlight
              // specifiers:
              //  - internal specifier in green
              //  - external specifier in red
              if (hasProperty(this.selectedPhyloref, 'internalSpecifiers')) {
                if (this.selectedPhyloref
                  .internalSpecifiers.some(specifier =>
                    this.testWhetherSpecifierMatchesNode(specifier, phylogeny, data.name))
                ) {
                  element.classed('node internal-specifier-node', true);
                }
              }
              if (hasProperty(this.selectedPhyloref, 'externalSpecifiers')) {
                if (this.selectedPhyloref
                  .externalSpecifiers.some(specifier =>
                    this.testWhetherSpecifierMatchesNode(specifier, phylogeny, data.name))
                ) {
                  element.classed('node external-specifier-node', true);
                }
              }
            }
          }
        });
      tree(d3.layout.newick_parser(newick));

      // Phylotree supports reading the tree back out as Newick, but their Newick
      // representation doesn't annotate internal nodes. We add a method to allow
      // us to do that here.
      //
      // This is not in camelcase in order to keep it in line with the other
      // functions on Phylotree.
      // eslint-disable-next-line camelcase
      tree.get_newick_with_internal_labels = function get_newick_with_internal_labels() {
        return `${this.get_newick((node) => {
          // Don't annotate terminal nodes.
          if (!node.children) return undefined;

          // For internal nodes, annotate with their names.
          return node.name;
        })};`;
        // ^ tree.get_newick() doesn't add the final semicolon, so we do
        //   that here.
      };

      tree.get_nodes().forEach((nodeLCV) => {
        // All nodes (including named nodes) can be renamed.
        // Renaming a node will cause the phylogeny.newick property to
        // be changed, which should cause Vue.js to cause the tree to be
        // re-rendered.
        const node = nodeLCV;
        const label = node.name;
        const isNodeLabeled = (label !== undefined && label.trim() !== '');

        d3.layout.phylotree.add_custom_menu(
          node,
          () => `Edit label: ${isNodeLabeled ? label : 'none'}`,
          () => {
            // Ask the user for a new label.
            // For the Curation Tool, just using window.prompt() is adequate.
            // eslint-disable-next-line no-alert
            const result = window.prompt(
              `Please choose a new label for ${
                isNodeLabeled ? `the node labeled '${label}'` : 'the selected unlabeled node'}`,
              (isNodeLabeled ? label : ''),
            );

            // If the user clicked cancel, don't do anything.
            if (result === null) return;

            // If the user entered a blank label, remove any label from this node.
            if (result.trim() === '') {
              Vue.delete(node, 'name');
            } else {
              node.name = result;
            }

            // This should have updated the Phylotree model. To update the
            // Vue and force a redraw, we now need to update phylogeny.newick.
            const newNewick = tree.get_newick_with_internal_labels();
            // console.log('Newick string updated to: ', newNewick);
            phylogeny.newick = newNewick;
          },
        );

        // Only relevant for labeled nodes.
        if (isNodeLabeled) {
          // Add custom menu items: display all taxonomic units and provide
          // a menu item to edit them.
          const tunits = this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name);
          tunits.forEach((tunit) => {
            if (node.name !== '') {
              d3.layout.phylotree.add_custom_menu(
                node,
                () => `Taxonomic unit: ${this.getTaxonomicUnitLabel(tunit)}`,
                () => {
                  // TODO: deduplicate this code with the one below.
                  // console.log("Edit taxonomic units activated with: ", node);

                  if (!hasProperty(phylogeny, 'additionalNodeProperties')) { Vue.set(phylogeny, 'additionalNodeProperties', {}); }
                  if (!hasProperty(phylogeny.additionalNodeProperties, node.name)) {
                    Vue.set(phylogeny.additionalNodeProperties, node.name, {
                      representsTaxonomicUnits:
                        this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name),
                    });
                  }

                  this.startTUnitEditorModal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
                },
              );
            }
          });

          if (node.name !== '') {
            d3.layout.phylotree.add_custom_menu(
              node,
              () => 'Edit taxonomic units',
              () => {
                // console.log("Edit taxonomic units activated with: ", node);

                if (!hasProperty(phylogeny, 'additionalNodeProperties')) { Vue.set(phylogeny, 'additionalNodeProperties', {}); }
                if (!hasProperty(phylogeny.additionalNodeProperties, node.name)) {
                  Vue.set(phylogeny.additionalNodeProperties, node.name, {
                    representsTaxonomicUnits:
                      this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name),
                  });
                }

                this.startTUnitEditorModal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
              },
            );
          }
        }
      });

      tree
        .spacing_x(20)
        .spacing_y(40)
        .placenodes()
        .update();
      return tree;
    },

    // Methods for creating new, empty data model elements.
    createEmptyPhyloref(count) {
      // Create an empty phyloreference. We label it, but leave other
      // fields blank.

      const phyloref = {
        label: `Phyloreference ${count}`,
        cladeDefinition: '',
        internalSpecifiers: [],
        externalSpecifiers: [],
      };

      this.setPhylorefStatus(phyloref, 'pso:draft');

      return phyloref;
    },
    createEmptySpecifier() {
      // Create an empty specifier. No fields are required, so we
      // create a blank object and return that.

      return {};
    },
    createEmptyTaxonomicUnit() {
      // Create an empty taxonomic unit. No fields are required, so
      // we create a blank object and return that.

      return {};
    },

    // Methods for parsing scientific name.
    getGenus(scname) {
      // Guess the genus name of a scientific name.
      return getGenus(scname);
    },
    getSpecificEpithet(scname) {
      // Get the specific epithet name of a scientific name.
      return getSpecificEpithet(scname);
    },
    getBinomialName(scname) {
      // Get the binomial name of a scientific name.
      return getBinomialName(scname);
    },

    // Methods for parsing specimen identifiers.
    getSpecimenComponents(specimen) {
      // Split the occurrence ID into components by splitting them at
      // colons. The two expected formats are:
      //  - 'urn:catalog:[institutionCode]:[collectionCode]:[catalogNumber]'
      //      (in which case, we ignore the first two "components" here)
      //  - '[institutionCode]:[collectionCode]:[catalogNumber]'

      if (!this.hasProperty(specimen, 'occurrenceID')) return [];
      let occurID = specimen.occurrenceID;
      if (occurID.startsWith('urn:catalog:')) {
        occurID = occurID.substr(12);
      }
      return occurID.split(/\s*:\s*/);
    },
    getInstitutionCode(specimen) {
      // Extract an institution code from the occurrence ID. If only
      // two components are provided, we assume they are the institution
      // code and the catalog number.

      const comps = this.getSpecimenComponents(specimen);
      if (comps.length === 1) return undefined;
      if (comps.length === 2) return comps[0];
      if (comps.length >= 3) return comps[0];
      return undefined;
    },
    getCollectionCode(specimen) {
      // Extract a collection code from the occurrence ID. If only
      // two components are provided, we assume they are the institution
      // code and the catalog number, and so no collection code is extracted.

      const comps = this.getSpecimenComponents(specimen);
      if (comps.length >= 3) return comps[1];
      return undefined;
    },
    getCatalogNumber(specimen) {
      // Extract a catalog number from the occurrence ID. If only one
      // component is provided, we assume that it is the catalog number.
      // If only two components are provided, we assume they are the
      // institution code and the catalog number.

      const comps = this.getSpecimenComponents(specimen);
      if (comps.length === 1) return comps[0];
      if (comps.length === 2) return comps[1];
      if (comps.length >= 3) return comps[2];
      return undefined;
    },

    // Methods for manipulating phyloreferences.
    changeSelectedPhyloref(changeTo) {
      // Change the selected phyloreference in different ways.

      if (Number.isInteger(changeTo)) {
        // Increase or decrease the selected phyloreference by the
        // given number of steps.

        // Do we have a selected phyloref? If not, select the first one.
        if (this.selectedPhyloref === undefined) {
          if (this.testcase.phylorefs.length > 0) {
            // Select the first phyloreference.
            [this.selectedPhyloref] = this.testcase.phylorefs;
          } else {
            // We have no phyloreferences to select! Do nothing.
          }

          return;
        }

        // We have a selected phyloreference. Switch to the previous or
        // next one, wrapping at the length.
        const currentPhylorefIndex = this.testcase.phylorefs.indexOf(this.selectedPhyloref);
        let newPhylorefIndex = (currentPhylorefIndex + changeTo) % this.testcase.phylorefs.length;

        // If we decrement past zero, wrap around to the length.
        if (newPhylorefIndex < 0) {
          newPhylorefIndex = (this.testcase.phylorefs.length + newPhylorefIndex);
        }

        // Switch to the new selected phyloref.
        // console.log('newPhylorefIndex: ', newPhylorefIndex);
        this.selectedPhyloref = this.testcase.phylorefs[newPhylorefIndex];
      }
    },

    // Methods for manipulating nodes in phylogenies.
    getNodeLabelsInPhylogeny(phylogeny, nodeType = 'both') {
      // Return an iterator to all the node labels in a phylogeny. These
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
      const { newick = '()' } = phylogeny;
      // console.log(`getNodeLabelsInPhylogeny(${newick})`);

      // To recurse through the tree produced by Phylotree's Newick parser,
      // we need a recursive function that adds a node's labels and all of its
      // children's nodes into the list of node labels.
      //
      // TODO: In later versions, we will make the parsed Newick tree
      // directly accessible, so we should replace this code to just
      // recurse through that tree instead of re-parsing the Newick string.
      function addNodeAndChildrenToNodeLabels(node) {
        // console.log("Recursing into: " + JSON.stringify(node));

        if (this.hasProperty(node, 'name') && node.name !== '') {
          const nodeHasChildren = this.hasProperty(node, 'children') && node.children.length > 0;

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

        if (this.hasProperty(node, 'children')) {
          node.children.forEach(child => addNodeAndChildrenToNodeLabels(child));
        }
      }

      // Parse the Newick string; if parseable, recurse through the node labels,
      // adding them all to 'nodeLabels'.
      const parsed = d3.layout.newick_parser(newick);
      if (this.hasProperty(parsed, 'json')) {
        // Recurse away!
        addNodeAndChildrenToNodeLabels(parsed.json);
      }

      return Array.from(nodeLabels);
    },

    // Return a list of taxonomic units for a node label.
    getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, nodeLabel) {
      // Look up additional node properties.
      let additionalNodeProperties = {};
      if (
        this.hasProperty(phylogeny, 'additionalNodeProperties') &&
        this.hasProperty(phylogeny.additionalNodeProperties, nodeLabel)
      ) {
        additionalNodeProperties = phylogeny.additionalNodeProperties[nodeLabel];
      }

      // If there are explicit taxonomic units in the
      // representsTaxonomicUnits property, we need to use those.
      if (this.hasProperty(additionalNodeProperties, 'representsTaxonomicUnits')) {
        return additionalNodeProperties.representsTaxonomicUnits;
      }

      // If that doesn't work, we can try to extract scientific names from
      // the node label.
      const tunits = [];
      getTaxonomicUnitsFromNodeLabel(nodeLabel.trim()).forEach(tunit => tunits.push(tunit));

      return tunits;
    },

    // Taxonomic unit matching!
    getAllNodeLabelsMatchedBySpecifier(specifier) {
      // Return a list of node labels matched by a given specifier.
      // Wrapper for running getNodeLabelsMatchedBySpecifier() on
      // all currently loaded phylogenies.

      let nodeLabelsWithPrefix = [];

      const prefix = 'phylogeny_';
      let prefixCount = 0;
      this.testcase.phylogenies.forEach((phylogeny) => {
        nodeLabelsWithPrefix = nodeLabelsWithPrefix
          .concat(this.getNodeLabelsMatchedBySpecifier(specifier, phylogeny)
            .map((nodeLabel) => {
              prefixCount += 1;
              return `${prefix + prefixCount}:${nodeLabel}`;
            }));
      });

      return nodeLabelsWithPrefix;
    },

    getNodeLabelsMatchedBySpecifier(specifier, phylogeny) {
      // Return a list of node labels matched by a given specifier on
      // a given phylogeny.
      // Wrapper for testWhetherSpecifierMatchesNode() on every node label in
      // a given phylogeny.

      return this.getNodeLabelsInPhylogeny(phylogeny)
        .filter(nodeLabel => this.testWhetherSpecifierMatchesNode(
          specifier,
          phylogeny,
          nodeLabel,
        ));
    },

    testWhetherSpecifierMatchesNode(specifier, phylogeny, nodeLabel) {
      // Tests whether a specifier matches a node in a phylogeny.

      // Does the specifier have any taxonomic units? If not, we can't
      // match anything!
      if (!this.hasProperty(specifier, 'referencesTaxonomicUnits')) { return false; }

      // Find all the taxonomic units associated with the specifier and
      // with the node.
      const specifierTUnits = specifier.referencesTaxonomicUnits;
      const nodeTUnits = this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, nodeLabel);

      // Attempt pairwise matches between taxonomic units in the specifier
      // and associated with the node.
      return specifierTUnits.some(tunit1 =>
        nodeTUnits.some(tunit2 =>
          testWhetherTUnitsMatchByBinomialName(tunit1, tunit2) ||
          testWhetherTUnitsMatchByExternalReferences(tunit1, tunit2) ||
          testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2)));
    },
  },
});
