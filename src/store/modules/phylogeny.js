import Vue from 'vue';

export default {
  mutations: {
    setPhylogenyTitle(state, payload) {
      Vue.set(payload.phylogeny, 'title', payload.title);
    },
    setPhylorefDescription(state, payload) {
      Vue.set(payload.phylogeny, 'description', payload.description);
    },
    setPhylogenyNewick(state, payload) {
      Vue.set(payload.phylogeny, 'newick', payload.newick);
    },
  },
};
