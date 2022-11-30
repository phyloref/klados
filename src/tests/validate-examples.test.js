/*
 * Check whether every example file in the `../../public/examples` directory can be validated against our JSON schema.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

/* Load JSON Schema for validation. */
// const phyxJsonSchemaURI = 'https://www.phyloref.org/phyx.js/context/v1.0.0/schema.json';
const phyxJsonSchema = JSON.parse(fs.readFileSync('./json-schema/schema.v1.0.0.json'));
const validator = new Ajv({
  allErrors: true, // Display all error messages, not just the first.
}).compile(phyxJsonSchema);

/* Get a list of all the files to validate. */
const exampleFileDir = path.resolve(__dirname, '..', '..', 'public', 'examples');
const exampleFiles = fs.readdirSync(exampleFileDir).filter(filename => filename.endsWith('.json'));

/* Test all example files. */
describe('Validate example Phyx files', () => {
    it.each(exampleFiles)('Validate example file "%s"', async (exampleFile) => {
        const exampleString = fs.readFileSync(path.resolve(exampleFileDir, exampleFile));

        // Make sure the input JSON is not empty.
        expect(exampleString.length).not.toEqual(0);

        // Read example file as a JSON file.
        const exampleJson = JSON.parse(exampleString);

        // Validate JSON file.
        const result = validator(exampleJson);
        expect(result.errors.length).toEqual(0);
        expect(result).toBeTruthy();
    });
});
