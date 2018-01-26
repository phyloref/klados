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
        modified: false,
        testcase: {
            '@id': "",
            'doi': "",
            'url': "",
            'citation': ""
        },
        DOI_PREFIX: DOI_PREFIX
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

    vm.testcase = {};

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
