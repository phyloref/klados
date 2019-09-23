/**
 * This state module provides methods to store and retrieve the resolution results
 * of phyloreferences from JPhyloRef.
 */

import Vue from 'vue';
import { has } from 'lodash';

import { PhylogenyWrapper } from '@phyloref/phyx';

export default {
  state: {
    // The reasoning results returned by JPhyloRef.
    reasoningResults: undefined,
  },
  getters: {
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => `#phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`,
    getBaseURIForPhyloref: (state, getters, rootState) => phyloref => `#phyloref${rootState.phyx.currentPhyx.phylorefs.indexOf(phyloref)}`,
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
    getExpectedResolutionData: (state, getters) => (phyloref, phylogeny) => {
      if (!has(phyloref, 'expectedResolution')) return {};
      if (has(phylogeny, '@id') && has(phyloref.expectedResolution, phylogeny['@id'])) {
        return phyloref.expectedResolution[phylogeny['@id']];
      }

      const phylogenyURI = getters.getBaseURIForPhylogeny(phylogeny);
      if (has(phyloref.expectedResolution, phylogenyURI)) {
        return phyloref.expectedResolution[phylogenyURI];
      }

      return {};
    },
    getExpectedNodeLabel: (state, getters) => (phyloref, phylogeny) => {
      // Return a list of nodes that this phyloreference is expected to resolve to.
      const expectedResolution = getters.getExpectedResolutionData(phyloref, phylogeny);

      if (has(expectedResolution, 'nodeLabel')) {
        return expectedResolution.nodeLabel;
      }

      // Is there a node on the phylogeny with the same label as this phyloreference?
      const allNodeLabels = new PhylogenyWrapper(phylogeny).getNodeLabels();
      if (phyloref.label && allNodeLabels.includes(phyloref.label)) {
        return phyloref.label;
      }

      // No expected node labels!
      return undefined;
    },
  },
  mutations: {
    setReasoningResults(state, payload) {
      // Sets the "reasoning results" -- the results of reasoning returned by JPhyloRef.
      Vue.set(state, 'reasoningResults', payload);
    },
  },
};
