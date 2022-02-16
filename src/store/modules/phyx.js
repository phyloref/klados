/*
 * Primary store module for the currently loaded Phyx file. We also keep a copy
 * of the Phyx file as it was loaded, allowing modifications to be noted. This
 * module also stores and resets the reasoning results provided by the JPhyloRef
 * server.
 */

import Vue from 'vue';
import { TaxonNameWrapper } from '@phyloref/phyx';
import { has, cloneDeep, isEqual } from 'lodash';

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
        || TaxonNameWrapper.UNKNOWN_CODE;
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
