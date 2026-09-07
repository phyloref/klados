# Test coverage

What Klados' tests do and do not cover, and what is worth writing next.

## Why this is a document and not a percentage

Line coverage measures which lines ran, not which behaviours were checked. An
end-to-end suite that merely loads the app executes most of the codebase while
asserting almost nothing, so it would report a flattering number that tells you
nothing about what to test next. This file tracks behaviours instead.

Keep it current: when you add a test, move the row. When you add a feature,
add a row.

## The suites

| Suite | Location | Runs with | What it is for |
| --- | --- | --- | --- |
| Unit | `src/**/*.spec.js` | `npm run test` (Vitest) | Individual components in isolation |
| Integration | `tests/playwright/` | `npm run test:e2e` (Playwright) | The real app in a real browser |

The integration suite is the one that matters for a framework change. It asserts
on rendered behaviour rather than on Vue internals, so it carries across a Vue 2
to Vue 3 migration unchanged, while the unit tests are written against
`@vue/test-utils` v1 and will need porting to v2.

The JPhyloRef reasoner and the Open Tree of Life APIs are mocked in
`tests/playwright/fixtures/index.js`. Nothing in either suite talks to a live
service, and nothing verifies that Klados still works against the real ones.

## Covered

| Behaviour | Covered by |
| --- | --- |
| Load an example Phyx file from a URL | `basic-demo`, `citations`, `save-load` |
| Resolve phyloreferences (against a mocked reasoner) | `basic-demo`, `save-load` |
| Resolution results in the summary table | `basic-demo` |
| Expected node label on the phyloreference view | `basic-demo` |
| Navigate between phyloreferences and phylogenies | `basic-demo`, `save-load` |
| Add a phylogeny | `editing` |
| Enter a Newick string and render the tree | `editing` |
| Rename an internal node from the context menu | `editing` |
| Add a phyloreference and edit its label | `editing`, `save-load` |
| Add internal specifiers and fill in a taxon name | `editing` |
| Specifier labels in the sidebar | `editing` |
| Phyloreference type from specifier counts | `specifiers` |
| Save to JSON and read the file back | `save-load` |
| Load a Phyx file from local disk | `save-load` |
| Delete a citation, and its absence from the saved file | `citations` |
| Modified-state indicators | `ModifiedCard.spec.js`, `ModifiedIcon.spec.js` |

## Not covered

Ranked by what would hurt most if it broke. The Vue 3 column is the risk that
*this specific behaviour* breaks during the migration, which is what should
drive the order things get written in.

The recurring reason for a **High** rating is `Vue.set` and `Vue.delete`, which
Vue 3 removes because its reactivity no longer needs them. There are 51 calls
across `src/`, 23 of them in `src/store/modules/phyloref.js` alone. Every one is
a place where a reactivity bug can hide behind code that still looks correct,
and most of them are in behaviours nothing currently tests.

| Behaviour | Why it matters | Vue 3 risk |
| --- | --- | --- |
| Taxonomic units on phylogeny nodes (`addTaxonomicUnitToPhylogenyNode`, `replaceTUnitForPhylogenyNode`) | Core curation workflow, entirely untested. Mutates nested objects through `Vue.set` | **High** — `Vue.set` is removed in Vue 3 |
| Specifier types other than taxon name (specimen, external reference) | Two of the three specifier kinds are never exercised | **High** — `Vue.set`, and `v-model` on components |
| Delete a specifier | Deletion paths are where reactivity bugs surface, as #405 showed for citations | **High** — `Vue.delete` is removed in Vue 3 |
| Add and edit a citation | Only deletion is covered; the whole editing form is untested | **High** — same reactivity path |
| Delete or duplicate a phyloreference or phylogeny | Destructive and unguarded | **High** — `Vue.delete` |
| Setting expected resolution | Asserted on when loaded from a file, never actually set by a test | Medium |
| Apomorphy-based definitions | A whole definition type with its own UI and validation | Medium |
| Export as JSON-LD, export as ontology | The formats other tools consume; a silent change breaks downstream users | Low — plain serialisation |
| Append a local JSON file | Merge semantics are easy to get wrong and have no test | Low |
| Curator name, email, ORCID; default nomenclatural code | Written to cookies, so they persist wrongly if broken | Medium — cookie plugin |
| Newick parse error reporting | Error paths are the least exercised by hand | Medium — `v-for` over errors |
| Create a phylogeny from Open Tree of Life | Depends on a live external API; currently mocked out entirely | Low |
| Real JPhyloRef reasoner | Everything is mocked; nothing catches a backend contract change | Low — unrelated to Vue |
| `b-table` row details on the phylogeny view | Uses bootstrap-vue components that have no direct Vue 3 equivalent | **High** — bootstrap-vue 2 is Vue 2 only |

## Suggested order

1. **Specifier editing across all three types, including deletion.** The largest
   untested surface, and it sits directly on the `Vue.set`/`Vue.delete` calls
   that Vue 3 removes. Write this before the migration, not during it.
2. **Taxonomic units on phylogeny nodes.** Same reactivity risk, and it is a
   workflow a curator uses constantly.
3. **Citation add and edit.** Deletion is covered; the form is not.
4. **Delete and duplicate a phyloreference or phylogeny.** Cheap to write and
   destructive if wrong.
5. **The `b-table` row details on the phylogeny view.** Not because the
   behaviour is complex, but because it is the clearest bootstrap-vue dependency
   in the app, and whatever replaces bootstrap-vue has to keep it working.

Items 1, 2 and 5 are the ones worth having in place *before* the Vue 3 branch
starts. The rest can follow it.

## Known gaps in how we test, not what we test

- No test runs against the real JPhyloRef backend. `test-backend.yml` pings it
  twice a day, which catches an outage but not a contract change.
- The integration suite runs on chromium and firefox. There is no webkit run.
- Nothing tests accessibility, keyboard navigation, or screen reader output.
