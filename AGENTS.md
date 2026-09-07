# AGENTS.md

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/klados/)
npm run build     # Production build to dist/ (deployed to the gh-pages branch on release)
npm run preview   # Preview production build on port 4173
npm run lint      # ESLint with auto-fix (Vue + Prettier)
npm run lint:check # ESLint without --fix; this is what CI runs
npm run test      # Vitest (jsdom) over the co-located .spec.js files in src/
npm run test:e2e  # Playwright integration tests in tests/playwright/
```

## Architecture

Klados is a Vue 2 single-page application for authoring and curating **phyloreferences** — OWL 2 ontology definitions of monophyletic groups in JSON-LD ([Phyx](https://github.com/phyloref/phyx.js) format). Users load/create Phyx files containing phyloreferences, define phyloreferences with specifiers, and test them against phylogenies via the JPhyloRef reasoner backend.

**Three main views** controlled by `store/modules/ui.js` (`display` state):
- `PhyxView` — top-level Phyx file metadata and management
- `PhylogenyView` — edit/annotate phylogenies and their node labels
- `PhylorefView` — author phyloreferences and their specifiers

**Vuex store modules** (`src/store/modules/`):
- `phyx.js` — the loaded Phyx document, dirty-state tracking, cookie-stored curator preferences
- `phylogeny.js` — phylogeny editing, taxonomic unit (TU) assignment to nodes
- `phyloref.js` — phyloreference CRUD, specifier management, `selectedPhylorefIndex`
- `resolution.js` — stores reasoning results returned by JPhyloRef
- `citations.js` — citation/reference management
- `ui.js` — which view to display (`phyloref`, `phylogeny`, or `phyx`)

## Reactivity: a trap specific to this codebase

Vue 3 tracks a dependency only on properties a render or computed actually
*reads through the reactive proxy*. Two idioms common in this codebase read
around it, so a value updates in the store but never on screen — with no error:

- **`lodash.has()`** tests `hasOwnProperty`, which the proxy does not trap. Code
  shaped like `if (has(obj, 'k') && has(obj.k, 'j')) return obj.k.j;` registers
  no dependency at all. Read the path instead: `obj?.k?.j ?? fallback`.
- **`@phyloref/phyx` wrappers** (`TaxonomicUnitWrapper`, `PhylorefWrapper`, …)
  read their argument with `has()` and `get()` internally, so passing reactive
  state straight into one tracks nothing. `cloneDeep()` the argument first: that
  reads every property through the proxy, registering the dependency, and hands
  the wrapper a plain object.

Vue 2 hid both of these, because `Vue.set` notified every watcher that had
touched the object at all. Nothing in the compiler or the linter catches them —
only a test that asserts the screen updated.

**Key dependencies:**
- `@phyloref/phyx` — Phyx format classes and utilities (the data model)
- `phylotree` — D3-based phylogenetic tree visualization
- `bootstrap-vue` + Bootstrap 4 — UI components
- `pako` — gzip compression for POST payloads to JPhyloRef

## Important Configuration

`src/config.js` defines:
- JPhyloRef reasoner endpoint: `https://reasoner.phyloref.org/reason`
- Open Tree of Life TNRS and induced-subtree API endpoints
- Cookie settings (30-day expiry) for curator name and nomenclatural code

**Base path** is `/klados/` (set in `vite.config.js`) for GitHub Pages deployment. The `VITE_APP_VERSION` env variable is injected from the git tag during CI builds.

## Deployment

- `.github/workflows/build-and-test.yml` lints, builds and unit-tests every pull request and every push to `master`. Lint is clean; keep it that way.
- `.github/workflows/playwright-tests.yml` runs the integration tests on the same triggers, in its own workflow because it has to download browsers first.
- `.github/workflows/deploy-to-github-pages.yml` triggers on release and deploys `dist/` to the `gh-pages` branch.
- `.github/workflows/test-backend.yml` pings the JPhyloRef backend twice daily to monitor availability.

## Test File Conventions

There are two suites, and they both use `.spec.js`, so Vitest's `include` is pinned to `src/` to keep them apart.

**Unit tests** are co-located with components (e.g. `src/components/cards/ModifiedCard.spec.js`). They run under Vitest (config in `vite.config.js`, `globals: true` so `describe`/`test`/`expect` need no import) and use `mount()` from `@vue/test-utils` v1 — v2 is Vue 3 only. Import components with the explicit `.vue` extension.

`tests/COVERAGE.md` tracks what the two suites do and do not cover, and which tests are worth writing next. Update it when you add a test or a feature.

**Integration tests** live in `tests/playwright/`, drive a real browser against `npm run dev`, and are the suite that matters most when changing the framework, since they assert on rendered behaviour rather than on Vue internals. Page objects are in `tests/playwright/pages/`; locate elements with `data-testid` rather than CSS classes or positions. The shared fixture in `tests/playwright/fixtures/index.js` mocks the JPhyloRef reasoner and aborts Open Tree of Life requests, so the suite never depends on an external service.
