/*
 * Provides access to terms in the generated JSON-LD file, in particular URIs
 * for the file, phylogenies and phyloreferences.
 */

export default {
  state: {
    phyxBaseURI: 'http://phyloref.org/curation-tool#',
  },
  getters: {
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => {
      return `http://phyloref.org/curation-tool#phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`;
    },
    getBaseURIForPhyloref: (state, getters, rootState) => phyloref => {
      return `http://phyloref.org/curation-tool#phyloref${rootState.phyx.currentPhyx.phylorefs.indexOf(phyloref)}`;
    },
  },
};
