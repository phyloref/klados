// @vitest-environment node
import { readFileSync } from 'node:fs';
import semver from 'semver';

// package.json's engines.node must not claim a Node version that a locked
// dependency rejects: npm only warns (EBADENGINE) about those, and then
// `npm run test` or `npm run lint` fails at run time. See AGENTS.md.
const readJSON = (file) =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));

const supported = readJSON('./package.json').engines.node;
const lockedPackages = readJSON('./package-lock.json').packages;

describe('engines.node in package.json', () => {
  test('is a valid semver range', () => {
    expect(semver.validRange(supported)).not.toBeNull();
  });

  test('is accepted by every locked dependency', () => {
    const rejecting = Object.entries(lockedPackages)
      .filter(
        ([path, pkg]) => path !== '' && typeof pkg.engines?.node === 'string',
      )
      .filter(([, pkg]) => !semver.subset(supported, pkg.engines.node))
      .map(([path, pkg]) => `${path} requires ${pkg.engines.node}`);
    expect(rejecting).toEqual([]);
  });
});
