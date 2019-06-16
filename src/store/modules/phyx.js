/*
 * Primary store module for the currently loaded Phyx file. We also keep a copy
 * of the Phyx file as it was loaded, allowing modifications to be noted. This
 * module also stores and resets the reasoning results provided by the JPhyloRef
 * server.
 */

import Vue from 'vue';
import { has } from 'lodash';
import { TaxonNameWrapper } from '@phyloref/phyx';

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
    // Return the current Phyx file as a JSON string.
    getPhyxAsJSON: state => JSON.stringify(state.currentPhyx, undefined, 4),
    getPhylogenyLabel: state => (phylogeny) => {
      // Return a label for the given phylogeny.

      if (phylogeny.label) return phylogeny.label;
      const indexOf = (state.currentPhyx.phylogenies || []).indexOf(phylogeny);
      if (indexOf >= 0) return `Phylogeny ${indexOf + 1}`;
      return 'Untitled phylogeny';
    },
    getPhylorefLabel: state => (phyloref) => {
      // Return a label for the given phyloreference.
      if (phyloref.label) return phyloref.label;
      const indexOf = (state.currentPhyx.phylorefs || []).indexOf(phyloref);
      if (indexOf >= 0) return `Phyloreference ${indexOf + 1}`;
      return 'Untitled phyloreference';
    },
    getDefaultNomenCodeURI(state) {
      if (has(state.currentPhyx, 'defaultNomenclaturalCodeURI')) return state.currentPhyx.defaultNomenclaturalCodeURI;
      return TaxonNameWrapper.NAME_IN_UNKNOWN_CODE;
    },
  },
  mutations: {
    setCurrentPhyx(state, phyx) {
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', phyx);

      // When the current phyx is changed, reasoning results are invalidated,
      // so let's clear those.
      Vue.set(state, 'reasoningResults', undefined);
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
  },
};
