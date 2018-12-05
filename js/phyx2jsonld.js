#!/usr/bin/env node

/*
 * phyx2jsonld.js is a script that provides an interface to phyx.js that allows
 * users to convert PHYX files to JSON-LD at the command line.
 *
 *  ./phyx2jsonld.js input.json [-o output.jsonld]
 *
 * Where:
 *  - input.json is the PHYX file to be converted.
 *  - output.jsonld is the JSON-LD file to be produced. If no output filename is
 *    given, the output will be written to STDOUT.
 */

/* Load Javascript libraries */
// We use 'fs' for input/output.
const fs = require('fs');

// Load yargs, a command line argument
const yargs = require('yargs');

// Get stdin, which helps read input from STDIN.
const getStdin = require('get-stdin');

/*
 * phyx.js uses some code (in particular through phylotree.js) that expects certain
 * Javascript libraries to be loaded via the browser using <script>. To replicate
 * this in Node, we load them and add them to the global object.
 */

// Load moment as a global variable so it can be accessed by phyx.js.
global.moment = require('moment');

// Load jQuery.extend as a global variable so it can be accessed by phyx.js.
global.jQuery = {};
global.jQuery.extend = require('extend');

// Load d3 as a global variable so it can be accessed by both phylotree.js (which
// needs to add additional objects to it) and phyx.js (which needs to call it).
global.d3 = require('d3');

// phylotree.js does not export functions itself, but adds them to global.d3.layout.
// So we set up a global.d3.layout object for them to be added to, and then we include
// phylotree.js ourselves.
if (!Object.prototype.hasOwnProperty.call(global.d3, 'layout')) {
  global.d3.layout = {};
}
require('../lib/phylotree.js/phylotree.js');

// Load phyx.js, our PHYX library.
const phyx = require('./phyx');

// Configure the needed command line arguments.
const args = yargs.usage('Usage: $0 input.json [-o output.jsonld]')
  // Set up '-o'/'--output'
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Where to write output')
  // Retrieve arguments.
  .argv;

// Write out to STDOUT or to specified output file.
function writeResult(output) {
  // Do we have an output filename to write to?
  if ('o' in args) {
    // Write to the output filename provided, or report an error if it could not
    // be written.
    fs.writeFile(args.o, output, (err) => {
      if (err) {
        process.stderr.write(`Could not write to ${args.o}: ${err}\n`);
        process.exit(1);
      }
    });
  } else {
    // Write to the console (i.e. STDOUT).
    process.stdout.write(output);
  }
}

// Convert PHYX to JSON-LD.
function convertPHYXToJSONLD(phyxContent) {
  const json = JSON.parse(phyxContent);
  const wrappedPhyx = new phyx.PHYXWrapper(json);
  const jsonOutput = JSON.stringify(wrappedPhyx.asJSONLD());
  return jsonOutput;
}

// Load the input file or STDIN.
const inputFilenames = args._;
if (inputFilenames.length > 1) {
  process.stderr.write(`phyx2jsonld.js only supports a single input PHYX file, but ${inputFilenames.length} provided: ${inputFilenames}\n`);
  process.exit(1);
} else if (inputFilenames.length === 0) {
  getStdin().then(str => writeResult(convertPHYXToJSONLD(str)));
} else {
  fs.readFile(inputFilenames[0], 'utf8', (err, data) => {
    if (err === null) {
      writeResult(convertPHYXToJSONLD(data));
    } else {
      process.stderr.write(`Error loading input file '${inputFilenames[0]}': ${err}`);
      process.exit(1);
    }
  });
}

module.exports = {
  convertPHYXToJSONLD,
};
