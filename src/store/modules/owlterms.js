/*
 * Provides access to terms in the generated JSON-LD file, in particular URIs
 * for the file, phylogenies and phyloreferences.
 */

export default {
  state: {
    phyxBaseURI: '',
  },
  getters: {
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => {
      return `#phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`;
    },
    getBaseURIForPhyloref: (state, getters, rootState) => phyloref => {
      return `#phyloref${rootState.phyx.currentPhyx.phylorefs.indexOf(phyloref)}`;
    },
  },
};
