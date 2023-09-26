/*
 * The UI Store module handles UI elements, such as which view is currently
 * displayed.
 */
import Vue from "vue";

export default {
  state: {
    // What should be displayed?
    display: {
      phyloref: undefined,
      phylogeny: undefined,
      specifier: undefined,
    },
  },
  mutations: {
    changeDisplay(state, newDisplay) {
      // Change the main view of the UI to select a particular element.
      // The new view object should contain some combination of the following keys:
      //  'phyloref': A phyloreference to display.
      //  'phylogeny': A phylogeny to display.
      //  'specifier': A specifier to display.
      Vue.set(state, "display", newDisplay);
    },
  },
};
