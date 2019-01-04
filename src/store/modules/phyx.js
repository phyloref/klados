import Vue from 'vue';

export default {
  state: {
    currentPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
    phyxAsLoaded: {
      phylorefs: [],
      phylogenies: [],
    },
  },
  getters: {
    // Make it easier to access the key parts of the current Phyx file.
    phylorefs: state => state.currentPhyx.phylorefs,
    phylogenies: state => state.currentPhyx.phylogenies,

    // Read as JSON.
    getPhyxAsJSON: state => JSON.stringify(state.currentPhyx, undefined, 4),
  },
  mutations: {
    setPhyx(state, phyx) {
      // Replace the current PHYX file using an object.
      Vue.set(state, 'currentPhyx', phyx);
    },
  },
};
