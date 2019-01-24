export default {
  getters: {
    getBaseURIForPhylogeny: (state, getters, rootState) => phylogeny => {
      return `http://phyloref.org/curation-tool/#currentPhyx_phylogeny${rootState.phyx.currentPhyx.phylogenies.indexOf(phylogeny)}`;
    },
  },
};
