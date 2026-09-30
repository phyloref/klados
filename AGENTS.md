# AGENTS.md

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/klados/)
npm run build     # Production build to dist/ (deployed to the gh-pages branch on release)
npm run preview   # Preview production build on port 4173
npm run lint      # ESLint with auto-fix (Vue rules; no formatting)
npm run lint:check # ESLint without --fix; this is what CI runs
npm run test      # Vitest (jsdom) over the co-located .spec.js files
```

The code is not Prettier-formatted, and nothing enforces formatting: `eslint.config.mjs` uses `skip-formatting`, which turns off ESLint's style rules. `.prettierrc.json` sets single quotes and ES5 trailing commas, the Prettier options closest to the existing style, so an editor's format-on-save doesn't also swap every quote. Prettier still rewraps most files (long lines, leading `||`), so don't run `prettier --write` over whole files that a change doesn't otherwise touch.

The `engines.node` range in `package.json` is the narrowest `engines.node` range among the locked dependencies (currently jsdom's). npm only warns (`EBADENGINE`) when a dependency rejects the running Node, so a looser range lets `npm run test` or `npm run lint` fail on a Node that `package.json` claims to support. `engines.spec.js` fails when a dependency upgrade makes the range too wide, and lists the packages that reject it. Narrow the range to match them.

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

- `.github/workflows/build-and-test.yml` lints, builds and tests every pull request and every push to `master`. Lint is clean; keep it that way.
- `.github/workflows/deploy-to-github-pages.yml` triggers on release and deploys `dist/` to the `gh-pages` branch.
- `.github/workflows/test-backend.yml` pings the JPhyloRef backend twice daily to monitor availability.

## Test File Conventions

Spec files are co-located with components (e.g., `src/components/cards/ModifiedCard.spec.js`). Tests run under Vitest (config in `vite.config.js`, `globals: true` so `describe`/`test`/`expect` need no import) and use `mount()` from `@vue/test-utils` v1 — v2 is Vue 3 only. Import components with the explicit `.vue` extension.
