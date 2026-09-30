/**
 * This state module provides methods to store and retrieve the resolution results
 * of phyloreferences from JPhyloRef.
 */

import { has, cloneDeep } from 'lodash';

import { PhylogenyWrapper } from '@phyloref/phyx';

export default {
  state: {
    // The reasoning results returned by JPhyloRef.
    reasoningResults: undefined,
  },
  getters: {
    // TODO: the following base URIs need to be in this form because that's how they are rendered in the Phyx file.
    // We previously used methods in phyx.js to coordinate these, but they were removed during a previous cleanup.
    // So we should probably put them back.

    // Return a base URI for a given phylogeny.
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => `#phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`,
    // Return a base URI for a given phyloreference.
    getBaseURIForPhyloref: (state, getters, rootState) => phyloref => `#phyloref${rootState.phyx.currentPhyx.phylorefs.indexOf(phyloref)}`,
    // Return the identifier for a given phylogeny. We will use getBaseURIForPhylogeny()
    // unless one has already been set. The getters in this module read properties
    // directly rather than testing them with lodash has(), so that Vue 3 tracks a
    // key being added (see "Reactivity" in AGENTS.md).
    getPhylogenyId: (state, getters) => (phylogeny) => {
      if (phylogeny['@id'] !== undefined) return phylogeny['@id'];
      return getters.getBaseURIForPhylogeny(phylogeny);
    },
    // Return the identifier for a given phyloref. We will use getBaseURIForPhyloref()
    // unless one has already been set.
    getPhylorefId: (state, getters) => (phyloref) => {
      if (phyloref['@id'] !== undefined) return phyloref['@id'];
      return getters.getBaseURIForPhyloref(phyloref);
    },
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
      const phylorefURI = getters.getPhylorefId(phyloref);
      const nodesResolved = state.reasoningResults?.phylorefs?.[phylorefURI];
      if (nodesResolved === undefined) return [];
      const phylogenyURI = getters.getPhylogenyId(phylogeny);

      // We look for the phylogeny URI (e.g. "#phylogeny1") in the node resolved
      // URI. To make sure that we don't accidentally match "#phylogeny12", we
      // also look for the '_' after the phylogeny URI.
      const nodeURIs = nodesResolved.filter(uri => uri.includes(`${phylogenyURI}_`));

      // Either return the URIs as-is or remove the phylogeny URI (so we return e.g. "node21").
      if (!flagReturnShortURIs) return nodeURIs;
      const results = nodeURIs.map(iri => iri.replace(`${phylogenyURI}_`, ''));

      // console.log('getResolvedNodesForPhylogeny:', phylogeny, phyloref, results);

      return results;
    },
    getExpectedResolution: (state, getters) => (phyloref, phylogeny) => {
      // Return the expected resolution information for a particular phyloref on
      // a particular phylogeny. Plain property reads, not lodash has(): a
      // phyloref starts with no `expectedResolution`, and Vue 3 only re-runs
      // whatever called this once it is added if the read is tracked (see
      // "Reactivity" in AGENTS.md).
      return phyloref.expectedResolution?.[getters.getPhylogenyId(phylogeny)] ?? {};
    },
    getExpectedNodeLabel: (state, getters) => (phyloref, phylogeny) => {
      // Return a list of nodes that this phyloreference is expected to resolve to.
      const expectedResolution = getters.getExpectedResolution(phyloref, phylogeny);

      if (expectedResolution.nodeLabel !== undefined) {
        return expectedResolution.nodeLabel;
      }

      // Is there a node on the phylogeny with the same label as this phyloreference?
      try {
        const allNodeLabels = new PhylogenyWrapper(phylogeny).getNodeLabels();
        if (phyloref.label && allNodeLabels.includes(phyloref.label)) {
          return phyloref.label;
        }
      } catch {
        return undefined;
      }

      // No expected node labels!
      return undefined;
    },
  },
  mutations: {
    setReasoningResults(state, payload) {
      // Sets the "reasoning results" -- the results of reasoning returned by JPhyloRef.
      state.reasoningResults = payload;
    },
  },
  actions: {
    setExpectedResolution(context, payload) {
      const {
        phylogeny,
        phyloref,
        expectedResolutionData,
      } = payload;

      // If this phylogeny does not already have an '@id', we should set it
      // so we don't lose track of the connection between these entities.
      let phylogenyId = phylogeny['@id'];
      if (!phylogenyId) {
        phylogenyId = context.getters.getPhylogenyId(phylogeny);
        context.commit('setPhylogenyProps', {
          phylogeny,
          '@id': phylogenyId,
        });
      }

      // What is the current expectedResolution look like?
      const currentExpectedResolution = cloneDeep(phyloref.expectedResolution || {});
      const currentExpectedResolutionForPhylogeny = currentExpectedResolution[phylogenyId] || {};

      // What needs to change?
      if (has(expectedResolutionData, 'description')) {
        currentExpectedResolutionForPhylogeny.description = expectedResolutionData.description;
      }

      if (has(expectedResolutionData, 'nodeLabel')) {
        // We need to toggle a node label as included or excluded from the
        // expected resolution.
        currentExpectedResolutionForPhylogeny.nodeLabel = expectedResolutionData.nodeLabel;
      }

      // Because JSON-LD won't be able to interpret an object whose keys are not
      // properties, we need to add a reference to the phylogenyId in the object itself.
      expectedResolutionData.phylogenyId = phylogenyId;

      // Replace the current expected resolution.
      context.commit('setPhylorefProps', {
        phyloref,
        expectedResolution: currentExpectedResolutionForPhylogeny,
        phylogenyId,
      });
    },
  },
};
