/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// GLOBAL VARIABLES
// List of example files to provide in the "Examples" dropdown.
var examplePHYXURLs = [
    {
        url: "examples/fisher_et_al_2007.json",
        title: "Fisher et al, 2007"
    },
    {
        url: "examples/hillis_and_wilcox_2005.json",
        title: "Hillis and Wilcox, 2005"
    },
    {
        url: "examples/brochu_2003.json",
        title: "Brochu 2003"
    }
];

// Set up the Vue object which contains the entire model.
var vm = new Vue({
    // The element to install Vue onto.
    el: '#app',

    // The data, consisting of the model and UI elements.
    data: {
        // Constants: used during rendering.
        DOI_PREFIX: "https://dx.doi.org/",

        // The main data model.
        testcase: {
            'doi': "",
            'url': "",
            'citation': "",
            'phylogenies': [{}],
            'phylorefs': []
        },

        // A copy of the data model, used to test when the data model has been
        // modified.
        testcaseAsLoaded: {
            '@id': "",
            'doi': "",
            'url': "",
            'citation': "",
            'phylogenies': [{}],
            'phylorefs': []
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
        examplePHYXURLs: examplePHYXURLs
    },

    // Filters to be used in the template.
    filters: {
        capitalize(value) {
            // Capitalize the input value.
            if(!value) return '';
            value = value.toString();
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
    },

    // Computed values inside the data model.
    computed: {
        modified() {
            // Return true if the testcase has been modified.
            if(this.testcaseAsLoaded === undefined) return false;

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
            }
        },
        doiWithoutPrefix: {
            // Extract the DOI from the '@id' or 'url'.
            get() {
                // Is there a DOI? If so, use that.
                if(this.testcase.hasOwnProperty('doi') && this.testcase.doi != "") {
                    return this.testcase.doi;
                }

                // If not, look for a DOI among the '@id' and the 'url'.
                return identifyDOI(this.testcase);
            },
            set(newDOI) {
                // Set the DOI.
                this.testcase.doi = newDOI;
            }
        },
        doiAsURL() {
            // We compute this from testcase.doi, which should always be without
            // the prefix.
            return this.DOI_PREFIX + this.testcase.doi;
        }
    },

    // Methods for carrying out various tasks.
    methods: {
        // Helper methods.
        openURL(url, target='_blank') {
            // Open the specified URL.
            if(url === undefined || url === null) return;
            if(url == "") return;

            window.open(url, target);
        },
        createOrAppend(dict, key, value) {
            // A common case is where we need to append to an array for a key
            // in a dictionary, but we don't know if the key exists or not.
            // Furthermore, in order for Vue to track the new array, it needs
            // to be set using Vue.set. This method takes care of all of this.

            if(!(key in dict)) Vue.set(dict, key, []);
            dict[key].push(value);
            return dict;
        },
        confirm(message, func) {
            // Confirm an action with the user, then execute it if confirmed.
            if(window.confirm(message)) func();
        },
        promptAndSetDict(message, dict, key) {
            // Prompt the user for a string, then set it in a dict.
            if(dict.hasOwnProperty(key)) {
                result = window.prompt(message, dict[key]);
            } else {
                result = window.prompt(message);
            }

            if(result !== null) Vue.set(dict, key, result);
        },

        // Data model management methods.
        loadPHYXFromURL(url) {
            // Change the current PHYX to that in the provided URL.
            // Will ask the user to confirm before replacing it.

            $.getJSON(url, data => setPHYX(data)).fail((error) => {
                console.log("Could not load PHYX file '", url, "': ", error);
                if(error.status == 200) {
                    alert("Could not load PHYX file '" + url + "': file malformed, see console for details.");
                } else {
                    alert("Could not load PHYX file '" + url + "': server error " + error.status + " " + error.statusText);
                }
            });
        },

        // User interface helper methods.
        closeCurrentStudy() {
            // Close the current study. If it has been modified,
            // warn the user before closing in order to allow changes to be
            // saved.

            if(this.modified) {
                return confirm("This study has been modified! Are you sure you want to close it?");
            } else {
                return true;
            }
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
            if(tunitListContainer === null || tunitListContainer === undefined) {
                throw "Tunit editor modal started with undefined or null taxonomic unit list container";
            }

            // Look for the taxonomic units depending on type.
            if(type == 'specifier') {
                // Specifiers store their taxonomic units in their
                // 'referencesTaxonomicUnits' property.

                // Specifiers store their tunit list in referencesTaxonomicUnits.
                if(!tunitListContainer.hasOwnProperty('referencesTaxonomicUnits'))
                    Vue.set(tunitListContainer, 'referencesTaxonomicUnits', []);

                this.selectedTUnitListContainer = {
                    'type': 'specifier',
                    'label': label,
                    'container': tunitListContainer,
                    'list': tunitListContainer.referencesTaxonomicUnits
                };
            } else if (type == 'node') {
                // Nodes store their taxonomic units in their
                // 'representsTaxonomicUnits' property.

                if(!tunitListContainer.hasOwnProperty('representsTaxonomicUnits'))
                    Vue.set(tunitListContainer, 'representsTaxonomicUnits', []);

                this.selectedTUnitListContainer = {
                    'type': 'node',
                    'label': label,
                    'container': tunitListContainer,
                    'list': tunitListContainer.representsTaxonomicUnits
                };

            } else {
                throw "Tunit editor modal started with invalid type: " + type + ".";
            }

            // If we don't have a first tunit, create an empty, blank one
            // so we don't have to display an empty website.
            if(this.selectedTUnitListContainer.list.length > 0) {
                // We have a first tunit, so select it!
                this.selectedTUnit = this.selectedTUnitListContainer.list[0];
            } else {
                // Specifier doesn't represent any taxonomic unit, but it's
                // bad UX to just display a blank screen. So let's create a
                // blank taxonomic unit to work with.
                var newTUnit = this.createEmptyTaxonomicUnit();
                this.selectedTUnitListContainer.list.push(newTUnit);
                this.selectedTUnit = newTUnit;
            }

            // Make the modal draggable and display it.
            $('.modal-dialog').draggable({
                handle: '.modal-header'
            });
            $('#tunit-editor-modal').modal();
        },
        closeTUnitEditorModal() {
            // Close the taxonomic unit editor modal.

            // We've set up a data-dismiss to do that, so we don't need to do
            // anything here, but the function is here in case we need it later.
        },

        // Methods for listing and modifying specifiers.
        getSpecifiers(phyloref) {
            // Combine the internal and external specifiers into a single list,
            // with internal specifiers before external specifiers.

            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];

            specifiers = phyloref.internalSpecifiers;
            specifiers = specifiers.concat(phyloref.externalSpecifiers);
            return specifiers;
        },
        getSpecifierType(phyloref, specifier) {
            // For a given specifier, return a string indicating whether it is
            // an 'Internal' or 'External' specifier.

            if(phyloref.hasOwnProperty('internalSpecifiers') && phyloref.internalSpecifiers.includes(specifier)) return "Internal";
            if(phyloref.hasOwnProperty('externalSpecifiers') && phyloref.externalSpecifiers.includes(specifier)) return "External";
            return "Specifier";
        },
        setSpecifierType(phyloref, specifier, specifierType) {
            // Change the type of a given specifier. To do this, we first need
            // to determine if it was originally an internal or external
            // specifier, then move it into the other list.

            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];

            if(specifierType == 'Internal') {
                index = phyloref.externalSpecifiers.indexOf(specifier);
                if(index != -1)
                    phyloref.externalSpecifiers.splice(index, 1);

                if(!phyloref.internalSpecifiers.includes(specifier))
                    phyloref.internalSpecifiers.unshift(specifier);
            } else if(specifierType == 'External') {
                index = phyloref.internalSpecifiers.indexOf(specifier);
                if(index != -1)
                    phyloref.internalSpecifiers.splice(index, 1);

                if(!phyloref.externalSpecifiers.includes(specifier))
                    phyloref.externalSpecifiers.unshift(specifier);
            } else {
                // Neither internal nor external? Ignore.
            }
        },
        deleteSpecifier(phyloref, specifier) {
            // Since the user interface combines specifiers into a si**ngle list,
            // it doesn't remember if the specifier to be deleted is internal
            // or external. We delete the intended specifier from both arrays.

            if(phyloref.hasOwnProperty('internalSpecifiers')) {
                var index = phyloref.internalSpecifiers.indexOf(specifier);
                if(index != -1) phyloref.internalSpecifiers.splice(index, 1);
            }

            if(phyloref.hasOwnProperty('externalSpecifiers')) {
                var index = phyloref.externalSpecifiers.indexOf(specifier);
                if(index != -1) phyloref.externalSpecifiers.splice(index, 1);
            }
        },

        // Methods for building human-readable labels for model elements.
        getTaxonomicUnitLabel(tu) {
            // Try to determine the label of a taxonomic unit. This checks the
            // 'label' and 'description' properties, and then tries to create a
            // descriptive label by combining the scientific names, specimens
            // and external references of the taxonomic unit.
            labels = [];

            // A label or description for the TU?
            if('label' in tu) return tu.label;
            if('description' in tu) return tu.description;

            // Any scientific names?
            if('scientificNames' in tu) {
                for(scname of tu.scientificNames) {
                    if('label' in scname) labels.push(scname.label);
                    else if('scientificName' in scname) labels.push(scname.scientificName);
                    else if('binomialName' in scname) labels.push(scname.binomialName);
                    else labels.push("Unformatted scientific name");
                }
            }

            // Any specimens?
            if('includesSpecimens' in tu) {
                for(specimen of tu.includesSpecimens) {
                    if('label' in specimen) labels.push("Specimen " + specimen.label);
                    else if('occurrenceID' in specimen) labels.push("Specimen " + specimen.occurrenceID);
                    else if('catalogNumber' in specimen) labels.push("Specimen " + specimen.catalogNumber);
                    else labels.push("Unlabeled specimen");
                }
            }

            // Any external references?
            if('externalReferences' in tu) {
                for(externalRef of tu.externalReferences) {
                    labels.push("<" + externalRef + ">");
                }
            }

            if(labels.length == 0) return "Unnamed taxonomic unit";

            return labels.join(', ');
        },
        getSpecifierLabel(specifier) {
            // Try to determine the label of a specifier. This checks the
            // 'label' and 'description' properties, and then tries to create a
            // descriptive label by using the list of referenced taxonomic units.

            // Is this specifier even non-null?
            if(specifier === undefined) return "(undefined)";
            if(specifier === null) return "(null)";

            // Maybe there is a label or description right there?
            if('label' in specifier) return specifier.label;
            if('description' in specifier) return specifier.description;

            // Look at the individual taxonomic units.
            if('referencesTaxonomicUnits' in specifier) {
                var labels = specifier.referencesTaxonomicUnits.map(tu => vm.getTaxonomicUnitLabel(tu));
                if(labels.length > 0) return labels.join('; ');
            }

            // No idea!
            return "Unnamed specifier";
        },
        getPhylorefLabel(phyloref) {
            // Try to determine what the label of a particular phyloreference is,
            // or default to 'Phyloreference <count>'. This checks the 'label' and
            // 'title' properties, and truncates them to 50 characters.

            phylorefIndex = this.testcase.phylorefs.indexOf(phyloref);
            potentialLabel = "Phyloreference " + (phylorefIndex + 1);

            if(phyloref.hasOwnProperty('label')) potentialLabel = phyloref.label;
            if(phyloref.hasOwnProperty('title')) potentialLabel = phyloref.title;

            if(potentialLabel.length > 54)
                return potentialLabel.substr(0, 50) + " ...";

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
            let phylorefLabel = this.getPhylorefLabel(phyloref);
            let nodeLabels = new Set();
            for(nodeLabel of this.getNodeLabelsInPhylogeny(phylogeny)) {
                // Is this node label identical to the phyloreference name?
                if(nodeLabel === phylorefLabel) {
                    nodeLabels.add(nodeLabel);
                    continue;
                }

                // Does this node label have an expectedPhyloreferenceNamed that
                // includes this phyloreference name?
                if(
                    phylogeny.hasOwnProperty('additionalNodeProperties') &&
                    phylogeny.additionalNodeProperties.hasOwnProperty(nodeLabel) &&
                    phylogeny.additionalNodeProperties[nodeLabel].hasOwnProperty('expectedPhyloreferenceNamed')
                ) {
                    let expectedPhylorefs = phylogeny.additionalNodeProperties[nodeLabel].expectedPhyloreferenceNamed;

                    if(expectedPhylorefs.includes(phylorefLabel)) {
                        nodeLabels.add(nodeLabel);
                        continue;
                    }
                }
            }

            // Return node labels sorted alphabetically.
            return Array.from(nodeLabels).sort();
        },
        togglePhylorefExpectedNodeLabel(phylogeny, phyloref, nodeLabelToToggle) {
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
            let phylorefLabel = this.getPhylorefLabel(phyloref);
            let currentExpectedNodeLabels = this.getPhylorefExpectedNodeLabels(phylogeny, phyloref);

            if(currentExpectedNodeLabels.includes(nodeLabelToToggle)) {
                // We need to delete this node label.
                if(
                    phylogeny.hasOwnProperty('additionalNodeProperties') &&
                    phylogeny.additionalNodeProperties.hasOwnProperty(nodeLabelToToggle) &&
                    phylogeny.additionalNodeProperties[nodeLabelToToggle].hasOwnProperty('expectedPhyloreferenceNamed')
                ) {
                    // Delete this phyloreference from the provided node label.
                    phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed =
                        phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed.filter(
                            label => (phylorefLabel !== label)
                        );
                }
            } else {
                // We need to add this node label.

                // First, we need to make sure we have additional node properties
                // and expected phyloreference named for this node. If not, make them!
                if(!phylogeny.hasOwnProperty('additionalNodeProperties')) Vue.set(phylogeny, 'additionalNodeProperties', {});
                if(!phylogeny.additionalNodeProperties.hasOwnProperty(nodeLabelToToggle))
                    Vue.set(phylogeny.additionalNodeProperties, nodeLabelToToggle, {});

                if(!phylogeny.additionalNodeProperties[nodeLabelToToggle].hasOwnProperty('expectedPhyloreferenceNamed'))
                    phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed = [];

                // Finally, add it to the list unless it's already there!
                if(!phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed.includes(phylorefLabel))
                    phylogeny.additionalNodeProperties[nodeLabelToToggle].expectedPhyloreferenceNamed.push(phylorefLabel);
            }

            // Did that work?
            console.log("Additional node properties for '" + nodeLabelToToggle + "'", phylogeny.additionalNodeProperties[nodeLabelToToggle]);
        },
        getPhylogenyAsNewick(nodeExpr, phylogeny) {
            // Returns the phylogeny as a Newick string. Since this method is
            // called frequently in rendering the "Edit as Newick" textareas,
            // we hijack it to redraw the phylogenies.

            // Redraw the phylogeny.
            let phylotree = renderTree(nodeExpr, phylogeny);

            // Return the Newick string that was rendered.
            if(phylotree === undefined)
                return "()";

            return phylotree.get_newick_with_internal_labels();
        },

        // Methods for creating new, empty data model elements.
        createEmptyPhyloref(count) {
            // Create an empty phyloreference. We label it, but leave other
            // fields blank.

            return {
                label: "Phyloreference " + count,
                cladeDefinition: "",
                internalSpecifiers: [],
                externalSpecifiers: []
            }
        },
        createEmptySpecifier(count) {
            // Create an empty specifier. No fields are required, so we
            // create a blank object and return that.

            return {};
        },
        createEmptyTaxonomicUnit(count) {
            // Create an empty taxonomic unit. No fields are required, so
            // we create a blank object and return that.

            return {};
        },

        // Methods for parsing scientific name.
        getScientificNameComponents(scname) {
            // Return the components of a scientific name by splitting its
            // scientificName field using spaces.

            if(!scname.hasOwnProperty('scientificName')) return [];
            return scname.scientificName.split(/\s+/);
        },
        getGenus(scname) {
            // Guess the genus name of a scientific name by using its first component.

            comps = this.getScientificNameComponents(scname);
            if(comps.length >= 1) return comps[0];
            return undefined;
        },
        getSpecificEpithet(scname) {
            // Get the specific epithet name of a scientific name by using its
            // second component.

            comps = this.getScientificNameComponents(scname);
            if(comps.length >= 2) return comps[1];
            return undefined;
        },
        getBinomialName(scname) {
            // Get the binomial name of a scientific name by combining its
            // first and second components.

            genus = this.getGenus(scname);
            specificEpithet = this.getSpecificEpithet(scname);

            if(genus != undefined && specificEpithet != undefined) return genus + " " + specificEpithet;
            return undefined;
        },

        // Methods for parsing specimen identifiers.
        getSpecimenComponents(specimen) {
            // Split the occurrence ID into components by splitting them at
            // colons. The two expected formats are:
            //  - 'urn:catalog:[institutionCode]:[collectionCode]:[catalogNumber]'
            //      (in which case, we ignore the first two "components" here)
            //  - '[institutionCode]:[collectionCode]:[catalogNumber]'

            if(!specimen.hasOwnProperty('occurrenceID')) return [];
            var occurID = specimen.occurrenceID;
            if(occurID.startsWith('urn:catalog:')) {
                occurID = occurID.substr(12);
            }
            return occurID.split(/\s*:\s*/);
        },
        getInstitutionCode(specimen) {
            // Extract an institution code from the occurrence ID. If only
            // two components are provided, we assume they are the institution
            // code and the catalog number.

            comps = this.getSpecimenComponents(specimen);
            if(comps.length == 1) return undefined;
            if(comps.length == 2) return comps[0];
            if(comps.length >= 3) return comps[0];
            return undefined;
        },
        getCollectionCode(specimen) {
            // Extract a collection code from the occurrence ID. If only
            // two components are provided, we assume they are the institution
            // code and the catalog number, and so no collection code is extracted.

            comps = this.getSpecimenComponents(specimen);
            if(comps.length >= 3) return comps[1];
            return undefined;
        },
        getCatalogNumber(specimen) {
            // Extract a catalog number from the occurrence ID. If only one
            // component is provided, we assume that it is the catalog number.
            // If only two components are provided, we assume they are the
            // institution code and the catalog number.

            comps = this.getSpecimenComponents(specimen);
            if(comps.length == 1) return comps[0];
            if(comps.length == 2) return comps[1];
            if(comps.length >= 3) return comps[2];
            return undefined;
        },

        // Methods for manipulating phyloreferences.
        changeSelectedPhyloref(changeTo) {
            // Change the selected phyloreference in different ways.

            if(Number.isInteger(changeTo)) {
                // Increase or decrease the selected phyloreference by the
                // given number of steps.

                // Do we have a selected phyloref? If not, select the first one.
                if(this.selectedPhyloref === undefined) {
                    if(this.testcase.phylorefs.length > 0) {
                        // Select the first phyloreference.
                        this.selectedPhyloref = this.testcase.phylorefs[0];
                    } else {
                        // We have no phyloreferences to select! Do nothing.
                    }

                    return;
                }

                // We have a selected phyloreference. Switch to the previous or
                // next one, wrapping at the length.
                let currentPhylorefIndex = this.testcase.phylorefs.indexOf(this.selectedPhyloref);
                let newPhylorefIndex = (currentPhylorefIndex + changeTo) % this.testcase.phylorefs.length;

                // If we decrement past zero, wrap around to the length.
                if(newPhylorefIndex < 0) newPhylorefIndex = (this.testcase.phylorefs.length + newPhylorefIndex);

                // Switch to the new selected phyloref.
                console.log("New phyloref index: ", newPhylorefIndex);
                this.selectedPhyloref = this.testcase.phylorefs[newPhylorefIndex];
                return;
            }
        },

        // Methods for manipulating nodes in phylogenies.
        getNodeLabelsInPhylogeny(phylogeny, nodeType='both') {
            // Return an iterator to all the node labels in a phylogeny. These
            // node labels come from two sources:
            //  1. We look for node names in the Newick string.
            //  2. We look for node names in the additionalNodeProperties.
            //
            // nodeType can be one of:
            // - 'internal': Return node labels on internal nodes.
            // - 'terminal': Return node labels on terminal nodes.
            // - 'both': Return node labels on both internal and terminal nodes.

            var nodeLabels = new Set();

            // Names from the Newick string.
            var newick = phylogeny.newick;
            if(newick == null)
                newick = '()';
            console.log("getNodeLabelsInPhylogeny(" + newick + ")");

            // Use PhyloTree's Newick parser to convert the Newick string
            // into a tree-based representation, which we can recurse through
            // to extract all the labels.
            //
            // TODO: In later versions, we will make the parsed Newick tree
            // directly accessible, so we should replace this code to just
            // recurse through that tree instead of re-parsing the Newick string.
            var parsed = d3.layout.newick_parser(newick);
            if(parsed.hasOwnProperty('json')) {
                function addNodeAndChildrenToNodeLabels(node) {
                    // console.log("Recursing into: " + JSON.stringify(node));

                    if(node.hasOwnProperty('name') && node.name != '') {
                        let nodeHasChildren = node.hasOwnProperty('children') && node.children.length > 0;

                        // Only add the node label if it is on the type of node
                        // we're interested in.
                        if(
                            (nodeType === 'both') ||
                            (nodeType === 'internal' && nodeHasChildren) ||
                            (nodeType === 'terminal' && !nodeHasChildren)
                        ) {
                            nodeLabels.add(node.name);
                        }
                    }

                    if(node.hasOwnProperty('children')) {
                        for(child of node.children) {
                            addNodeAndChildrenToNodeLabels(child);
                        }
                    }
                }

                // Recurse away!
                addNodeAndChildrenToNodeLabels(parsed.json);
            }

            return Array.from(nodeLabels);
        },

        // Return a list of taxonomic units for a node label.
        getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, nodeLabel) {
            // Look up additional node properties.
            var additionalNodeProperties = {};
            if(
                phylogeny.hasOwnProperty('additionalNodeProperties') &&
                phylogeny.additionalNodeProperties.hasOwnProperty(nodeLabel)
            ) {
                additionalNodeProperties = phylogeny.additionalNodeProperties[nodeLabel];
            }

            // If there are explicit taxonomic units in the
            // representsTaxonomicUnits property, we need to use those.
            if(additionalNodeProperties.hasOwnProperty('representsTaxonomicUnits')) {
                return additionalNodeProperties.representsTaxonomicUnits;
            }

            // If that doesn't work, we can try to extract scientific names from
            // the node label.
            let tunits = [];
            for(let tunit of getTaxonomicUnitsFromNodeLabel(nodeLabel.trim())) {
                tunits.push(tunit);
            }

            return tunits;
        },

        // Taxonomic unit matching!
        getAllNodeLabelsMatchedBySpecifier(specifier) {
            // Return a list of node labels matched by a given specifier.
            // Wrapper for running getNodeLabelsMatchedBySpecifier() on
            // all currently loaded phylogenies.

            let nodeLabelsWithPrefix = [];

            let prefix = "phylogeny-";
            let prefixCount = 0;
            for(let phylogeny of this.testcase.phylogenies) {
                for(let nodeLabel of this.getNodeLabelsMatchedBySpecifier(specifier, phylogeny)) {
                    nodeLabelsWithPrefix.push(prefix + prefixCount + ":" + nodeLabel);
                }
                prefixCount++;
            }

            return nodeLabelsWithPrefix;
        },

        getNodeLabelsMatchedBySpecifier(specifier, phylogeny) {
            // Return a list of node labels matched by a given specifier on
            // a given phylogeny.
            // Wrapper for testWhetherSpecifierMatchesNode() on every node label in
            // a given phylogeny.

            let localVM = this;

            return localVM.getNodeLabelsInPhylogeny(phylogeny).filter(
                nodeLabel => localVM.testWhetherSpecifierMatchesNode(specifier, phylogeny, nodeLabel)
            );
        },

        testWhetherSpecifierMatchesNode(specifier, phylogeny, nodeLabel) {
            // Tests whether a specifier matches a node in a phylogeny.

            // Does the specifier have any taxonomic units? If not, we can't
            // match anything!
            if(!specifier.hasOwnProperty('referencesTaxonomicUnits'))
                return false;

            // Find all the taxonomic units associated with the specifier and
            // with the node.
            let specifierTUnits = specifier.referencesTaxonomicUnits;
            let nodeTUnits = this.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, nodeLabel);

            // Attempt pairwise matches between taxonomic units in the specifier
            // and associated with the node.
            for(let tunit1 of specifierTUnits) {
                for(let tunit2 of nodeTUnits) {
                    if(
                        testWhetherTUnitsMatchByBinomialName(tunit1, tunit2) ||
                        testWhetherTUnitsMatchByExternalReferences(tunit1, tunit2) ||
                        testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2)
                    ) return true;
                }
            }

            return false;
        }
    }
});

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
    if(tunit1 === undefined || tunit2 === undefined) return false;
    if(tunit1.hasOwnProperty('externalReferences') && tunit2.hasOwnProperty('externalReferences')) {
        // Each external reference is a URL as a string. We will lowercase it,
        // but do no other transformation.
        for(let extref1 of tunit1.externalReferences) {
            for(let extref2 of tunit2.externalReferences) {
                if(extref1.trim() != '' && extref1.toLowerCase().trim() === extref2.toLowerCase().trim())
                    return true;
            }
        }
    }

    return false;
}

/**
 * testWhetherTUnitsMatchByBinomialName(scname1, scname2)
 *
 * Test whether two scientific names match on the basis of their binomial names.
 */
function testWhetherScientificNamesMatchByBinomialName(scname1, scname2) {
    // Step 1. Try matching by explicit binomial name, if one is available.
    if(scname1.hasOwnProperty('binomialName') && scname2.hasOwnProperty('binomialName')) {
        if(scname1.binomialName.trim() !== '' && scname1.binomialName.toLowerCase().trim() === scname2.binomialName.toLowerCase().trim())
            return true;
    }

    // Step 2. Otherwise, try to extract the binomial name from the scientificName
    // and compare those.
    let binomial1 = vm.getBinomialName(scname1);
    let binomial2 = vm.getBinomialName(scname2);

    if(binomial1 !== undefined && binomial2 !== undefined && binomial1.trim() !== '' && binomial1.trim() === binomial2.trim())
        return true;

    return false;
}

/**
 * testWhetherTUnitsMatchByBinomialName(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their binomial names.
 */
function testWhetherTUnitsMatchByBinomialName(tunit1, tunit2) {
    if(tunit1 === undefined || tunit2 === undefined) return false;
    if(tunit1.hasOwnProperty('scientificNames') && tunit2.hasOwnProperty('scientificNames')) {
        // Each external reference is a URL as a string.
        for(let scname1 of tunit1.scientificNames) {
            for(let scname2 of tunit2.scientificNames) {
                if(testWhetherScientificNamesMatchByBinomialName(scname1, scname2))
                    return true;
            }
        }
    }

    return false;
}

/**
 * testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their specimen identifiers.
 */
function testWhetherTUnitsMatchBySpecimenIdentifier(tunit1, tunit2) {
    if(tunit1 === undefined || tunit2 === undefined) return false;
    if(tunit1.hasOwnProperty('includesSpecimens') && tunit2.hasOwnProperty('includesSpecimens')) {
        // Convert specimen identifiers (if present) into a standard format and compare those.
        for(let specimen1 of tunit1.includesSpecimens) {
            for(let specimen2 of tunit2.includesSpecimens) {
                if(
                    getSpecimenIdentifierAsURN(specimen1) !== undefined &&
                    getSpecimenIdentifierAsURN(specimen2) !== undefined &&
                    getSpecimenIdentifierAsURN(specimen1) === getSpecimenIdentifierAsURN(specimen2)
                )
                    return true;
            }
        }
    }

    return false;
}

/**
 * getSpecimenIdentifierAsURN(specimen)
 *
 * Given a specimen, return a specimen identifier as a URN in the form:
 *   "urn:catalog:" + institutionCode (if present) + ':' + collectionCode (if present) + ':' + catalogNumber (if present)
 */
function getSpecimenIdentifierAsURN(specimen) {
    if(specimen === undefined) return undefined;

    // Does it have an occurrenceID?
    if(specimen.hasOwnProperty('occurrenceID') && specimen.occurrenceID.trim() != '') return specimen.occurrenceID.trim();

    // Does it have a catalogNumber? We might need an institutionCode and a collectionCode as well.
    if(specimen.hasOwnProperty('catalogNumber')) {
        if(specimen.hasOwnProperty('institutionCode')) {
            if(specimen.hasOwnProperty('collectionCode')) {
                return "urn:catalog:" + specimen.institutionCode.trim() + ":" + specimen.collectionCode.trim() + ":" + specimen.catalogNumber.trim();
            } else {
                return "urn:catalog:" + specimen.institutionCode.trim() + "::" + specimen.catalogNumber.trim();
            }
        } else {
            if(specimen.hasOwnProperty('collectionCode')) {
                return "urn:catalog::" + specimen.collectionCode.trim() + ":" + specimen.catalogNumber.trim();
            } else {
                return "urn:catalog:::" + specimen.catalogNumber.trim();
            }
        }
    }

    // None of our specimen identifier schemes worked.
    return undefined;
}

/**
 * getTaxonomicUnitsFromNodeLabel(nodeLabel)
 *
 * Given a node label, attempt to parse it as a scientific name.
 * Returns a list of taxonomic units.
 */
function getTaxonomicUnitsFromNodeLabel(nodeLabel) {
    if(nodeLabel === undefined || nodeLabel === null) return [];

    // Check if the label starts with a binomial name.
    var results = /^([A-Z][a-z]+) ([a-z\-]+)\b/.exec(nodeLabel);
    if(results !== null) {
        return [{
            'scientificNames': [{
                'scientificName': nodeLabel,
                'binomialName': results[1] + ' ' + results[2],
                'genus': results[1],
                'specificEpithet': results[2]
            }]
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
function identifyDOI(testcase) {
    const DOI_REGEX = /^https?:\/\/(?:dx\.)?doi\.org\/(.+?)[\#\/]?$/i;

    var possibilities = [];

    if(testcase.hasOwnProperty('doi')) {
        possibilities.push(testcase['doi']);
    }

    if(testcase.hasOwnProperty('url')) {
        possibilities.push(testcase['url']);
    }

    // Look for possible matches.
    for(possibility of possibilities) {
        matches = DOI_REGEX.exec(possibility);

        if(matches) {
            testcase.doi = matches[1];
            return matches[1];
        }
    }

    return undefined;
}

/**
 * setPHYX(testcase)
 *
 * Updates the user interface to reflect the new JSON document provided in 'testcase'.
 */
function setPHYX(testcase) {
    if(!vm.closeCurrentStudy()) return;

    try {
        // Specifiers act weird unless every phyloreference has both
        // internalSpecifiers and externalSpecifiers set, even if they
        // are blank.
        if(!testcase.hasOwnProperty('phylorefs')) testcase.phylorefs = [];
        for(phyloref of testcase.phylorefs) {
            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];
        }

        // Check for DOI in other fields if not provided explicitly.
        if(!testcase.hasOwnProperty('doi') || testcase.doi == "") {
            testcase.doi = identifyDOI(testcase);
        }

        // Deep-copy the testcase into a 'testcaseAsLoaded' variable in our
        // model. We deep-compare vm.testcase with vm.testcaseAsLoaded to
        // determine if the loaded model has been modified.
        vm.testcaseAsLoaded = jQuery.extend(true, {}, testcase);
        vm.testcase = testcase;

        // Reset all UI selections.
        vm.selectedPhyloref = undefined;
        vm.selectedSpecifier = undefined;
        vm.selectedTUnit = undefined;

    } catch(err) {
        console.log("Error occurred while displaying new testcase: " + err);
    }
}

/**
 * loadPHYXFromFileInput(fileInput)
 *
 * Load a JSON file from the local file system using FileReader. fileInput
 * needs to be an HTML element representing an <input type="file"> in which
 * the user has selected the local file they wish to load.
 *
 * This code is based on https://stackoverflow.com/a/21446426/27310
 */
function loadPHYXFromFileInput(fileInput) {
    if(typeof window.FileReader !== 'function') {
        alert("The FileReader API is not supported on this browser.");
        return;
    }

    if(!fileInput) {
        alert("Programmer error: No file input element specified.");
        return;
    }

    if(!fileInput.prop('files')) {
        alert("File input element found, but files property missing: try another browser?");
        return;
    }

    if(!fileInput.prop('files')[0]) {
        alert("Please select a file before attempting to load it.");
        return;
    }

    file = fileInput.prop('files')[0];
    fr = new FileReader();
    fr.onload = ((e) => {
        lines = e.target.result;
        testcase = JSON.parse(lines);
        setPHYX(testcase);
    });
    fr.readAsText(file);
}

/**
 * renderTree(nodeExpr, phylogeny) {
 * Given a phylogeny, try to render it as a tree using Phylotree.
 *
 * 'nodeExpr' is the expression provided to d3.select(...) to indicate the
 *   SVG node to draw the phylogeny into.
 * 'phylogeny' is a Phylogeny in the data model.
 */
function renderTree(nodeExpr, phylogeny) {
    // No point trying to render anything without a Vue model.
    if(vm === undefined) return undefined;

    console.log("renderTree(" + nodeExpr + ", " + phylogeny + ") on selected phyloref " + vm.selectedPhyloref);

    // Extract the Newick string to render.
    let newick = "()";
    if(phylogeny.hasOwnProperty('newick')) newick = phylogeny.newick;

    // The node styler provides information on styling nodes within the
    // phylogeny.
    function nodeStyler(element, data) {
        if(data.hasOwnProperty('name') && data.children) {
            // If the node has a label and has children (i.e. is an internal node),
            // we display it next to the node by creating a new 'text' element.

            // Make sure we don't already have an internal label node on this SVG node!
            var label = element.selectAll(".internal-label");
            if(label.empty()) {
                var textLabel = element.append("text");

                // Place internal label .3em to the right and below the node itself.
                textLabel.classed("internal-label", true)
                    .text(data.name)
                    .attr("dx", ".3em")
                    .attr("dy", ".3em");

                // If the internal label has the same label as the currently
                // selected phyloreference, make it bolder and turn it blue.
                if(
                    vm.selectedPhyloref !== undefined &&
                    vm.selectedPhyloref.hasOwnProperty('label') &&
                    vm.getPhylorefExpectedNodeLabels(phylogeny, vm.selectedPhyloref).includes(data.name)
                ) {
                    textLabel.classed("selected-internal-label", true);
                }
            }
        }

        if(data.name !== undefined && data.children === undefined) {
            // Labeled leaf node! Look for taxonomic units.
            var tunits = vm.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, data.name);

            if(tunits.length == 0) {
                element.classed('terminal-node-without-tunits', true);
            } else if(vm.selectedPhyloref !== undefined) {
                // If there's a selected phyloref, we should highlight
                // specifiers:
                //  - internal specifier in green
                //  - external specifier in red
                if(vm.selectedPhyloref.hasOwnProperty('internalSpecifiers')) {
                    for(let specifier of vm.selectedPhyloref.internalSpecifiers) {
                        if(vm.testWhetherSpecifierMatchesNode(specifier, phylogeny, data.name)) {
                            element.classed('node internal-specifier-node', true);
                        }
                    }
                }
                if(vm.selectedPhyloref.hasOwnProperty('externalSpecifiers')) {
                    for(let specifier of vm.selectedPhyloref.externalSpecifiers) {
                        if(vm.testWhetherSpecifierMatchesNode(specifier, phylogeny, data.name)) {
                            element.classed('node external-specifier-node', true);
                        }
                    }
                }
            }
        }
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

    var tree = d3.layout.phylotree()
        .svg(d3.select(nodeExpr))
        .options({
            "transitions": false
        })
        .style_nodes(nodeStyler);
    tree(d3.layout.newick_parser(newick));

    // Phylotree supports reading the tree back out as Newick, but their Newick
    // representation doesn't annotate internal nodes. We add a method to allow
    // us to do that here.
    tree.get_newick_with_internal_labels = function() {
        return this.get_newick((node) => {
            // Don't annotate terminal nodes.
            if(!node.children) return;

            // For internal nodes, annotate with their names.
            return node['name'];
        }) + ";";
        // ^ tree.get_newick() doesn't add the final semicolon, so we do
        //   that here.
    };

    tree.get_nodes().forEach((node) => {
        // All nodes (including named nodes) can be renamed.
        // Renaming a node will cause the phylogeny.newick property to
        // be changed, which should cause Vue.js to cause the tree to be
        // re-rendered.
        let label = node['name'];
        let isNodeLabeled = (label !== undefined && label.trim() != '');

        d3.layout.phylotree.add_custom_menu(
            node,
            (node) => "Edit label: " + (isNodeLabeled ? label : "none"),
            function() {
                // Ask the user for a new label.
                let result = window.prompt(
                    "Please choose a new label for " +
                        (isNodeLabeled ? "the node labeled '" + label + "'" : "the selected unlabeled node"),
                    (isNodeLabeled ? label : "")
                );

                // If the user clicked cancel, don't do anything.
                if(result === null) return;

                // If the user entered a blank label, remove any label from this node.
                if(result.trim() == '') {
                    delete node['name'];
                } else {
                    node['name'] = result;
                }

                // This should have updated the Phylotree model. To update the
                // Vue and force a redraw, we now need to update phylogeny.newick.
                let newNewick = tree.get_newick_with_internal_labels();
                console.log("Newick string updated to: ", newNewick);
                phylogeny.newick = newNewick;
            }
        );

        // Only relevant for labeled nodes.
        if(isNodeLabeled) {
            // Add custom menu items: display all taxonomic units and provide
            // a menu item to edit them.
            var tunits = vm.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name);
            for(var tunit of tunits) {
                if(node.name !== "") {
                    d3.layout.phylotree.add_custom_menu(
                        node,
                        function(node) {
                            console.log("Displaying label for: ", tunit);
                            return "Taxonomic unit: " + vm.getTaxonomicUnitLabel(tunit);
                        },
                        function() {
                            // TODO: deduplicate this code with the one below.
                            // console.log("Edit taxonomic units activated with: ", node);

                            if(!phylogeny.hasOwnProperty('additionalNodeProperties'))
                                Vue.set(phylogeny, 'additionalNodeProperties', {});
                            if(!phylogeny.additionalNodeProperties.hasOwnProperty(node.name))
                                Vue.set(phylogeny.additionalNodeProperties, node.name, {
                                    'representsTaxonomicUnits': vm.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name)
                                });


                            // console.log("Setting selected tunit list to: ", phylogeny.representsTaxonomicUnits[node.name]);

                            vm.startTUnitEditorModal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
                        }
                    );
                }
            }

            if(node.name !== "") {
                d3.layout.phylotree.add_custom_menu(
                    node,
                    (node) => "Edit taxonomic units",
                    function() {
                        // console.log("Edit taxonomic units activated with: ", node);

                        if(!phylogeny.hasOwnProperty('additionalNodeProperties'))
                            Vue.set(phylogeny, 'additionalNodeProperties', {});
                        if(!phylogeny.additionalNodeProperties.hasOwnProperty(node.name))
                            Vue.set(phylogeny.additionalNodeProperties, node.name, {
                                'representsTaxonomicUnits': vm.getTaxonomicUnitsForNodeLabelInPhylogeny(phylogeny, node.name)
                            });

                        // console.log("Setting selected tunit list to: ", phylogeny.representsTaxonomicUnits[node.name]);

                        vm.startTUnitEditorModal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
                    }
                );
            }
        }
    });

    tree
        .spacing_x(20)
        .spacing_y(40)
        .placenodes()
        .update()
    ;

    return tree;
}
