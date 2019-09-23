/*
 * Store module for modifying phylogenies.
 */

import Vue from 'vue';
import { has } from 'lodash';

export default {
  mutations: {
    setPhylogenyProps(state, payload) {
      if (!has(payload, 'phylogeny')) {
        throw new Error('setPhylogenyProps needs a phylogeny to modify using the "phylogeny" argument');
      }
      if (has(payload, 'label')) {
        Vue.set(payload.phylogeny, 'label', payload.label);
      }
      if (has(payload, 'description')) {
        Vue.set(payload.phylogeny, 'description', payload.description);
      }
      if (has(payload, 'newick')) {
        Vue.set(payload.phylogeny, 'newick', payload.newick);
      }
      if (has(payload, '@id')) {
        Vue.set(payload.phylogeny, '@id', payload['@id']);
      }
    },
  },
  actions: {
    changePhylogenyID(context, payload) {
      // When changing a phylogeny ID, care needs to be taken to ensure that:
      //  (1) duplicate phylogeny IDs are not created within the same file, and
      //  (2) all current references to this phylogeny continue to make sense.

      // Check arguments.
      if (!has(payload, 'phylogeny')) {
        throw new Error('changePhylogenyID needs a phylogeny to modify using the "phylogeny" argument');
      }

      if (!has(payload, 'phylogenyID')) {
        throw new Error('changePhylogenyID needs a new phylogeny ID using the "phylogenyID" argument');
      }

      // What was the previous phylogeny ID?
      const oldPhylogenyID = context.rootGetters.getPhylogenyId(payload.phylogeny);

      // No need to do anything if they haven't changed.
      if (oldPhylogenyID === payload.phylogenyID) return;

      // Do any of our current phylogenies have this ID?
      const phylogenyWithDuplicateID = context.rootState.phyx.currentPhyx.phylogenies.find(phylogeny => has(phylogeny, '@id') && phylogeny['@id'] === payload.phylogenyID);
      if (phylogenyWithDuplicateID) {
        throw new Error(`Attempt to change ${oldPhylogenyID} to ${payload.phylogenyID} failed: duplicate phylogeny ID detected.`);
      }

      // TODO: update all internal references.

      // Change the phylogeny.
      context.commit('setPhylogenyProps', {
        phylogeny: payload.phylogeny,
        '@id': payload.phylogenyID,
      });
    },
  },
};
