/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// How to identify DOIs.
const DOI_REGEX = /^https?:\/\/(?:dx\.)?doi\.org\/(.+?)[\#\/]?$/i;
const DOI_PREFIX = "https://dx.doi.org/";

// Global variables
var vm = new Vue({
    el: '#app',
    data: {
        // Data model: a testcase and flag indicating whether it has been
        // modified.
        modified: false,
        testcase: {
            '@id': "",
            'doi': "",
            'url': "",
            'citation': "",
            'phylogenies': [{}],
            'phylorefs': []
        },

        // Constants
        DOI_PREFIX: DOI_PREFIX,

        // Variables containing UI renders

        // Global
        selected_phylogeny: null,
        selected_phyloref: null,
        selected_specifier: null,

        // Specific to the specifier modal
        selected_tunit: null,

        // Specific to the specifier dropdown and
        // a hack to get around Bootstrap not allowing
        specifier_dropdown_target: 'none',
        specifier_delete_mode: false
    },
    computed: {
        testcase_as_json: {
            // Get or set the testcase as JSON text.
            get: function() {
                return JSON.stringify(this.testcase, null, 4);
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

                // Might be in '@id' or in 'url'!
                var possibilities = [];
                if(this.testcase.hasOwnProperty('@id')) {
                    possibilities.push(this.testcase['@id']);
                }

                if(this.testcase.hasOwnProperty('url')) {
                    possibilities.push(this.testcase.url);
                }

                // Look for possible matches.
                for(possibility of possibilities) {
                    matches = DOI_REGEX.exec(possibility);

                    if(matches) {
                        this.testcase.doi = matches[1];
                        return matches[1];
                    }
                }

                // Didn't find anything?
                return null;
            },
            set: function(newDOI) {
                // Definitely set the DOI
                this.testcase.doi = newDOI;

                // Definitely set the URI
                this.testcase['@id'] = DOI_PREFIX + newDOI + "#";

                if(this.testcase.url == "" || DOI_REGEX.test(this.testcase.url)) {
                //|| this.testcase.url.startsWith(DOI_PREFIX)) {
                    this.testcase.url = DOI_PREFIX + newDOI;
                }
            }
        },
        doi_as_url: function() {
            return DOI_PREFIX + this.testcase.doi;
        }
    },
    methods: {
        open_url: function(url) {
            if(url === null) return;
            if(url == "") return;

            // Show it!
            window.open(url);
        },
        get_prop: function(d, k, def) {
            if(k in d) return d[k];
            return def;
        },
        start_specifier_modal: function(specifier) {
            // Display the specifier modal. We need to prepare the specifier
            // in order for the modal to work correctly.
            if(specifier === null) return;
            vm.selected_specifier = specifier;

            // We need externalReferences, scientificNames and includesSpecimens.
            /*
            if('referencesTaxonomicUnits' in specifier) {
                console.log(specifier);
                for(tunit of specifier.referencesTaxonomicUnits) {
                    console.log(tunit);
                    if(!('externalReferences' in tunit)) tunit.externalReferences = [];
                    if(!('scientificNames' in tunit)) tunit.scientificNames = [];
                    if(!('includesSpecimens' in tunit)) tunit.includesSpecimens = [];
                }
            }
            */

            // Automatically select the first tunit.
            vm.selected_tunit = null;
            if(specifier.hasOwnProperty('referencesTaxonomicUnits') && specifier.referencesTaxonomicUnits.length > 0) {
                vm.selected_tunit = specifier.referencesTaxonomicUnits[0];
            } else {
                // Specifier doesn't represent any taxonomic unit, but it's
                // bad UX to just display a blank screen. So let's create a
                // blank taxonomic unit to work with.
                var new_tunit = this.create_empty_taxonomic_unit();
                specifier.referencesTaxonomicUnits = [new_tunit];
                vm.selected_tunit = new_tunit;
            }

            // Go go modal!
            $('.modal-dialog').draggable({
				handle: '.modal-header'
			});
            $('#specifier-modal').modal();
        },
        close_specifier_modal: function(specifier) {
            // Close the specifier modal. This is a good chance to clean up all
            // the mess we created above!
            if(specifier === null) return;

            // Stop stop modal!
            // Actually, we've set up a data-dismiss to do that, so we don't
            // need to close anything here.
        },
        create_or_append: function(dict, key, value) {
            if(!(key in dict)) Vue.set(dict, key, []);
            dict[key].push(value);
            return dict;
        },
        delete_specifier: function(phyloref, specifier) {
            if(phyloref.hasOwnProperty('internalSpecifiers')) {
                var index = phyloref.internalSpecifiers.indexOf(specifier);
                if(index != -1) phyloref.internalSpecifiers.splice(index, 1);
            }

            if(phyloref.hasOwnProperty('externalSpecifiers')) {
                var index = phyloref.externalSpecifiers.indexOf(specifier);
                if(index != -1) phyloref.externalSpecifiers.splice(index, 1);
            }
        },
        get_specifiers: function(phyloref) {
            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];

            specifiers = phyloref.internalSpecifiers;
            specifiers = specifiers.concat(phyloref.externalSpecifiers);
            return specifiers;
        },
        get_specifier_type: function(phyloref, specifier) {
            if(phyloref.hasOwnProperty('internalSpecifiers') && phyloref.internalSpecifiers.includes(specifier)) return "Internal";
            if(phyloref.hasOwnProperty('externalSpecifiers') && phyloref.externalSpecifiers.includes(specifier)) return "External";
            return "Specifier";
        },
        set_specifier_type: function(phyloref, specifier, specifier_type) {
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
        create_empty_phyloref: function(count) {
            return {
                label: "Phyloreference " + count,
                cladeDefinition: "",
                internalSpecifiers: [],
                externalSpecifiers: []
            }
        },
        create_empty_specifier: function(count) {
            return {};
        },
        create_empty_taxonomic_unit: function(count) {
            return {};
        },
        get_taxonomic_unit_label: function(tu) {
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
            // Is this specifier even non-null?
            if(specifier == null) return "(null)";

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
            phyloref_index = this.testcase.phylorefs.indexOf(phyloref);
            potential_label = "Phyloreference " + (phyloref_index + 1);

            if(phyloref.hasOwnProperty('label')) potential_label = phyloref.label;
            if(phyloref.hasOwnProperty('title')) potential_label = phyloref.title;

            if(potential_label.length > 54)
                return potential_label.substr(0, 50) + " ...";

            return potential_label;
        },
        get_phylogeny_as_newick: function(node_expr, phylogeny) {
            newick = "()";

            console.log("get_phylogeny_as_newick(" + node_expr + ", " + phylogeny + ")");

            if(phylogeny.hasOwnProperty('newick')) newick = phylogeny.newick;

            // While we're here ...
            render_tree(node_expr, newick);

            // And return.
            return newick;
        },

        // Methods for parsing scientific name.
        get_scname_components: function(scname) {
            if(!scname.hasOwnProperty('scientificName')) return [];
            return scname.scientificName.split(/\s+/);
        },
        get_binomial_name: function(scname) {
            genus = this.get_genus_name(scname);
            specificEpithet = this.get_specific_epithet_name(scname);

            if(genus != null && specificEpithet != null) return genus + " " + specificEpithet;
            return null;
        },
        get_genus_name: function(scname) {
            comps = this.get_scname_components(scname);
            if(comps.length >= 1) return comps[0];
            return null;
        },
        get_specific_epithet_name: function(scname) {
            comps = this.get_scname_components(scname);
            if(comps.length >= 2) return comps[1];
            return null;
        },

        // Methods for parsing specimen identifiers.
        get_specimen_components: function(specimen) {
            if(!specimen.hasOwnProperty('occurrenceID')) return [];
            return specimen.occurrenceID.split(/\s*:\s*/);
        },
        get_institution_code: function(specimen) {
            comps = this.get_specimen_components(specimen);
            if(comps.length == 1) return null;
            if(comps.length == 2) return comps[0];
            if(comps.length >= 3) return comps[0];
            return null;
        },
        get_collection_code: function(specimen) {
            comps = this.get_specimen_components(specimen);
            if(comps.length >= 3) return comps[1];
            return null;
        },
        get_catalog_number: function(specimen) {
            comps = this.get_specimen_components(specimen);
            if(comps.length == 1) return comps[0];
            if(comps.length == 2) return comps[1];
            if(comps.length >= 3) return comps[2];
            return null;
        }
    }
});

/**
 * Resets UI and updates it to reflect a new JSON document.
 *
 * Most other functions call this function to process the JSON before
 * the UI starts working.
 */
function load_json_from_json(testcase) {
    try {
        // The DOI-to-ID/URL system doesn't work unless some variables
        // are set.
        if(!testcase.hasOwnProperty('@id'))
            testcase['@id'] = "";
        if(!testcase.hasOwnProperty('doi'))
            testcase['doi'] = "";
        if(!testcase.hasOwnProperty('url'))
            testcase['url'] = "";

        // Specifiers act weird unless every phyloreference has both
        // internalSpecifiers and externalSpecifiers set, even if they
        // are blank.
        if(!testcase.hasOwnProperty('phylorefs')) testcase.phylorefs = [];
        for(phyloref of testcase.phylorefs) {
            if(!phyloref.hasOwnProperty('internalSpecifiers')) phyloref.internalSpecifiers = [];
            if(!phyloref.hasOwnProperty('externalSpecifiers')) phyloref.externalSpecifiers = [];
        }

        vm.testcase = testcase;
    } catch(err) {
        alert("Error occurred while reading input JSON: " + err);
    }
}

/**
 * Load a JSON from a URL. This either needs to be a JSONP request or
 * on the same domain as this website.
 */
function load_json_from_url(url) {
    if(typeof window.FileReader !== 'function') {
        alert("The FileReader API is not supported on this browser.");
        on_load(false);
        return;
    }

    // Load from URL
    $.getJSON(url, function(data) {
        load_json_from_json(data);
    });
}

/**
 * Load a local JSON file using FileReader
 *
 * Initially based on https://stackoverflow.com/a/21446426/27310
 */
function load_json_from_local(file_input) {
    if(typeof window.FileReader !== 'function') {
        alert("The FileReader API is not supported on this browser.");
        on_load(false);
        return;
    }

    if(!file_input) {
        alert("Programmer error: No file input element specified.");
        on_load(false);
        return;
    }

    if(!file_input.prop('files')) {
        alert("File input element found, but files property missing: try another browser?");
        on_load(false);
        return;
    }

    if(!file_input.prop('files')[0]) {
        alert("Please select a file before attempting to load it.");
        on_load(false);
        return;
    }

    // Reset data model
    vm.testcase = {};

    // Reset UI
    vm.selected_phyloref = null;
    vm.selected_phylogeny = null;
    vm.selected_specifier = null;
    vm.selected_tunit = null;

    file = file_input.prop('files')[0];
    fr = new FileReader();
    fr.onload = function(e) {
        lines = e.target.result;
        testcase = JSON.parse(lines);
        load_json_from_json(testcase);
    };
    fr.readAsText(file);
}

/**
 * Given a Newick string, try to render it as a tree using Phylotree.
 *
 * 'node' should be an SVG node.
 */
function render_tree(node_expr, newick) {
    console.log("render_tree(" + node_expr + ", " + newick + ")");

    tree = d3.layout.phylotree()
        .svg(d3.select(node_expr))
        .options({
            //"selectable": false,
            //"collapsible": false,
            //"transitions": false
        })
    ;

    try {
        tree(d3.layout.newick_parser(newick));
        _.each(tree.get_nodes(), function(node) {
            if(node.children && node.name.startsWith("expected_")) {
                node.internal_label = node.name.substring(9);
                // console.log(node.internal_label)
            }
        });

        tree.spacing_x(20).spacing_y(50);

        // tree.placenodes().layout();
        tree.update();
    } catch(e) {
        console.log("Unable to render tree: " + e);
    }

    /*
    $(function() {
        tree.update_layout();
    });
    */
}
