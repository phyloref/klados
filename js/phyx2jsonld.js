#!/usr/bin/env node

/*
 * phyx2jsonld.js is a script that provides an interface to phyx.js that allows
 * users to convert PHYX files to JSON-LD at the command line.
 *
 *  ./phyx2jsonld.js input.json [-o output.jsonld]
 */

// Load moment as a global variable so it can be accessed by phyx.js.
global.moment = require('moment');

// Load jQuery.extend as a global variable so it can be accessed by phyx.js.
global.jQuery = {
  'extend': require('extend')
};

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to, and then we include
// phylotree.js ourselves.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

// Load phyx.js.
const phyx = require('../js/phyx');

// We use 'fs' for input/output.
const fs = require('fs');

// Configure command line arguments.
const args = require('yargs')
  .usage('Usage: $0 input.json [-o output.jsonld]')
  // Set up '-o'/'--output'
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Where to write output')
  // Retrieve arguments.
  .argv;

// Convert PHYX to JSON-LD and write out.
function phyxContentToJSONLD(phyxContent) {
  const json = JSON.parse(phyxContent);
  const wrappedPhyx = new phyx.PHYXWrapper(json);
  const jsonOutput = JSON.stringify(wrappedPhyx.asJSONLD());

  // Do we have an output filename to write to?
  if ('o' in args) {
    fs.writeFile(args.o, jsonOutput, function(err) {
      if (err) console.log("Could not write to ", args.o, ": ", err);
    });
  } else {
    // Write to the console (i.e. STDOUT).
    console.log(jsonOutput);
  }
}

// Load the input file or STDIN.
const inputFilenames = args._;
var phyxContent;
if (inputFilenames.length > 1) {
  console.log("phyx2jsonld.js only supports a single input PHYX file, but ", inputFilenames.length, " provided: ", inputFilenames);
} else if (inputFilenames.length == 0) {
  const getStdin = require('get-stdin');
  getStdin().then(str => phyxContentToJSONLD(str));
} else {
  fs.readFile(inputFilenames[0], 'utf8',
      (err, data) => {
        if (err === null) phyxContentToJSONLD(data);
        else console.log("Error loading input file '" + inputFilenames[0] + "': " + err)
      });
}
