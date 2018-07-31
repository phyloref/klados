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
/* global saveAs */ // From https://github.com/eligrey/FileSaver.js

// These globals are from phyx.js. Eventually, we will replace this with
// import/export.
/* global ScientificNameWrapper */
/* global TaxonomicUnitWrapper */
/* global PhylogenyWrapper */
/* global SpecimenWrapper */
/* global PhylorefWrapper */
/* global PHYXWrapper */
/* global phyxCacheManager */

// Version of the Curation Tool
const CURATION_TOOL_VERSION = '0.1';

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

// URL to be used to send JPhyloRef /reason requests.
const JPHYLOREF_REASON_URL = 'http://localhost:34214/reason';

// Helper methods for this library.

/**
 * hasProperty(obj, propName)
 *
 * Returns true if object 'obj' has property 'propName'.
 */
function hasProperty(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
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

    // Store spacing information for individual phylogenies.
    // This is a dictionary where the keys are the phylogeny object from the
    // testcase.
    phylogenySpacingX: {},
    phylogenySpacingY: {},

    // Example PHYX URLs to display.
    examplePHYXURLs,

    // Reasoning results from JPhyloRef
    reasoningResults: {},

    // The version of the Curation Tool.
    CURATION_TOOL_VERSION,
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
    toggleButtonAndPanel(button, panel, buttonClasses = 'glyphicon-collapse-up glyphicon-collapse-down') {
      // Both button and panel should be JQuery selectors or objects.
      // buttonClasses should be a space-separated list of classes to toggle on the button.
      // The minimize button needs to do two things:
      //  - Toggle itself into a maximize button
      //  - Toggle the visibility of the associated panel
      $(button).toggleClass(buttonClasses);
      $(panel).toggle(300);
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

      // Before we load a new study, clear the PHYX caches.
      phyxCacheManager.clear();

      // And reset the reasoning results.
      this.reasoningResults = {};

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

        // Reset phylogeny scaling information.
        this.phylogenySpacingX = {};
        this.phylogenySpacingY = {};
      } catch (err) {
        throw new Error(`Error occurred while displaying new testcase: ${err}`);
      }
    },

    // Export functions.
    downloadAsJSONLD() {
      // This is a temporary function to help develop the JSON-LD production
      // system -- eventually, we'll rename it to downloadAsJSON and make it
      // export the PHYX file for download.
      const wrapped = new PHYXWrapper(this.testcase);
      const content = [JSON.stringify([wrapped.asJSONLD()], undefined, 4)];

      // Save to local hard drive.
      const jsonldFile = new File(content, 'download.json', { type: 'application/json;charset=utf-8' });
      saveAs(jsonldFile);
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
      // Returns a list of all specifiers for this phyloreference.
      return new PhylorefWrapper(phylorefWithSpecifiers).specifiers;
    },
    getSpecifierType(phyloref, specifier) {
      // Return 'Internal' or 'External', or 'Specifier' if we can't figure out
      // the type of this specifier.
      return new PhylorefWrapper(phyloref).getSpecifierType(specifier);
    },
    setSpecifierType(phylorefWithSpecifiers, specifier, specifierType) {
      new PhylorefWrapper(phylorefWithSpecifiers).setSpecifierType(specifier, specifierType);
    },
    deleteSpecifier(phyloref, specifier) {
      new PhylorefWrapper(phyloref).deleteSpecifier(specifier);
    },

    // Methods for building human-readable labels for model elements.
    getTaxonomicUnitLabel(tu) {
      return new TaxonomicUnitWrapper(tu).label;
    },
    getSpecifierLabel(specifier) {
      return PhylorefWrapper.getSpecifierLabel(specifier);
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

      const wrappedLabel = new PhylorefWrapper(phyloref).label;
      if (wrappedLabel !== undefined) potentialLabel = wrappedLabel;

      if (potentialLabel.length > 54) { return `${potentialLabel.substr(0, 50)} ...`; }

      return potentialLabel;
    },
    getPhylorefExpectedNodeLabels(phylogeny, phyloref) {
      return new PhylorefWrapper(phyloref).getExpectedNodeLabels(phylogeny);
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
      const wrappedPhyloref = new PhylorefWrapper(phyloref);
      const phylorefLabel = wrappedPhyloref.label;
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
    getPhylogenyParsingErrors(phylogeny) {
      // Return a list of errors encountered when parsing this phylogeny.
      const { newick = '()' } = phylogeny;
      return PhylogenyWrapper.getErrorsInNewickString(newick);
    },
    getPhylogenyAsNewick(nodeExpr, phylogeny) {
      // Returns the phylogeny as a Newick string. Since this method is
      // called frequently in rendering the "Edit as Newick" textareas,
      // we hijack it to redraw the phylogenies.

      // Redraw the phylogeny.
      const { newick = '()' } = phylogeny;
      const phylotree = this.renderTree(nodeExpr, phylogeny);

      // Return the Newick string that was rendered.
      // If we don't have one, return the existing Newick string
      // so it can be edited.
      if (phylotree === undefined) { return newick; }

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

      // Once we identify one or more pinning nodes in this phylogeny,
      // we need to highlight all descendants of that node.
      const pinningNodes = [];
      const pinningNodeChildrenIRIs = new Set();

      // Is this Newick string parseable?
      if (PhylogenyWrapper.getErrorsInNewickString(newick).length > 0) {
        // Remove currently rendered tree.
        d3.select(nodeExpr).selectAll('*').remove();

        // And return undefined, so the caller knows that we didn't do anything.
        return undefined;
      }

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
          const wrappedPhylogeny = new PhylogenyWrapper(phylogeny);

          // Make sure we don't already have an internal label node on this SVG node!
          let textLabel = element.selectAll('.internal-label');

          if (hasProperty(data, 'name') && data.name !== '' && data.children) {
            // If the node has a label and has children (i.e. is an internal node),
            // we display it next to the node by creating a new 'text' element.
            if (textLabel.empty()) {
              textLabel = element.append('text');

              // Place internal label .3em to the right and below the node itself.
              textLabel.classed('internal-label', true)
                .text(data.name)
                .attr('dx', '.6em')
                .attr('dy', '.3em');

              // If the internal label has the same label as the currently
              // selected phyloreference, make it bolder and turn it blue.
              if (
                this.selectedPhyloref !== undefined &&
                hasProperty(this.selectedPhyloref, 'label') &&
                new PhylorefWrapper(this.selectedPhyloref).getExpectedNodeLabels(phylogeny)
                  .includes(data.name)
              ) {
                textLabel.classed('selected-internal-label', true);
              }
            }
          }

          // If the internal label has the same IRI as the currently selected
          // phyloreference's reasoned node, further mark it as the resolved node.
          //
          // Note that this node might NOT be labeled, in which case we need to
          // label it now!
          if (
            this.selectedPhyloref !== undefined &&
            hasProperty(data, '@id') &&
            this.resolvedNodesForPhylogeny(this.selectedPhyloref, phylogeny).includes(data['@id'])
          ) {
            // We found another pinning node!
            pinningNodes.push(data);
            PhylogenyWrapper.recurseNodes(data, node => pinningNodeChildrenIRIs.add(node['@id']));

            // Mark this node as the pinning node.
            element.classed('pinning-node', true);

            // Make the pinning node circle larger (twice its usual size of 3).
            element.select('circle').attr('r', 6);
          }

          // Maybe this isn't a pinning node, but it is a child of a pinning node.
          if (
            hasProperty(data, '@id') &&
            pinningNodeChildrenIRIs.has(data['@id'])
          ) {
            // Apply a class.
            // Note that this applies to the resolved-node too.
            element.classed('descendant-of-pinning-node-node', true);
          }

          if (data.name !== undefined && data.children === undefined) {
            // Labeled leaf node! Look for taxonomic units.
            const tunits = wrappedPhylogeny.getTaxonomicUnitsForNodeLabel(data.name);

            if (tunits.length === 0) {
              element.classed('terminal-node-without-tunits', true);
            } else if (this.selectedPhyloref !== undefined) {
              // We should highlight specifiers.
              if (hasProperty(this.selectedPhyloref, 'internalSpecifiers')) {
                if (this.selectedPhyloref.internalSpecifiers
                  .some(specifier => wrappedPhylogeny.getNodeLabelsMatchedBySpecifier(specifier)
                    .includes(data.name))
                ) {
                  element.classed('node internal-specifier-node', true);
                }
              }
              if (hasProperty(this.selectedPhyloref, 'externalSpecifiers')) {
                if (this.selectedPhyloref.externalSpecifiers
                  .some(specifier => wrappedPhylogeny.getNodeLabelsMatchedBySpecifier(specifier)
                    .includes(data.name))
                ) {
                  element.classed('node external-specifier-node', true);
                }
              }
            }
          }
        })
        .style_edges((element, data) => {
          // Is the parent a descendant of a pinning node? If so, we need to
          // select this branch!
          // console.log('Found an edge with data: ', data);
          if (
            hasProperty(data, 'source') &&
            hasProperty(data.source, '@id') &&
            pinningNodeChildrenIRIs.has(data.source['@id'])
          ) {
            // Apply a class to this branch.
            element.classed('descendant-of-pinning-node-branch', true);
          }
        });
      const countPhylogeny = this.testcase.phylogenies.indexOf(phylogeny) + 1;
      tree(new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(`http://example.org/produced_by_curation_tool#phylogeny${countPhylogeny}`));

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
        const nodeID = hasProperty(node, '@id') ? node['@id'] : '(none)';
        const label = node.name;
        const isNodeLabeled = (label !== undefined && label.trim() !== '');

        d3.layout.phylotree.add_custom_menu(
          node,
          () => `Node IRI: ${nodeID}`,
          () => {},
        );

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
          const tunits = new PhylogenyWrapper(phylogeny).getTaxonomicUnitsForNodeLabel(node.name);
          tunits.forEach((tunit) => {
            if (node.name !== '') {
              d3.layout.phylotree.add_custom_menu(
                node,
                () => `Taxonomic unit: ${new TaxonomicUnitWrapper(tunit).label}`,
                () => {
                  // TODO: deduplicate this code with the one below.
                  // console.log("Edit taxonomic units activated with: ", node);

                  if (!hasProperty(phylogeny, 'additionalNodeProperties')) { Vue.set(phylogeny, 'additionalNodeProperties', {}); }
                  if (!hasProperty(phylogeny.additionalNodeProperties, node.name)) {
                    Vue.set(phylogeny.additionalNodeProperties, node.name, {
                      representsTaxonomicUnits:
                        new PhylogenyWrapper(phylogeny).getTaxonomicUnitsForNodeLabel(node.name),
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
                      new PhylogenyWrapper(phylogeny).getTaxonomicUnitsForNodeLabel(node.name),
                  });
                }

                this.startTUnitEditorModal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
              },
            );
          }
        }
      });

      // Obtain phylogeny spacing_x and spacing_y values.
      // These could be stored in the PHYX model, where they could be carried
      // from computer to computer. However, they are specific to the display
      // on which the phylogeny was curated and are otherwise unrelated to the
      // phylogeny itself. Therefore, I'm storing them elsewhere in the Vue
      // model -- users will need to set the scaling every time they open this
      // PHYX file.
      if (!this.hasProperty(this.phylogenySpacingX, phylogeny)) {
        Vue.set(this.phylogenySpacingX, phylogeny, 20);
      }
      if (!this.hasProperty(this.phylogenySpacingY, phylogeny)) {
        Vue.set(this.phylogenySpacingY, phylogeny, 40);
      }

      tree
        .spacing_x(this.phylogenySpacingX[phylogeny])
        .spacing_y(this.phylogenySpacingY[phylogeny])
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

    // Methods for parsing scientific names.
    getGenus(scname) {
      // Guess the genus name of a scientific name.
      return new ScientificNameWrapper(scname).genus;
    },
    getSpecificEpithet(scname) {
      // Get the specific epithet name of a scientific name.
      return new ScientificNameWrapper(scname).specificEpithet;
    },
    getBinomialName(scname) {
      // Get the binomial name of a scientific name.
      return new ScientificNameWrapper(scname).binomialName;
    },

    // Methods for parsing specimen identifiers.
    getInstitutionCode(specimen) {
      // Extract an institution code from the occurrence ID. If only
      // two components are provided, we assume they are the institution
      // code and the catalog number.

      return new SpecimenWrapper(specimen).institutionCode;
    },
    getCollectionCode(specimen) {
      // Extract a collection code from the occurrence ID. If only
      // two components are provided, we assume they are the institution
      // code and the catalog number, and so no collection code is extracted.

      return new SpecimenWrapper(specimen).collectionCode;
    },
    getCatalogNumber(specimen) {
      // Extract a catalog number from the occurrence ID. If only one
      // component is provided, we assume that it is the catalog number.
      // If only two components are provided, we assume they are the
      // institution code and the catalog number.

      return new SpecimenWrapper(specimen).catalogNumber;
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

      return new PhylogenyWrapper(phylogeny).getNodeLabels(nodeType);
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
          .concat(new PhylogenyWrapper(phylogeny).getNodeLabelsMatchedBySpecifier(specifier)
            .map((nodeLabel) => {
              prefixCount += 1;
              return `${prefix + prefixCount}:${nodeLabel}`;
            }));
      });

      return nodeLabelsWithPrefix;
    },

    // Reasoning over phyloreferences
    reasonOverPhyloreferences() {
      // Reason over all the phyloreferences and store the results on
      // the Vue model at vm.reasoningResults so we can access them.

      $('.reason-over-phylorefs').html('(reasoning)');
      $('.reason-over-phylorefs').prop('disabled', true);
      $.post(JPHYLOREF_REASON_URL, {
        jsonld: JSON.stringify([new PHYXWrapper(this.testcase).asJSONLD()], undefined, 4),
      }).done((data) => {
        this.reasoningResults = data;
        // console.log('Data retrieved: ', data);
      }).fail((jqXHR, textStatus, errorThrown) => {
        // We can try using the third argument, but it appears to be the
        // HTTP status (e.g. 'Internal Server Error'). So we default to that,
        // but look for a better one in the JSON response from the server, if
        // available.
        let error = errorThrown;
        if (this.hasProperty(jqXHR, 'responseJSON') && this.hasProperty(jqXHR.responseJSON, 'error')) {
          ({ error } = jqXHR.responseJSON);
        }

        if (error === undefined || error === '') error = 'unknown error';
        this.alert(`Error occurred on server while reasoning: ${error}`);
      }).always(() => {
        $('.reason-over-phylorefs').prop('disabled', false);
        $('.reason-over-phylorefs').html('Reason');
      });
    },

    resolvedNodesForPhylogeny(phyloref, phylogeny, flagReturnNodeIRI = true) {
      // Return a list of resolved nodes for a particular phyloreference on a
      // particular phylogeny.
      // - flagReturnNodeIRI: if true, we return the entire node IRI; otherwise,
      //                      we return just the node ID.

      // Convert the phyloreference to an IRI so we can look it up.
      const phylorefCount = this.testcase.phylorefs.indexOf(phyloref) + 1;
      const phylorefIRI = `http://example.org/produced_by_curation_tool#phyloref${phylorefCount}`;

      // console.log('Looking up phylorefIRI ', phylorefIRI, ' in ', this.reasoningResults);
      if (!hasProperty(this.reasoningResults, 'phylorefs') || !hasProperty(this.reasoningResults.phylorefs, phylorefIRI)) return [];
      const nodesResolved = this.reasoningResults.phylorefs[phylorefIRI];

      // We now have a list of all nodes matched by this phyloref, but we're
      // only interested in matches for a single phylogeny.
      const phylogenyCount = this.testcase.phylogenies.indexOf(phylogeny) + 1;
      const phylogenyIRI = `http://example.org/produced_by_curation_tool#phylogeny${phylogenyCount}`;

      // Only return nodes that are part of this phylogeny. We can also remove
      // the phylogeny IRI, so we get node identifiers only.
      const nodeIRIs = nodesResolved
        .filter(iri => iri.includes(phylogenyIRI));

      // TODO: This would be a good place to look up this node on the phylogeny
      // and use its node label instead of its node ID.

      if (flagReturnNodeIRI) return nodeIRIs;
      return nodeIRIs.map(iri => iri.replace(`${phylogenyIRI}_`, ''));
    },
  },
});
