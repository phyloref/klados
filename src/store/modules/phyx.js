import Vue from 'vue';

export default {
  namespaced: true,
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
    asJSON: state => JSON.stringify(state.currentPhyx, undefined, 4),
  },
  mutations: {
    setFromJSON(state, json) {
      Vue.set(state, 'currentPhyx', JSON.parse(json));
    },
  },
};
