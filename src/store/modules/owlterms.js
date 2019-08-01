/*
 * Provides access to terms in the generated JSON-LD file, in particular URIs
 * for the file, phylogenies and phyloreferences.
 */

export default {
  getters: {
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => `#phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`,
    getBaseURIForPhyloref: (state, getters, rootState) => phyloref => `#phyloref${rootState.phyx.currentPhyx.phylorefs.indexOf(phyloref)}`,
  },
};
