/*
 * Store module for modifying phyloreferences.
 */

import Vue from 'vue';
import { has } from 'lodash';

export default {
  mutations: {
    setPhylorefProps(state, payload) {
      if (!has(payload, 'phyloref')) {
        throw new Error('setPhylorefProps needs a phyloref to modify using the "phyloref" argument');
      }
      if (has(payload, 'label')) {
        Vue.set(payload.phyloref, 'label', payload.label);
      }
      if (has(payload, 'cladeDefinition')) {
        Vue.set(payload.phyloref, 'cladeDefinition', payload.cladeDefinition);
      }
      if (has(payload, 'curatorComments')) {
        Vue.set(payload.phyloref, 'curatorComments', payload.curatorComments);
      }
    },
  },
};
