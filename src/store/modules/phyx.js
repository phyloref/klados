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
