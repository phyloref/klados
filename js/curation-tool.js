/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// GLOBAL VARIABLES
// Set up the Vue object which contains the entire model.
var vm = new Vue({
    // The element to install Vue onto.
    el: '#app',

    // The data, consisting of the model and UI elements.
    data: {
        // Constants: used during rendering.
        DOI_PREFIX: "https://dx.doi.org/",

        // The key data model.
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
        selected_phylogeny: undefined,
        selected_phyloref: undefined,
        selected_specifier: undefined,
        selected_tunit: undefined,

        // Display the delete buttons on the specifiers.
        specifier_delete_mode: false,

        // Display one of the two dropdown menus for the specifiers.
        specifier_dropdown_target: 'none'
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
        open_url: function(url) {
            // Open the specified URL.
            if(url === undefined || url === null) return;
            if(url == "") return;

            window.open(url);
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
        start_specifier_modal: function(specifier) {
            // Display the specifier modal. We need to prepare the specifier
            // in order for the modal to work correctly.
            if(specifier === undefined || specifier === null) return;
            vm.selected_specifier = specifier;

            if(specifier.hasOwnProperty('references_taxonomic_units') && specifier.references_taxonomic_units.length > 0) {
                // We have a first tunit, so select it!
                vm.selected_tunit = specifier.references_taxonomic_units[0];
            } else {
                // Specifier doesn't represent any taxonomic unit, but it's
                // bad UX to just display a blank screen. So let's create a
                // blank taxonomic unit to work with.
                var new_tunit = this.create_empty_taxonomic_unit();
                specifier.referencesTaxonomicUnits = [new_tunit];
                vm.selected_tunit = new_tunit;
            }

            // Make the modal draggable and display it.
            $('.modal-dialog').draggable({
                handle: '.modal-header'
            });
            $('#specifier-modal').modal();
        },
        close_specifier_modal: function(specifier) {
            // Close the specifier modal.

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
            // we hijack it to redraw the phylogenies, which results in an
            // annoying flickering effect whenever the model changes but ensures
            // that the drawn phylogeny is in sync with the model.

            // If no Newick tree is available, default to '()'.
            newick = "()";
            if(phylogeny.hasOwnProperty('newick')) newick = phylogeny.newick;

            // Redraw the phylogeny.
            render_tree(node_expr, newick);

            // Return the Newick string that was rendered.
            return newick;
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
        }
    }
});

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
        vm.selected_phylogeny = undefined;
        vm.selected_specifier = undefined;
        vm.selected_tunit = undefined;

        phylogeny_index = 0;
        for(phylogeny in vm.testcase.phylogenies) {
            console.log("render_on_load: " + get_phylogeny_as_newick('#phylogeny-svg-' + phylogeny_index, phylogeny));
            phylogeny_index++;
        }

    } catch(err) {
        console.log("Error occurred while displaying new testcase: " + err);
    }
}

/**
 * load_json_from_url(url)
 *
 * Load a JSON from the provided URL. This either needs to be a JSONP request or
 * on the same domain as this website.
 */
function load_json_from_url(url) {
    $.getJSON(url, function(data) {
        display_testcase(data);
    });
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
 * render_tree(node_expr, newick) {
 * Given a Newick string in 'newick', try to render it as a tree using Phylotree.
 *
 * 'node_expr' should be a node expression for an SVG element (e.g. '#svg').
 */
function render_tree(node_expr, newick) {
    // Which phylogeny is currently selected?
    var selected_phyloref = undefined;
    if(vm !== undefined) selected_phyloref = vm.selected_phyloref;

    console.log("render_tree(" + node_expr + ", " + newick + ") on selected phyloref " + selected_phyloref);

    // The node styler provides information on styling nodes within the
    // phylogeny.
    var nodeStyler = function (element, data) {
        if(data.hasOwnProperty('internal_label')) {
            // If the node has an internal label (see below), we display it
            // next to the node by creating a new 'text' element.

            // Make sure we don't already have an internal label node on this SVG node!
            var label = element.selectAll(".internal_label");
            if(label.empty()) {
                var text_label = element.append("text");

                // TODO: Once we're happy with how these elements look,
                // we should move all this complexity into CSS classes.
                text_label.classed("internal_label", true)
                    .text(data.internal_label)
                    .attr("dx", ".4em")
                    .attr("dy", ".3em")
                    .style("font-style", "italic")
                    .attr("text-anchor", "start")
                    .attr("alignment-baseline", "middle");

                // If the internal label has the same label as the currently
                // selected phyloreference, make it bolder and turn it blue.
                if(
                    selected_phyloref !== undefined &&
                    selected_phyloref.hasOwnProperty('label') &&
                    selected_phyloref.label == data.internal_label
                ) {
                    text_label.style('fill', 'blue')
                        .style('font-weight', 'bolder');
                }
            }
        }
    }

    var tree = d3.layout.phylotree()
        .svg(d3.select(node_expr))
        .options({
            "transitions": false
        })
        .style_nodes(nodeStyler);
    tree(d3.layout.newick_parser(newick));

    _.each(tree.get_nodes(), function(node) {
        if(node.children && node.name.startsWith("expected_")) {
            node.internal_label = node.name.substring(9);
            // console.log(node.internal_label)
        }
    });

    tree
        .spacing_x(20).spacing_y(50)
        .placenodes()
        .update()
    ;
}
