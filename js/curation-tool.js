/*
 * Curation Tool Javascript File
 * Copyright (c) The Phyloreferencing Project, 2018
 */

// Global variables
var vm = new Vue({
    el: '#app',
    data: {
        modified: false,
        testcase: {}
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
        }
    }
});

/**
 * Load a local JSON file using FileReader
 *
 * Initially based on https://stackoverflow.com/a/21446426/27310
 *
 * @return The JSON content as a JSON object.
 */
function load_json_from_local(file_input, on_load) {
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
            vm.testcase_as_json = lines;
        } catch(err) {
            alert("Error occurred while loading file: " + err);
        }
    };
    fr.readAsText(file);
}
