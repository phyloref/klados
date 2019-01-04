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
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', phyx);
    },
    setPhyxAsLoaded(state, phyx) {
      // Replace the current Phyx file using an object. This also updates
      // the loaded Phyx, so we can check for changes from the loaded file.
      Vue.set(state, 'currentPhyx', phyx);
      Vue.set(state, 'phyxAsLoaded', JSON.parse(JSON.stringify(phyx)));
    },
  },
};
