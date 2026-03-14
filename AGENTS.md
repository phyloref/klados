# AGENTS.md

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173/klados/)
npm run build     # Production build to dist/ (also deploys to docs/ for GitHub Pages)
npm run preview   # Preview production build on port 4173
npm run lint      # ESLint with auto-fix (Vue + Prettier)
```

There is no test runner configured in package.json. The `.spec.js` files use Jest + `@vue/test-utils`, but Jest must be invoked manually if installed.

## Architecture

Klados is a Vue 3 single-page application (migrated from Vue 2; using `@vue/compat` MODE: 2 as a transition shim) for authoring and curating **phyloreferences** — OWL 2 ontology definitions of monophyletic groups in JSON-LD ([Phyx](https://github.com/phyloref/phyx.js) format). Users load/create Phyx files containing phyloreferences, define phyloreferences with specifiers, and test them against phylogenies via the JPhyloRef reasoner backend.

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
- `phylotree` — D3-based phylogenetic tree visualization (requires jQuery; `window.$ = jQuery` is set in main.js)
- Bootstrap 4 + `bootstrap-icons` — UI styling and icons (icons rendered as `<i class="bi bi-*">`)
- `@vue/compat` — Vue 3 migration build shim (MODE: 2); see `FUTURE.md` for removal plan
- `vuex@4` — state management (Vuex 4 used with `createStore`; Pinia migration deferred)
- `pako` — gzip compression for POST payloads to JPhyloRef
- `src/cookies.js` — lightweight native cookie helper (replaced `vue-cookies` which was Vue 2-only)

## Important Configuration

**Vue 3 migration notes:**
- `@vue/compat` with `MODE: 2` is active — browser console deprecation warnings are expected and acceptable during this transition period
- All `Vue.set(obj, key, val)` → `obj[key] = val` (Vue 3 proxy reactivity handles this natively)
- `bootstrap-vue` was removed; Bootstrap Icons CSS is imported in `main.js`; icon tags use `<i class="bi bi-*">`
- `PhyloTree.vue` uses a native `ResizeObserver` (replaces the removed `vue-resize` component)
- Deferred migration work is tracked in `FUTURE.md`

`src/config.js` defines:
- JPhyloRef reasoner endpoint: `https://reasoner.phyloref.org/reason`
- Open Tree of Life TNRS and induced-subtree API endpoints
- Cookie settings (30-day expiry) for curator name and nomenclatural code

**Base path** is `/klados/` (set in `vite.config.js`) for GitHub Pages deployment. The `VITE_APP_VERSION` env variable is injected from the git tag during CI builds.

## Deployment

- GitHub Actions workflow (`.github/workflows/deploy-to-github-pages.yml`) triggers on release and deploys to `gh-pages` branch.
- A second workflow (`.github/workflows/test-backend.yml`) pings the JPhyloRef backend twice daily to monitor availability.

## Test File Conventions

Spec files are co-located with components (e.g., `src/components/cards/ModifiedCard.spec.js`). Tests use `mount()` from `@vue/test-utils` and assert on Vue instance properties and rendered HTML.
