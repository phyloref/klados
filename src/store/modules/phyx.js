/*
 * Primary store module for the currently loaded Phyx file. We also keep a copy
 * of the Phyx file as it was loaded, allowing modifications to be noted. This
 * module also stores and resets the reasoning results provided by the JPhyloRef
 * server.
 */

import Vue from 'vue';
import jQuery from 'jquery';
import { TaxonNameWrapper, PhylorefWrapper, TaxonConceptWrapper } from '@phyloref/phyx';
import {
  has, cloneDeep, isEqual, keys,
} from 'lodash';

// Get some configuration settings.
import {
  OPEN_TREE_ABOUT_URL,
  OPEN_TREE_TNRS_MATCH_NAMES_URL,
  OPEN_TREE_INDUCED_SUBTREE_URL,

  COOKIE_EXPIRY,
  COOKIE_ALLOWED, COOKIE_DEFAULT_NOMEN_CODE_IRI, COOKIE_CURATOR_NAME, COOKIE_CURATOR_EMAIL, COOKIE_CURATOR_ORCID,
} from '@/config';

// Shared code for reading and writing cookies.

/** Check whether we are allowed to store cookies on this users' browser.
 * We determine this based on whether the COOKIE_ALLOWED cookie is set. */
function checkCookieAllowed() {
  return (Vue.$cookies.get(COOKIE_ALLOWED) === 'true');
}

/** Get a cookie from the browser (if we're allowed to). */
function getKladosCookie(keyName, valueIfNotSet = undefined) {
  if (checkCookieAllowed()) return Vue.$cookies.get(keyName) || valueIfNotSet;
  return valueIfNotSet;
}

/** Set a cookie on the browser (if we're allowed to). */
function setKladosCookie(keyName, value, expiry = COOKIE_EXPIRY) {
  // Only set the cookie if we are allowed (the COOKIE_ALLOWED is set).
  if (checkCookieAllowed()) Vue.$cookies.set(keyName, value, expiry);
}

export default {
  state: {
    // The currently loaded Phyx file. All methods modify and change this variable.
    currentPhyx: {
      phylorefs: [],
      phylogenies: [],
    },

    // A backup copy of the previously loaded Phyx file. Where this differs from
    // currentPhyx, we know that the user has modified something.
    loadedPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
  },
  getters: {
    loadedPhyxChanged(state) {
      return !isEqual(state.currentPhyx, state.loadedPhyx);
    },
    getDefaultNomenCodeIRI(state) {
      // If no default nomenclatural code is set in the Phyx file, we will attempt to look up that information
      // using a cookie.
      return state.currentPhyx.defaultNomenclaturalCodeIRI
          || getKladosCookie(COOKIE_DEFAULT_NOMEN_CODE_IRI, TaxonNameWrapper.UNKNOWN_CODE);
    },
    getDownloadFilenameForPhyx(state) {
      // Return a filename to be used to name downloads of this Phyx document.

      // The default download filename to use if no phylorefs are present.
      const DEFAULT_DOWNLOAD_FILENAME = 'download';

      if (!state.currentPhyx || !state.currentPhyx.phylorefs) {
        return DEFAULT_DOWNLOAD_FILENAME;
      }

      // Determine all phyloref labels in this document. Non-Latin characters will be replaced with '_' to avoid
      // creating filenames using non-ASCII Unicode characters. As per the UI, unlabeled phylorefs will be referred
      // to as 'Phyloref 1', 'Phyloref 2', and so on.
      const phylorefLabels = state.currentPhyx.phylorefs.map((p, index) => (has(p, 'label') ? p.label.replaceAll(/\W/g, '_') : `Phyloref_${index + 1}`));

      // Construct a download filename depending on the number of phylorefs, which is in the form:
      // - Phyloref_1
      // - Phyloref_1_and_Phyloref_2
      // - Phyloref_1_Phyloref_2_and_Phyloref_3
      // - Phyloref_1_Phyloref_2_and_2_others
      // - ...
      if (phylorefLabels.length === 0) return DEFAULT_DOWNLOAD_FILENAME;
      if (phylorefLabels.length === 1) return phylorefLabels[0];
      if (phylorefLabels.length === 2) return `${phylorefLabels[0]}_and_${phylorefLabels[1]}`;
      if (phylorefLabels.length === 3) return `${phylorefLabels[0]}_${phylorefLabels[1]}_and_${phylorefLabels[2]}`;
      return `${phylorefLabels[0]}_${phylorefLabels[1]}_and_${phylorefLabels.length - 2}_others`;
    },
    isCookieAllowed() {
      // Checks to see if cookies are allowed. We can check this by seeing if a cookie named
      // COOKIE_ALLOWED is set.
      return checkCookieAllowed();
    },
  },
  mutations: {
    toggleCookieAllowed(state) {
      if (checkCookieAllowed()) {
        // Cookie allowed! Toggle it by deleting all Klados cookies.
        Vue.$cookies.keys().forEach(key => Vue.$cookies.remove(key));
      } else {
        // Cookie not allowed! Toggle it to cookie allowed. We don't use setKladosCookie() because
        // it includes a check for COOKIE_ALLOWED; instead, we set it directly.
        Vue.$cookies.set(COOKIE_ALLOWED, 'true', COOKIE_EXPIRY);

        // Then, save all current curator information.
        setKladosCookie(COOKIE_CURATOR_NAME, state.currentPhyx.curator || '');
        setKladosCookie(COOKIE_CURATOR_EMAIL, state.currentPhyx.curatorEmail || '');
        setKladosCookie(COOKIE_CURATOR_ORCID, state.currentPhyx.curatorORCID || '');
      }
    },
    setCurrentPhyx(state, phyx) {
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', JSON.parse(JSON.stringify(phyx)));
    },
    setLoadedPhyx(state, phyx) {
      // Replace the current loaded Phyx file using an object. This also updates
      // the loaded Phyx, so we can check for changes from the loaded file.
      //
      // This can be called without an argument to reset the loaded phyx to be
      // identical to the current Phyx.
      if (phyx === undefined || phyx === state.currentPhyx) {
        // A common error is using the same object as the current Phyx and the
        // loaded Phyx. In that case, we deep-copy loaded Phyx so that modifying
        // one won't automatically modify the other.
        Vue.set(state, 'loadedPhyx', JSON.parse(JSON.stringify(state.currentPhyx)));
      } else {
        Vue.set(state, 'loadedPhyx', phyx);
      }
    },
    createEmptyPhyloref(state) {
      // Create a new, empty phyloreference.
      state.currentPhyx.phylorefs.push({});
    },
    createEmptyPhylogeny(state) {
      // Create a new, empty phylogeny.
      if (!has(state.currentPhyx, 'phylogenies')) {
        Vue.set(state.currentPhyx, 'phylogenies', []);
      }
      state.currentPhyx.phylogenies.push({});
    },
    createPhylogeny(state, { phylogeny }) {
      // Create a new phylogeny based on a particular template.
      state.currentPhyx.phylogenies.push(phylogeny);
    },
    deletePhyloref(state, payload) {
      // Delete a phyloreference.
      if (!has(payload, 'phyloref')) {
        throw new Error('deletePhyloref needs a phyloref to modify using the "phyloref" argument');
      }

      const indexOf = (state.currentPhyx.phylorefs || []).indexOf(payload.phyloref);
      if (indexOf < 0) throw new Error(`Could not delete unknown phyloref: ${JSON.stringify(payload.phyloref)}`);

      state.currentPhyx.phylorefs.splice(indexOf, 1);
    },
    deletePhylogeny(state, payload) {
      // Delete a phylogeny.
      if (!has(payload, 'phylogeny')) {
        throw new Error('deletePhylogeny needs a phylogeny to modify using the "phylogeny" argument');
      }

      const indexOf = (state.currentPhyx.phylogenies || []).indexOf(payload.phylogeny);
      if (indexOf < 0) throw new Error(`Could not delete unknown phylogeny: ${JSON.stringify(payload.phylogeny)}`);

      state.currentPhyx.phylogenies.splice(indexOf, 1);
    },
    setDefaultNomenCodeIRI(state, payload) {
      if (!has(payload, 'defaultNomenclaturalCodeIRI')) {
        throw new Error('No default nomenclatural code IRI provided to setDefaultNomenCodeIRI');
      }

      // Overwrite the current default nomenclatural code cookie.
      setKladosCookie(COOKIE_DEFAULT_NOMEN_CODE_IRI, payload.defaultNomenclaturalCodeIRI);

      Vue.set(state.currentPhyx, 'defaultNomenclaturalCodeIRI', payload.defaultNomenclaturalCodeIRI);
    },
    duplicatePhyloref(state, payload) {
      if (!has(payload, 'phyloref')) {
        throw new Error('duplicatePhyloref needs a phyloref to duplicate using the "phyloref" argument');
      }

      let indexOf = (state.currentPhyx.phylorefs || []).indexOf(payload.phyloref);
      if (indexOf < 0) indexOf = state.currentPhyx.phylorefs.length;
      state.currentPhyx.phylorefs.splice(indexOf, 0, cloneDeep(payload.phyloref));
    },
    setCurator(state, payload) {
      // Set the curator name, e-mail address or (eventually) ORCID.
      if (has(payload, 'name')) {
        setKladosCookie(COOKIE_CURATOR_NAME, payload.name);
        Vue.set(state.currentPhyx, 'curator', payload.name);
      }
      if (has(payload, 'email')) {
        setKladosCookie(COOKIE_CURATOR_EMAIL, payload.email);
        Vue.set(state.currentPhyx, 'curatorEmail', payload.email);
      }
      if (has(payload, 'orcid')) {
        setKladosCookie(COOKIE_CURATOR_ORCID, payload.orcid);
        Vue.set(state.currentPhyx, 'curatorORCID', payload.orcid);
      }
    },
  },
  actions: {
    createPhylogenyFromOpenTree({ commit, state }) {
      // Create a new, empty phylogeny from the Open Tree of Life using the /induced_subtree endpoint
      // at https://github.com/OpenTreeOfLife/germinator/wiki/Synthetic-tree-API-v3#induced_subtree

      function createOTTPhylogenyWithCitation(phylogeny) {
        // Create an OTT phylogeny after querying for the synthetic tree ID.
        jQuery.ajax({
          type: 'POST',
          url: OPEN_TREE_ABOUT_URL,
          dataType: 'json',
          error: err => console.log('Could not retrieve Open Tree of Life /about information: ', err),
          success: (data) => {
            // Citation as per https://tree.opentreeoflife.org/about/open-tree-of-life, retrieved March 30, 2022.
            const citation = {
              type: 'misc',
              authors: [
                {
                  name: 'OpenTree et al',
                },
              ],
              year: data.date_created.substring(0, 4) || new Date().getFullYear(),
              title: `Open Tree of Life synthetic tree ${data.synth_id || '(unknown synthetic tree version)'} using taxonomy ${data.taxonomy_version || '(unknown taxonomy version)'}`,
              link: [
                {
                  url: 'https://doi.org/10.5281/zenodo.3937741',
                },
              ],
            };

            // Add the citation to the provided phylogeny.
            const citedPhylogeny = {
              source: citation,
              ...phylogeny,
            };

            // Now create this phylogeny via Vue.
            commit('createPhylogeny', { phylogeny: citedPhylogeny });
          },
        });
      }

      // Step 1. Get a list of all taxon names used across all phyloreferences.
      const taxonConceptNames = (state.currentPhyx.phylorefs || [])
        .map(phyloref => new PhylorefWrapper(phyloref))
        .flatMap(wrappedPhyloref => wrappedPhyloref.specifiers)
        .map(specifier => new TaxonConceptWrapper(specifier))
        .map(wrappedTC => wrappedTC.nameComplete)
        .filter(name => name); // Eliminate blank and undefined names

      // Note that we don't assume that these names are at any particular taxonomic level;
      // thus, if "Amphibia" is used as a specifier, we will include Amphibia in the generated
      // phylogeny.

      if (taxonConceptNames.length === 0) {
        // If no taxon names are used in any phyloreferences -- if they use non-taxon-name
        // identifiers or if there are no phyloreferences, say -- we create a new phylogeny
        // named "Open Tree of Life" with curator notes that tells the user what happened.
        createOTTPhylogenyWithCitation({
          label: 'Open Tree of Life',
          curatorNotes: 'Attempt to load Open Tree of Life tree failed: no taxon name specifiers present.',
          newick: '()',
        });
        return;
      }

      // Step 2. Convert the list of taxonomic names into a list of OTT IDs.
      const namesToQuery = Array.from(new Set(taxonConceptNames));

      // The following method sometimes returns a Promise and sometimes returns nothing,
      // so it's not a consistent return.
      // eslint-disable-next-line consistent-return
      return jQuery.ajax({
        type: 'POST',
        url: OPEN_TREE_TNRS_MATCH_NAMES_URL,
        data: JSON.stringify({ names: namesToQuery }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        error: err => console.log('Error accessing Open Tree Taxonomy match_names: ', err),
        success: (data) => {
          // Go through the `matches` in the returned `results` and pull out the OTT IDs.
          const ottIds = (data.results || [])
            .flatMap(r => (r.matches || [])
              .flatMap((m) => {
                if ('taxon' in m && 'ott_id' in m.taxon) return [m.taxon.ott_id];
                return [];
              }));

          // Try to retrieve the induced subtree including these OTT IDs.
          return jQuery.ajax({
            type: 'POST',
            url: OPEN_TREE_INDUCED_SUBTREE_URL,
            data: JSON.stringify({
              ott_ids: ottIds,
            }),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: (innerData) => {
              // If successful, we get back the induced tree as a Newick string.
              // We use that to create a new phylogeny labeled "Open Tree of Life".
              createOTTPhylogenyWithCitation({
                label: 'Open Tree of Life',
                curatorNotes: `This phylogeny was generated from the Open Tree of Life based on the following studies: ${innerData.supporting_studies}`,
                newick: innerData.newick,
              });
            },
          }).fail((err) => {
            // If some OTT ids were not found on the synthetic tree, the OTT API
            // will return a list of nodes that could not be matched. We can remove
            // these OTT ids from our list of queries and try again.
            const regexErrorMessage = /^\[\/v3\/tree_of_life\/induced_subtree\] Error: node_id '\w+' was not found!/;
            if (regexErrorMessage.test(err.responseJSON.message)) {
              // Step 3. If the response includes node-not-found errors, we can re-run the query without
              // the not-found nodes. The response includes an object that lists failed OTT IDs and the
              // reason they failed. We report this to the user on the console.
              const unknownOttIdReasons = err.responseJSON.unknown;
              console.log('The Open Tree synthetic tree does not contain the following nodes: ', unknownOttIdReasons);

              // Remove the unknown OTT ids from the list of OTT ids to be queried.
              const knownOttIds = ottIds.filter(id => !has(unknownOttIdReasons, `ott${id}`));
              console.log('Query has been reduced to the following nodes: ', knownOttIds);

              if (knownOttIds.length === 0) {
                // It may turn out that ALL the OTT IDs are filtered out, in which case we should produce
                // a phylogeny for the user with curator notes that explains what happened.
                createOTTPhylogenyWithCitation({
                  label: 'Open Tree of Life',
                  curatorNotes: 'Attempt to load Open Tree of Life tree failed, as none of the Open Tree taxonomy IDs'
                      + ` were present on the synthetic tree: ${JSON.stringify(unknownOttIdReasons, undefined, 4)}`,
                  newick: '()',
                });
              } else {
                // We have a filtered list of OTT IDs to query. Re-POST the request.
                jQuery.ajax({
                  type: 'POST',
                  url: OPEN_TREE_INDUCED_SUBTREE_URL,
                  data: JSON.stringify({
                    ott_ids: knownOttIds,
                  }),
                  contentType: 'application/json; charset=utf-8',
                  dataType: 'json',
                  error: innerErr => console.log('Error accessing Open Tree induced_subtree: ', innerErr),
                  success: (innerData) => {
                    // If we get an induced phylogeny as a Newick string, create a phylogeny with that Newick string.
                    createOTTPhylogenyWithCitation({
                      label: 'Open Tree of Life',
                      curatorNotes: `This phylogeny was generated from the Open Tree of Life based on the following studies: ${innerData.supporting_studies}`,
                      newick: innerData.newick,
                    });
                  },
                });
              }
            } else {
              // If we got a different error, record it to the Console for future debugging.
              console.log('Error accessing Open Tree induced_subtree: ', err);
            }
          });
        },
      });
    },
  },
};
