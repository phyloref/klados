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
        selected_tunit: null
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
        get_taxonomic_unit_label: function(tunit) {
            return "(unnamed taxonomic unit)";
        },
        get_specifier_label: function(specifier) {
            // Is this specifier even non-null?
            if(specifier == null) return "(null)";

            // Maybe there is a label or description right there?
            if('label' in specifier) return specifier.label;
            if('description' in specifier) return specifier.description;

            // Look at the individual taxonomic units.
            labels = [];
            if('references_taxonomic_units' in specifier) {
                for(tu of specifier.references_taxonomic_units) {
                    // A label or description for the TU?
                    if('label' in tu) { labels.push(tu.label); continue; }
                    if('description' in tu) { labels.push(tu.label); continue; }

                    // Any scientific names?
                    if('scientific_names' in tu) {
                        for(scname of tu.scientific_names) {
                            if('scientific_name' in scname) { labels.push(scname.scientific_name); break; }
                            if('binomial_name' in scname) { labels.push(scname.binomial_name); break; }
                        }
                    }

                    // TODO any specimens?
                }
            }
            if(labels.length > 0) return labels.join(', ');

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
        }
    }
});

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
        vm.testcase = data;
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

    // Reset specifier
    vm.selected_phyloref = null;
    vm.selected_phylogeny = null;
    vm.selected_specifier = null;

    file = file_input.prop('files')[0];
    fr = new FileReader();
    fr.onload = function(e) {
        try {
            lines = e.target.result;
            testcase = JSON.parse(lines);

            // The DOI-to-ID/URL system doesn't work unless some variables
            // are set.
            if(!testcase.hasOwnProperty('@id'))
                testcase['@id'] = "";
            if(!testcase.hasOwnProperty('doi'))
                testcase['doi'] = "";
            if(!testcase.hasOwnProperty('url'))
                testcase['url'] = "";

            vm.testcase = testcase;
        } catch(err) {
            alert("Error occurred while loading file: " + err);
        }
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

    var nodeStyler = function(element, data) {
        if("internal_label" in data && data.internal_label == 'Calymperaceae') {
            var label = element.selectAll(".internal_label");
            if(label.empty()) {
                element.append("text").classed("internal_label", true)
                    .text(data.internal_label)
                    .attr("dx", ".4em")
                    .attr("dy", ".3em")
                    .attr("text-anchor", "start")
                    .attr("alignment-baseline", "middle");
            }
        } else {
            element.style('fill', function() {
            if(data.name == 'Syrrhopodon gardneri' || data.name == 'Leucophanes octoblepharoides')
                return "rgb(0, 255, 0)";
            if(data.name == 'Octoblepharum albidum')
                return "rgb(255, 0, 0)";
            return "rgb(0, 0, 0)";
        });
        }
    }

    tree = d3.layout.phylotree()
        .svg(d3.select(node_expr))
        .options({
            //"selectable": false,
            //"collapsible": false,
            //"transitions": false
        })
        .style_nodes(nodeStyler)
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
