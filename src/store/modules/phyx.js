import Vue from 'vue';

export default {
  state: {
    currentPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
    loadedPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
  },
  getters: {
    // Read as JSON.
    getPhyxAsJSON: state => JSON.stringify(state.currentPhyx, undefined, 4),
  },
  mutations: {
    setCurrentPhyx(state, phyx) {
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', phyx);
    },
    setLoadedPhyx(state, phyx) {
      // Replace the current loaded Phyx file using an object. This also updates
      // the loaded Phyx, so we can check for changes from the loaded file.
      if (phyx === state.currentPhyx) {
        // A common error is using the same object as the current Phyx and the
        // loaded Phyx. In that case, we deep-copy loaded Phyx so that modifying
        // one won't automatically modify the other.
        Vue.set(state, 'loadedPhyx', JSON.parse(JSON.stringify(phyx)));
      } else {
        Vue.set(state, 'loadedPhyx', phyx);
      }
    },
    },
  },
};
