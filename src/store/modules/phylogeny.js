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
      if (has(payload, 'title')) {
        Vue.set(payload.phylogeny, 'title', payload.title);
      }
      if (has(payload, 'description')) {
        Vue.set(payload.phylogeny, 'description', payload.description);
      }
      if (has(payload, 'newick')) {
        Vue.set(payload.phylogeny, 'newick', payload.newick);
      }
    },
  },
};
