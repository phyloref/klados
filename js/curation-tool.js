/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// GLOBAL VARIABLES
// List of example files to provide in the "Examples" dropdown.
var example_phyx_urls = [
    {
        url: "examples/fisher_et_al_2007.json",
        title: "Fisher et al, 2007"
    },
    {
        url: "examples/hillis_and_wilcox_2005.json",
        title: "Hillis and Wilcox, 2005"
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
            '@id': "",
            'doi': "",
            'url': "",
            'citation': "",
            'phylogenies': [{}],
            'phylorefs': []
        },

        // A copy of the data model, used to test when the data model has been
        // modified.
        testcase_as_loaded: {
            '@id': "",
            'doi': "",
            'url': "",
            'citation': "",
            'phylogenies': [{}],
            'phylorefs': []
        },

        // UI elements.
        selected_phyloref: undefined,
        selected_tunit_list_container: undefined,
        selected_tunit: undefined,

        // Phylogeny view modes
        phylogeny_newick_mode_for: undefined,
        phylogeny_annotations_mode_for: undefined,

        // Display the delete buttons on the specifiers.
        specifier_delete_mode: false,

        // Which phylogeny label is currently being edited?
        phylogeny_description_being_edited: undefined,

        // Display one of the two dropdown menus for the specifiers.
        specifier_dropdown_target: 'none',

        // Example PHYX URLs to display
        example_phyx_urls: example_phyx_urls
    },

    // Filters to be used in the template.
    filters: {
        capitalize: function(value) {
            // Capitalize the input value.
            if(!value) return '';
            value = value.toString();
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
    },

    // Computed values inside the data model.
    computed: {
        modified: function() {
            // Return true if the testcase has been modified.
            if(this.testcase_as_loaded === undefined) return false;

            // Make a deep comparison.
            return !_.isEqual(this.testcase, this.testcase_as_loaded);
        },
        testcase_as_json: {
            // Get or set the testcase as JSON text.
            get: function() {
                // Pretty print JSON with 4 spaces at the start of each line.
                return JSON.stringify(this.testcase, undefined, 4);
            },
            set: function(jsonText) {
                this.testcase = JSON.parse(jsonText);
            }
        },
        doi_without_prefix: {
            // Extract the DOI from the '@id' or 'url'.
            get: function() {
                // Is there a DOI? If so, use that.
                if(this.testcase.hasOwnProperty('doi') && this.testcase.doi != "") {
                    return this.testcase.doi;
                }

                // If not, look for a DOI among the '@id' and the 'url'.
                return identify_doi(this.testcase);
            },
            set: function(newDOI) {
                // Set the DOI.
                this.testcase.doi = newDOI;
            }
        },
        doi_as_url: function() {
            // We compute this from testcase.doi, which should always be without
            // the prefix.
            return this.DOI_PREFIX + this.testcase.doi;
        }
    },

    // Methods for carrying out various tasks.
    methods: {
        // Helper methods.
        open_url: function(url, target='_blank') {
            // Open the specified URL.
            if(url === undefined || url === null) return;
            if(url == "") return;

            window.open(url, target);
        },
        create_or_append: function(dict, key, value) {
            // A common case is where we need to append to an array for a key
            // in a dictionary, but we don't know if the key exists or not.
            // Furthermore, in order for Vue to track the new array, it needs
            // to be set using Vue.set. This method takes care of all of this.

            if(!(key in dict)) Vue.set(dict, key, []);
            dict[key].push(value);
            return dict;
        },
        confirm(message, func) {
            if(window.confirm(message)) func();
        },

        // Data model management methods.
        load_phyx_from_url: function(url) {
            // Change the current PHYX to that in the provided URL.
            // Will ask the user to confirm before replacing it.

            $.getJSON(url, function(data) {
                display_testcase(data);
            }).fail(function(error) {
                console.log("Could not load PHYX file '", url, "': ", error);
                if(error.status == 200) {
                    alert("Could not load PHYX file '" + url + "': file malformed, see console for details.");
                } else {
                    alert("Could not load PHYX file '" + url + "': server error " + error.status + " " + error.statusText);
                }
            });
        },

        // User interface helper methods.
        close_current_study: function() {
            // Close the current study. If it has been modified,
            // warn the user before closing in order to allow changes to be
            // saved.

            if(this.modified) {
                return confirm("This study has been modified! Are you sure you want to close it?");
            } else {
                return true;
            }
        },
        start_tunit_editor_modal: function(type, label, tunit_list_container) {
            // Start a modal dialog box that allows the taxonomic units associated
            // with either a specifier or a node to be edited.
            //  - type: must be 'specifier' or 'node'
            //  - label: the label of the TUnit list container being edited.
            //      This is not currently used for any processing or filtering,
            //      but is used solely to let the user know what they are editing.
            //  - tunit_list_container: an object that has a 'referencesTaxonomicUnits'
            //      property (for specifiers) or 'representsTaxonomicUnits' property
            //      (for nodes), from which we can extract a list of taxonomic units.

            // Check that the list container is defined.
            if(tunit_list_container === null || tunit_list_container === undefined) {
                throw "Tunit editor modal started with undefined or null taxonomic unit list container";
            }

            // Look for the taxonomic units depending on type.
            if(type == 'specifier') {
                // Specifiers store their taxonomic units in their
                // 'referencesTaxonomicUnits' property.

                // Specifiers store their tunit list in referencesTaxonomicUnits.
                if(!tunit_list_container.hasOwnProperty('referencesTaxonomicUnits'))
                    Vue.set(tunit_list_container, 'referencesTaxonomicUnits', []);

                this.selected_tunit_list_container = {
                    'type': 'specifier',
                    'label': label,
                    'container': tunit_list_container,
                    'list': tunit_list_container.referencesTaxonomicUnits
                };
            } else if (type == 'node') {
                // Nodes store their taxonomic units in their
                // 'representsTaxonomicUnits' property.

                if(!tunit_list_container.hasOwnProperty('representsTaxonomicUnits'))
                    Vue.set(tunit_list_container, 'representsTaxonomicUnits', []);

                this.selected_tunit_list_container = {
                    'type': 'node',
                    'label': label,
                    'container': tunit_list_container,
                    'list': tunit_list_container.representsTaxonomicUnits
                };

            } else {
                throw "Tunit editor modal started with invalid type: " + type + ".";
            }

            // If we don't have a first tunit, create an empty, blank one
            // so we don't have to display an empty website.
            if(this.selected_tunit_list_container.list.length > 0) {
                // We have a first tunit, so select it!
                this.selected_tunit = this.selected_tunit_list_container.list[0];
            } else {
                // Specifier doesn't represent any taxonomic unit, but it's
                // bad UX to just display a blank screen. So let's create a
                // blank taxonomic unit to work with.
                var new_tunit = this.create_empty_taxonomic_unit();
                this.selected_tunit_list_container.list.push(new_tunit);
                this.selected_tunit = new_tunit;
            }

            // Make the modal draggable and display it.
            $('.modal-dialog').draggable({
                handle: '.modal-header'
            });
            $('#tunit-editor-modal').modal();
        },
        close_tunit_editor_modal: function() {
            // Close the taxonomic unit editor modal.

            // We've set up a data-dismiss to do that, so we don't need to do
            // anything here, but the function is here in case we need it later.
        },

        // Methods for listing and modifying specifiers.
        get_specifiers: function(phyloref) {
            // Combine the internal and external specifiers into a single list,
            // with internal specifiers before external specifiers.

            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];

            specifiers = phyloref.internalSpecifiers;
            specifiers = specifiers.concat(phyloref.externalSpecifiers);
            return specifiers;
        },
        get_specifier_type: function(phyloref, specifier) {
            // For a given specifier, return a string indicating whether it is
            // an 'Internal' or 'External' specifier.

            if(phyloref.hasOwnProperty('internalSpecifiers') && phyloref.internalSpecifiers.includes(specifier)) return "Internal";
            if(phyloref.hasOwnProperty('externalSpecifiers') && phyloref.externalSpecifiers.includes(specifier)) return "External";
            return "Specifier";
        },
        set_specifier_type: function(phyloref, specifier, specifier_type) {
            // Change the type of a given specifier. To do this, we first need
            // to determine if it was originally an internal or external
            // specifier, then move it into the other list.

            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];

            if(specifier_type == 'Internal') {
                index = phyloref.externalSpecifiers.indexOf(specifier);
                if(index != -1)
                    phyloref.externalSpecifiers.splice(index, 1);

                if(!phyloref.internalSpecifiers.includes(specifier))
                    phyloref.internalSpecifiers.unshift(specifier);
            } else if(specifier_type == 'External') {
                index = phyloref.internalSpecifiers.indexOf(specifier);
                if(index != -1)
                    phyloref.internalSpecifiers.splice(index, 1);

                if(!phyloref.externalSpecifiers.includes(specifier))
                    phyloref.externalSpecifiers.unshift(specifier);
            } else {
                // Neither internal nor external? Ignore.
            }
        },
        delete_specifier: function(phyloref, specifier) {
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
        get_taxonomic_unit_label: function(tu) {
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
                    if('scientificName' in scname) labels.push(scname.scientificName);
                }
            }

            // Any specimens?
            if('includesSpecimens' in tu) {
                for(specimen of tu.includesSpecimens) {
                    if('occurrenceID' in specimen) labels.push("Specimen " + specimen.occurrenceID);
                }
            }

            // Any external references?
            if('externalReferences' in tu) {
                for(external_ref of tu.externalReferences) {
                    labels.push("<" + external_ref + ">");
                }
            }

            if(labels.length == 0) return "Unnamed taxonomic unit";

            return labels.join(', ');
        },
        get_specifier_label: function(specifier) {
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
                var labels = specifier.referencesTaxonomicUnits.map(function(tu) { return vm.get_taxonomic_unit_label(tu); });
                if(labels.length > 0) return labels.join('; ');
            }

            // No idea!
            return "Unnamed specifier";
        },
        get_phyloref_label: function(phyloref) {
            // Try to determine what the label of a particular phyloreference is,
            // or default to 'Phyloreference <count>'. This checks the 'label' and
            // 'title' properties, and truncates them to 50 characters.

            phyloref_index = this.testcase.phylorefs.indexOf(phyloref);
            potential_label = "Phyloreference " + (phyloref_index + 1);

            if(phyloref.hasOwnProperty('label')) potential_label = phyloref.label;
            if(phyloref.hasOwnProperty('title')) potential_label = phyloref.title;

            if(potential_label.length > 54)
                return potential_label.substr(0, 50) + " ...";

            return potential_label;
        },
        get_phylogeny_as_newick: function(node_expr, phylogeny) {
            // Returns the phylogeny as a Newick string. Since this method is
            // called frequently in rendering the "Edit as Newick" textareas,
            // we hijack it to redraw the phylogenies.

            // Redraw the phylogeny.
            let phylotree = render_tree(node_expr, phylogeny);

            // Return the Newick string that was rendered.
            if(phylotree === undefined)
                return "()";

            return phylotree.get_newick_with_internal_labels();
        },

        // Methods for creating new, empty data model elements.
        create_empty_phyloref: function(count) {
            // Create an empty phyloreference. We label it, but leave other
            // fields blank.

            return {
                label: "Phyloreference " + count,
                cladeDefinition: "",
                internalSpecifiers: [],
                externalSpecifiers: []
            }
        },
        create_empty_specifier: function(count) {
            // Create an empty specifier. No fields are required, so we
            // create a blank object and return that.

            return {};
        },
        create_empty_taxonomic_unit: function(count) {
            // Create an empty taxonomic unit. No fields are required, so
            // we create a blank object and return that.

            return {};
        },

        // Methods for parsing scientific name.
        get_scname_components: function(scname) {
            // Return the components of a scientific name by splitting its
            // scientificName field using spaces.

            if(!scname.hasOwnProperty('scientificName')) return [];
            return scname.scientificName.split(/\s+/);
        },
        get_genus_name: function(scname) {
            // Guess the genus name of a scientific name by using its first component.

            comps = this.get_scname_components(scname);
            if(comps.length >= 1) return comps[0];
            return undefined;
        },
        get_specific_epithet_name: function(scname) {
            // Get the specific epithet name of a scientific name by using its
            // second component.

            comps = this.get_scname_components(scname);
            if(comps.length >= 2) return comps[1];
            return undefined;
        },
        get_binomial_name: function(scname) {
            // Get the binomial name of a scientific name by combining its
            // first and second components.

            genus = this.get_genus_name(scname);
            specificEpithet = this.get_specific_epithet_name(scname);

            if(genus != undefined && specificEpithet != undefined) return genus + " " + specificEpithet;
            return undefined;
        },

        // Methods for parsing specimen identifiers.
        get_specimen_components: function(specimen) {
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
        get_institution_code: function(specimen) {
            // Extract an institution code from the occurrence ID. If only
            // two components are provided, we assume they are the institution
            // code and the catalog number.

            comps = this.get_specimen_components(specimen);
            if(comps.length == 1) return undefined;
            if(comps.length == 2) return comps[0];
            if(comps.length >= 3) return comps[0];
            return undefined;
        },
        get_collection_code: function(specimen) {
            // Extract a collection code from the occurrence ID. If only
            // two components are provided, we assume they are the institution
            // code and the catalog number, and so no collection code is extracted.

            comps = this.get_specimen_components(specimen);
            if(comps.length >= 3) return comps[1];
            return undefined;
        },
        get_catalog_number: function(specimen) {
            // Extract a catalog number from the occurrence ID. If only one
            // component is provided, we assume that it is the catalog number.
            // If only two components are provided, we assume they are the
            // institution code and the catalog number.

            comps = this.get_specimen_components(specimen);
            if(comps.length == 1) return comps[0];
            if(comps.length == 2) return comps[1];
            if(comps.length >= 3) return comps[2];
            return undefined;
        },

        // Methods for manipulating phyloreferences.
        change_selected_phyloref: function(change_to) {
            // Change the selected phyloreference in different ways.

            if(Number.isInteger(change_to)) {
                // Increase or decrease the selected phyloreference by the
                // given number of steps.

                // Do we have a selected phyloref? If not, select the first one.
                if(this.selected_phyloref === undefined) {
                    if(this.testcase.phylorefs.length > 0) {
                        // Select the first phyloreference.
                        this.selected_phyloref = this.testcase.phylorefs[0];
                    } else {
                        // We have no phyloreferences to select! Do nothing.
                    }

                    return;
                }

                // We have a selected phyloreference. Switch to the previous or
                // next one, wrapping at the length.
                let current_phyloref_index = this.testcase.phylorefs.indexOf(this.selected_phyloref);
                let new_phyloref_index = (current_phyloref_index + change_to) % this.testcase.phylorefs.length;

                // If we decrement past zero, wrap around to the length.
                if(new_phyloref_index < 0) new_phyloref_index = (this.testcase.phylorefs.length + new_phyloref_index);

                // Switch to the new selected phyloref.
                console.log("New phyloref_index: ", new_phyloref_index);
                this.selected_phyloref = this.testcase.phylorefs[new_phyloref_index];
                return;
            }
        },

        // Methods for manipulating nodes in phylogenies.
        get_node_labels_in_phylogeny: function(phylogeny) {
            // Return an iterator to all the node labels in a phylogeny. These
            // node labels come from two sources:
            //  1. We look for node names in the Newick string.
            //  2. We look for node names in the additionalNodeProperties.
            //
            // This means that we can pick up both (1) nodes in the Newick
            // string without any additional properties, and (2) nodes with
            // additional node properties which are not present.

            var node_labels = new Set();

            // Names from the Newick string.
            var newick = phylogeny.newick;
            if(newick == null)
                newick = '()';
            console.log("get_node_labels_in_phylogeny(" + newick + ")");

            // Use PhyloTree's Newick parser to convert the Newick string
            // into a tree-based representation, which we can recurse through
            // to extract all the labels.
            //
            // TODO: In later versions, we will make the parsed Newick tree
            // directly accessible, so we should replace this code to just
            // recurse through that tree instead of re-parsing the Newick string.
            var parsed = d3.layout.newick_parser(newick);
            if(parsed.hasOwnProperty('json')) {
                var add_node_and_children_to_node_labels = function(node) {
                    // console.log("Recursing into: " + JSON.stringify(node));

                    if(node.hasOwnProperty('name') && node.name != '')
                        node_labels.add(node.name);

                    if(node.hasOwnProperty('children')) {
                        for(child of node.children) {
                            add_node_and_children_to_node_labels(child);
                        }
                    }
                };

                // Recurse away!
                add_node_and_children_to_node_labels(parsed.json);
            }

            // Names from additionalNodeProperties
            if(phylogeny.hasOwnProperty('additionalNodeProperties')) {
                for(key of Object.keys(phylogeny.additionalNodeProperties)) {
                    node_labels.add(key);
                }
            }

            return Array.from(node_labels);
        },

        // Return a list of taxonomic units for a node label.
        get_tunits_for_node_label_in_phylogeny: function(phylogeny, node_label) {
            // Look up additional node properties.
            var additionalNodeProperties = {};
            if(
                phylogeny.hasOwnProperty('additionalNodeProperties') &&
                phylogeny.additionalNodeProperties.hasOwnProperty(node_label)
            ) {
                additionalNodeProperties = phylogeny.additionalNodeProperties[node_label];
            }

            // If there are explicit taxonomic units in the
            // representsTaxonomicUnits property, we need to use those.
            if(additionalNodeProperties.hasOwnProperty('representsTaxonomicUnits')) {
                return additionalNodeProperties.representsTaxonomicUnits;
            }

            // If that doesn't work, we can try to extract scientific names from
            // the node label.
            let tunits = [];
            for(let tunit of extract_tunits_from_node_label(node_label.trim())) {
                tunits.push(tunit);
            }

            return tunits;
        },

        // Taxonomic unit matching!
        get_all_node_labels_matched_by_specifier: function(specifier) {
            // Return a list of node labels matched by a given specifier.
            // Wrapper for running get_node_labels_matched_by_specifier() on
            // all currently loaded phylogenies.

            let node_labels_with_prefix = [];

            let prefix = "phylogeny_";
            let prefix_count = 0;
            for(let phylogeny of this.testcase.phylogenies) {
                for(let node_label of this.get_node_labels_matched_by_specifier(specifier, phylogeny)) {
                    node_labels_with_prefix.push(prefix + prefix_count + ":" + node_label);
                }
                prefix_count++;
            }

            return node_labels_with_prefix;
        },

        get_node_labels_matched_by_specifier: function(specifier, phylogeny) {
            // Return a list of node labels matched by a given specifier on
            // a given phylogeny.
            // Wrapper for test_whether_specifier_match_node() on every node label in
            // a given phylogeny.

            let local_vm = this;

            return local_vm.get_node_labels_in_phylogeny(phylogeny).filter(function(node_label) {
                return local_vm.test_whether_specifier_match_node(specifier, phylogeny, node_label);
            });
        },

        test_whether_specifier_match_node: function(specifier, phylogeny, node_label) {
            // Tests whether a specifier matches a node in a phylogeny.

            // Does the specifier have any taxonomic units? If not, we can't
            // match anything!
            if(!specifier.hasOwnProperty('referencesTaxonomicUnits'))
                return false;

            // Find all the taxonomic units associated with the specifier and
            // with the node.
            let specifier_tunits = specifier.referencesTaxonomicUnits;
            let node_tunits = this.get_tunits_for_node_label_in_phylogeny(phylogeny, node_label);

            // Attempt pairwise matches between taxonomic units in the specifier
            // and associated with the node.
            for(let tunit1 of specifier_tunits) {
                for(let tunit2 of node_tunits) {
                    if(
                        test_whether_tunits_match_by_binomial_name(tunit1, tunit2) ||
                        test_whether_tunits_match_by_external_references(tunit1, tunit2) ||
                        test_whether_tunits_match_by_specimen_identifier(tunit1, tunit2)
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
 * test_whether_tunits_match_by_external_references(tunit1, tunit2)
 *
 * Test whether two Tunits have matching external references.
 */
function test_whether_tunits_match_by_external_references(tunit1, tunit2) {
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
 * test_whether_scnames_match_by_binomial_name(scname1, scname2)
 *
 * Test whether two scientific names match on the basis of their binomial names.
 */
function test_whether_scnames_match_by_binomial_name(scname1, scname2) {
    // Step 1. Try matching by explicit binomial name, if one is available.
    if(scname1.hasOwnProperty('binomialName') && scname2.hasOwnProperty('binomialName')) {
        if(scname1.binomialName.trim() !== '' && scname1.binomialName.toLowerCase().trim() === scname2.binomialName.toLowerCase().trim())
            return true;
    }

    // Step 2. Otherwise, try to extract the binomial name from the scientificName
    // and compare those.
    let binomial1 = vm.get_binomial_name(scname1);
    let binomial2 = vm.get_binomial_name(scname2);

    if(binomial1 !== undefined && binomial2 !== undefined && binomial1.trim() !== '' && binomial1.trim() === binomial2.trim())
        return true;

    return false;
}

/**
 * test_whether_tunits_match_by_binomial_name(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their binomial names.
 */
function test_whether_tunits_match_by_binomial_name(tunit1, tunit2) {
    //

    if(tunit1 === undefined || tunit2 === undefined) return false;
    if(tunit1.hasOwnProperty('scientificNames') && tunit2.hasOwnProperty('scientificNames')) {
        // Each external reference is a URL as a string.
        for(let scname1 of tunit1.scientificNames) {
            for(let scname2 of tunit2.scientificNames) {
                if(test_whether_scnames_match_by_binomial_name(scname1, scname2))
                    return true;
            }
        }
    }

    return false;
}

/**
 * test_whether_tunits_match_by_specimen_identifier(tunit1, tunit2)
 *
 * Test whether two Tunits match on the basis of their specimen identifiers.
 */
function test_whether_tunits_match_by_specimen_identifier(tunit1, tunit2) {
    if(tunit1 === undefined || tunit2 === undefined) return false;
    if(tunit1.hasOwnProperty('includesSpecimens') && tunit2.hasOwnProperty('includesSpecimens')) {
        // Convert specimen identifiers (if present) into a standard format and compare those.
        for(let specimen1 of tunit1.includesSpecimens) {
            for(let specimen2 of tunit2.includesSpecimens) {
                if(
                    get_specimen_identifier_as_urn(specimen1) !== undefined &&
                    get_specimen_identifier_as_urn(specimen2) !== undefined &&
                    get_specimen_identifier_as_urn(specimen1) === get_specimen_identifier_as_urn(specimen2)
                )
                    return true;
            }
        }
    }

    return false;
}

/**
 * get_specimen_identifier_as_urn(specimen)
 *
 * Given a specimen, return a specimen identifier as a URN in the form:
 *   "urn:catalog:" + institutionCode (if present) + ':' + collectionCode (if present) + ':' + catalogNumber (if present)
 */
function get_specimen_identifier_as_urn(specimen) {

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
 * get_tunits_from_node_label(node_label)
 *
 * Given a node label, attempt to parse it as a scientific name.
 * Returns a list of taxonomic units.
 */
function extract_tunits_from_node_label(node_label) {
    if(node_label === undefined || node_label === null) return [];

    // Check if the label starts with a binomial name.
    var results = /^([A-Z][a-z]+) ([a-z\-]+)\b/.exec(node_label);
    if(results !== null) {
        return [{
            'scientificNames': [{
                'scientificName': node_label,
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
 * identify_doi(testcase)
 *
 * DOIs should be entered into their own 'doi' field. This method looks through
 * all possible places where a DOI might be entered -- including the study @id
 * and the 'url' field -- and attempts to extract a DOI using the regular
 * expression DOI_REGEX.
 *
 * @return The best guess DOI or undefined.
 */
function identify_doi(testcase) {
    const DOI_REGEX = /^https?:\/\/(?:dx\.)?doi\.org\/(.+?)[\#\/]?$/i;

    var possibilities = [];

    if(testcase.hasOwnProperty('doi')) {
        possibilities.push(testcase['doi']);
    }

    if(testcase.hasOwnProperty('@id')) {
        possibilities.push(testcase['@id']);
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
 * display_testcase(testcase)
 *
 * Updates the user interface to reflect the new JSON document provided in 'testcase'.
 */
function display_testcase(testcase) {
    if(!vm.close_current_study()) return;

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
            testcase.doi = identify_doi(testcase);
        }

        // Deep-copy the testcase into a 'testcase_as_loaded' variable in our
        // model. We deep-compare vm.testcase with vm.testcase_as_loaded to
        // determine if the loaded model has been modified.
        vm.testcase_as_loaded = jQuery.extend(true, {}, testcase);
        vm.testcase = testcase;

        // Reset all UI selections.
        vm.selected_phyloref = undefined;
        vm.selected_specifier = undefined;
        vm.selected_tunit = undefined;

    } catch(err) {
        console.log("Error occurred while displaying new testcase: " + err);
    }
}

/**
 * load_json_from_local(file_input)
 *
 * Load a JSON file from the local file system using FileReader. file_input
 * needs to be an HTML element representing an <input type="file"> in which
 * the user has selected the local file they wish to load.
 *
 * This code is based on https://stackoverflow.com/a/21446426/27310
 */
function load_json_from_local(file_input) {
    if(typeof window.FileReader !== 'function') {
        alert("The FileReader API is not supported on this browser.");
        return;
    }

    if(!file_input) {
        alert("Programmer error: No file input element specified.");
        return;
    }

    if(!file_input.prop('files')) {
        alert("File input element found, but files property missing: try another browser?");
        return;
    }

    if(!file_input.prop('files')[0]) {
        alert("Please select a file before attempting to load it.");
        return;
    }

    file = file_input.prop('files')[0];
    fr = new FileReader();
    fr.onload = function(e) {
        lines = e.target.result;
        testcase = JSON.parse(lines);
        display_testcase(testcase);
    };
    fr.readAsText(file);
}

/**
 * render_tree(node_expr, phylogeny) {
 * Given a phylogeny, try to render it as a tree using Phylotree.
 *
 * 'node_expr' is the expression provided to d3.select(...) to indicate the
 *   SVG node to draw the phylogeny into.
 * 'phylogeny' is a Phylogeny in the data model.
 */
function render_tree(node_expr, phylogeny) {
    // No point trying to render anything without a Vue model.
    if(vm === undefined) return undefined;

    console.log("render_tree(" + node_expr + ", " + phylogeny + ") on selected phyloref " + vm.selected_phyloref);

    // Extract the Newick string to render.
    let newick = "()";
    if(phylogeny.hasOwnProperty('newick')) newick = phylogeny.newick;

    // The node styler provides information on styling nodes within the
    // phylogeny.
    var nodeStyler = function (element, data) {
        if(data.hasOwnProperty('name') && data.children) {
            // If the node has a label and has children (i.e. is an internal node),
            // we display it next to the node by creating a new 'text' element.

            // Make sure we don't already have an internal label node on this SVG node!
            var label = element.selectAll(".internal_label");
            if(label.empty()) {
                var text_label = element.append("text");

                // TODO: Once we're happy with how these elements look,
                // we should move all this complexity into CSS classes.
                text_label.classed("internal-label", true)
                    .text(data.name)
                    .attr("dx", ".3em")
                    .attr("dy", ".3em")
                    .attr("text-anchor", "start")
                    .attr("alignment-baseline", "middle");

                // If the internal label has the same label as the currently
                // selected phyloreference, make it bolder and turn it blue.
                if(
                    vm.selected_phyloref !== undefined &&
                    vm.selected_phyloref.hasOwnProperty('label') &&
                    vm.selected_phyloref.label == data.name
                ) {
                    text_label.classed("selected-internal-label", true);
                }
            }
        }

        if(data.name !== undefined && data.children === undefined) {
            // Labeled leaf node! Look for taxonomic units.
            var tunits = vm.get_tunits_for_node_label_in_phylogeny(phylogeny, data.name);

            if(tunits.length == 0) {
                element.classed('terminal-node-without-tunits', true);
            } else if(vm.selected_phyloref !== undefined) {
                // If there's a selected phyloref, we should highlight
                // specifiers:
                //  - internal specifier in green
                //  - external specifier in red
                if(vm.selected_phyloref.hasOwnProperty('internalSpecifiers')) {
                    for(let specifier of vm.selected_phyloref.internalSpecifiers) {
                        if(vm.test_whether_specifier_match_node(specifier, phylogeny, data.name)) {
                            element.classed('node internal-specifier-node', true);
                        }
                    }
                }
                if(vm.selected_phyloref.hasOwnProperty('externalSpecifiers')) {
                    for(let specifier of vm.selected_phyloref.externalSpecifiers) {
                        if(vm.test_whether_specifier_match_node(specifier, phylogeny, data.name)) {
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
        .svg(d3.select(node_expr))
        .options({
            "transitions": false
        })
        .style_nodes(nodeStyler);
    tree(d3.layout.newick_parser(newick));

    // Phylotree supports reading the tree back out as Newick, but their Newick
    // representation doesn't annotate internal nodes. We add a method to allow
    // us to do that here.
    tree.get_newick_with_internal_labels = function() {
        return this.get_newick(function(node) {
            // Don't annotate terminal nodes.
            if(!node.children) return;

            // For internal nodes, annotate with their names.
            return node['name'];
        }) + ";";
        // ^ tree.get_newick() doesn't add the final semicolon, so we do
        //   that here.
    };

    tree.get_nodes().forEach(function(node) {
        // All nodes (including named nodes) can be renamed.
        // Renaming a node will cause the phylogeny.newick property to
        // be changed, which should cause Vue.js to cause the tree to be
        // re-rendered.
        let label = node['name'];
        let is_node_labeled = (label !== undefined && label.trim() != '');

        d3.layout.phylotree.add_custom_menu(
            node,
            function(node) { return "Edit label: " + (is_node_labeled ? label : "none"); },
            function() {
                // Ask the user for a new label.
                let result = window.prompt(
                    "Please choose a new label for " +
                        (is_node_labeled ? "the node labeled '" + label + "'" : "the selected unlabeled node"),
                    (is_node_labeled ? label : "")
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
                let new_newick = tree.get_newick_with_internal_labels();
                console.log("Newick string updated to: ", new_newick);
                phylogeny.newick = new_newick;
            }
        );

        // Only relevant for labeled nodes.
        if(is_node_labeled) {
            // Add custom menu items: display all taxonomic units and provide
            // a menu item to edit them.
            var tunits = vm.get_tunits_for_node_label_in_phylogeny(phylogeny, node.name);
            for(var tunit of tunits) {
                if(node.name !== "") {
                    d3.layout.phylotree.add_custom_menu(
                        node,
                        function(node) {
                            console.log("Displaying label for: ", tunit);
                            return "Taxonomic unit: " + vm.get_taxonomic_unit_label(tunit);
                        },
                        function() {
                            // TODO: deduplicate this code with the one below.
                            // console.log("Edit taxonomic units activated with: ", node);

                            if(!phylogeny.hasOwnProperty('additionalNodeProperties'))
                                Vue.set(phylogeny, 'additionalNodeProperties', {});
                            if(!phylogeny.additionalNodeProperties.hasOwnProperty(node.name))
                                Vue.set(phylogeny.additionalNodeProperties, node.name, {
                                    'representsTaxonomicUnits': vm.get_tunits_for_node_label_in_phylogeny(phylogeny, node.name)
                                });


                            // console.log("Setting selected tunit list to: ", phylogeny.representsTaxonomicUnits[node.name]);

                            vm.start_tunit_editor_modal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
                        }
                    );
                }
            }

            if(node.name !== "") {
                d3.layout.phylotree.add_custom_menu(
                    node,
                    function(node) { return "Edit taxonomic units"; },
                    function() {
                        // console.log("Edit taxonomic units activated with: ", node);

                        if(!phylogeny.hasOwnProperty('additionalNodeProperties'))
                            Vue.set(phylogeny, 'additionalNodeProperties', {});
                        if(!phylogeny.additionalNodeProperties.hasOwnProperty(node.name))
                            Vue.set(phylogeny.additionalNodeProperties, node.name, {
                                'representsTaxonomicUnits': vm.get_tunits_for_node_label_in_phylogeny(phylogeny, node.name)
                            });

                        // console.log("Setting selected tunit list to: ", phylogeny.representsTaxonomicUnits[node.name]);

                        vm.start_tunit_editor_modal('node', node.name, phylogeny.additionalNodeProperties[node.name]);
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
