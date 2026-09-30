# Test coverage

What Klados' tests do and do not cover, and what is worth writing next.

## Why this is a document and not a percentage

Line coverage measures which lines ran, not which behaviours were checked. An
end-to-end suite that merely loads the app executes most of the codebase while
asserting almost nothing, so it would report a flattering number that tells you
nothing about what to test next. This file tracks behaviours instead.

Keep it current: when you add a test, move the row. When you add a feature,
add a row.

When adding a test, check it fails for the right reason before trusting it. The
integration tests here were each verified by breaking the behaviour they cover
and confirming the failure — a test that has never failed has not been shown to
test anything.

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
| Newick parse errors on a new phylogeny, and clearing them | `newick-errors` |
| Set an expected node for the first time, and save it | `expected-resolution` |
| Rename an internal node from the context menu | `editing` |
| Add a phyloreference and edit its label | `editing`, `save-load` |
| Add internal specifiers and fill in a taxon name | `editing` |
| Specifier labels in the sidebar | `editing` |
| Phyloreference type from specifier counts | `specifiers` |
| Save to JSON and read the file back | `save-load` |
| Load a Phyx file from local disk | `save-load` |
| Delete a citation, and its absence from the saved file | `citations` |
| Add a citation and fill in authors, title, year and editors | `citation-editing` |
| Download filename after labelling a new phyloreference | `download-filename` |
| Specifiers as taxon, specimen and external reference | `specifier-types` |
| Delete a specifier | `specifier-types` |
| Add and edit a taxonomic unit on a phylogeny node | `taxonomic-units` |
| Add, remove and restore an apomorphy, and the type it gives | `apomorphy` |
| `b-table` row details on the phylogeny view | `taxonomic-units` |
| Modified-state indicators | `ModifiedCard.spec.js`, `ModifiedIcon.spec.js` |

## Not covered

Ranked by what would hurt most if it broke. The Vue 3 column is the risk that
*this specific behaviour* breaks during the migration, which is what should
drive the order things get written in.

These ratings were written before the Vue 3 migration and are kept because the
reasoning still holds for anything untested: a reactivity bug shows up as a
value that changes in the store but never on screen, with no error anywhere. The
migration hit exactly two such bugs, both in covered paths, and both were caught
by the tests rather than by the compiler. See the reactivity section of
AGENTS.md for the two idioms that cause them.

| Behaviour | Why it matters | Vue 3 risk |
| --- | --- | --- |
| Citation identifiers, journal, publisher and URLs | Only authors, title, year and editors are exercised | Medium — same reactivity path |
| Delete or duplicate a phyloreference or phylogeny | Destructive and unguarded | **High** — `Vue.delete` |
| Export as JSON-LD, export as ontology | The formats other tools consume; a silent change breaks downstream users | Low — plain serialisation |
| Append a local JSON file | Merge semantics are easy to get wrong and have no test | Low |
| Curator name, email, ORCID; default nomenclatural code | Written to cookies, so they persist wrongly if broken | Medium — cookie plugin |
| Create a phylogeny from Open Tree of Life | Depends on a live external API; currently mocked out entirely | Low |
| Real JPhyloRef reasoner | Everything is mocked; nothing catches a backend contract change | Low — unrelated to Vue |

## Suggested order

The three highest-risk gaps — specifier kinds and deletion, taxonomic units on
phylogeny nodes, and the `b-table` row details — are now covered, so the Vue 3
branch has something underneath it. What is left first:
**deleting and duplicating a phyloreference or phylogeny**. It is cheap to write,
destructive if wrong, and sits on the same `Vue.set`/`Vue.delete` paths the
migration rewrote.

## Known gaps in how we test, not what we test

- No test runs against the real JPhyloRef backend. `test-backend.yml` pings it
  twice a day, which catches an outage but not a contract change.
- The integration suite runs on chromium and firefox. There is no webkit run.
- CI runs the integration tests against the dev server, not the production
  build, and only the production bundle is minified. Running them against
  `npm run preview` is a one-line config change and worth adding. It would not
  exercise Vuex `strict` mode: that is on only in production, where Vuex compiles
  its check out (see `src/store/index.js`).
- Nothing tests accessibility, keyboard navigation, or screen reader output.
