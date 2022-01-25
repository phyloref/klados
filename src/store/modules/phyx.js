/*
 * Primary store module for the currently loaded Phyx file. We also keep a copy
 * of the Phyx file as it was loaded, allowing modifications to be noted. This
 * module also stores and resets the reasoning results provided by the JPhyloRef
 * server.
 */

import Vue from 'vue';
import jQuery from 'jquery';
import { TaxonNameWrapper, PhylorefWrapper, TaxonConceptWrapper } from '@phyloref/phyx';
import {has, cloneDeep, isEqual, keys} from 'lodash';

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
    getDefaultNomenCodeURI(state) {
      return state.currentPhyx.defaultNomenclaturalCodeURI
        || TaxonNameWrapper.NAME_IN_UNKNOWN_CODE;
    },
  },
  mutations: {
    setCurrentPhyx(state, phyx) {
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', phyx);
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
      state.currentPhyx.phylogenies.push({});
    },
    // The following method sometimes returns a Promise and sometimes returns nothing, so it's not a
    // consistent return.
    // eslint-disable-next-line consistent-return
    createPhylogenyFromOpenTree(state) {
      // Create a new, empty phylogeny from the Open Tree of Life.

      // Step 1. Get a list of all taxon names used across all phyloreferences.
      const taxonConceptNames = state.currentPhyx.phylorefs
        .map(phyloref => new PhylorefWrapper(phyloref))
        .flatMap(wrappedPhyloref => wrappedPhyloref.specifiers)
        .map(specifier => new TaxonConceptWrapper(specifier))
        .map(wrappedTC => wrappedTC.nameComplete)
        .filter(name => name); // Eliminate blank and undefined names

      if (taxonConceptNames.length === 0) {
        state.currentPhyx.phylogenies.push({
          label: 'Open Tree of Life',
          description: 'Attempt to load Open Tree of Life tree failed: no taxon name specifiers present.',
          newick: '()',
        });
      } else {
        const namesToQuery = Array.from(new Set(taxonConceptNames));

        return jQuery.ajax({
          type: 'POST',
          url: 'https://api.opentreeoflife.org/v3/tnrs/match_names',
          data: JSON.stringify({names: namesToQuery}),
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          success: (data) => {
            const ottIds = (data.results || []).flatMap(r => (r.matches || []).flatMap(m => {
              if ('taxon' in m && 'ott_id' in m.taxon) return [m.taxon.ott_id];
              return [];
            }));

            return jQuery.ajax({
              type: 'POST',
              url: 'https://api.opentreeoflife.org/v3/tree_of_life/induced_subtree',
              data: JSON.stringify({
                ott_ids: ottIds,
              }),
              contentType: 'application/json; charset=utf-8',
              dataType: 'json',
              success: (innerData) => {
                state.currentPhyx.phylogenies.push({
                  label: 'Open Tree of Life',
                  description: `This phylogeny was generated from the Open Tree of Life based on the following studies: ${innerData.supporting_studies}`,
                  newick: innerData.newick,
                });
              },
            }).fail((x) => {
              // If some OTT ids were not found on the synthetic tree, the OTT API
              // will return a list of nodes that could not be matched. We can remove
              // these OTT ids from our list of queries and trying again.
              const regexErrorMessage = /^\[\/v3\/tree_of_life\/induced_subtree\] Error: node_id '\w+' was not found!/;
              if (regexErrorMessage.test(x.responseJSON.message)) {
                const unknownOttIdReasons = x.responseJSON.unknown;
                console.log('The Open Tree synthetic tree does not contain the following nodes: ', unknownOttIdReasons);
                this.unknownOttIdReasons = unknownOttIdReasons;
                this.unknownOttIds = keys(unknownOttIdReasons);
                // Remove the unknown OTT ids from the list of OTT ids to be queried.
                const knownOttIds = ottIds.filter(id => !has(unknownOttIdReasons, "ott" + id));
                console.log('Query has been reduced to the following nodes: ', knownOttIds);

                if (knownOttIds.length === 0) {
                  state.currentPhyx.phylogenies.push({
                    label: 'Open Tree of Life',
                    description: `Attempt to load Open Tree of Life tree failed, as no OTT Ids were present on the synthetic tree: ${unknownOttIdReasons}`,
                    newick: '()',
                  });
                } else {
                  // Redo query without unknown OTT Ids.
                  jQuery.ajax({
                    type: 'POST',
                    url: 'https://api.opentreeoflife.org/v3/tree_of_life/induced_subtree',
                    data: JSON.stringify({
                      ott_ids: knownOttIds,
                    }),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: (innerData) => {
                      state.currentPhyx.phylogenies.push({
                        label: 'Open Tree of Life',
                        description: `This phylogeny was generated from the Open Tree of Life based on the following studies: ${innerData.supporting_studies}`,
                        newick: innerData.newick,
                      });
                    },
                  }).fail(err => console.log('Error accessing Open Tree induced_subtree: ', err));
                }
              } else {
                console.log('Error accessing Open Tree induced_subtree: ', x);
              }
            });
          },
        }).fail(x => console.log('Error accessing Open Tree Taxonomy match_names: ', x));
      }
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
    setDefaultNomenCodeURI(state, payload) {
      if (!has(payload, 'defaultNomenclaturalCodeURI')) {
        throw new Error('No default nomenclatural code URI provided to setDefaultNomenCodeURI');
      }

      Vue.set(state.currentPhyx, 'defaultNomenclaturalCodeURI', payload.defaultNomenclaturalCodeURI);
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
      if (has(payload, 'name')) Vue.set(state.currentPhyx, 'curator', payload.name);
      if (has(payload, 'email')) Vue.set(state.currentPhyx, 'curatorEmail', payload.email);
      if (has(payload, 'orcid')) Vue.set(state.currentPhyx, 'curatorORCID', payload.orcid);
    },
  },
};
