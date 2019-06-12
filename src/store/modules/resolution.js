/**
 * This state module provides methods to store and retrieve the resolution results
 * of phyloreferences from JPhyloRef.
 */

import Vue from 'vue';
import { has } from 'lodash';

export default {
  state: {
    // The reasoning results returned by JPhyloRef.
    reasoningResults: undefined,
  },
  getters: {
    getResolvedNodesForPhylogeny: (state, getters) => (
      phylogeny,
      phyloref,
      flagReturnShortURIs = false,
    ) => {
      // Return a list of nodes that were resolved for phyloref `phyloref` on
      // phylogeny `phylogeny`.
      // - flagReturnNodeURI: if true, the entire URI will be returned, otherwise
      // just the node number will be returned.

      // Do we have reasoning results for this phyloreference?
      const phylorefURI = getters.getBaseURIForPhyloref(phyloref);
      if (
        !has(state.reasoningResults, 'phylorefs')
         || !has(state.reasoningResults.phylorefs, phylorefURI)
      ) return [];

      // Identify the resolved nodes.
      const nodesResolved = state.reasoningResults.phylorefs[phylorefURI];
      const phylogenyURI = getters.getBaseURIForPhylogeny(phylogeny);
      const nodeURIs = nodesResolved.filter(uri => uri.includes(phylogenyURI));

      // Either return the URIs as-is or remove the phylogeny URI (so we return e.g. "node21").
      if (!flagReturnShortURIs) return nodeURIs;
      return nodeURIs.map(iri => iri.replace(`${phylogenyURI}_`, ''));
    },
  },
  mutations: {
    setReasoningResults(state, payload) {
      // Sets the "reasoning results" -- the results of reasoning returned by JPhyloRef.
      Vue.set(state, 'reasoningResults', payload);
    },
  },
};
