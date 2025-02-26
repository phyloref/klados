// Include Vue and Vuex to set up them up correctly.
import Vue from 'vue';
import Vuex from 'vuex';

// Import individual store modules.
import phylogeny from './modules/phylogeny';
import phyloref from './modules/phyloref';
import phyx from './modules/phyx';
import resolution from './modules/resolution';
import ui from './modules/ui';
import citations from './modules/citations';

Vue.use(Vuex);

const debug = import.meta.env.PROD;

export default new Vuex.Store({
  state: {
    CURATION_TOOL_VERSION: '0.1',
  },
  modules: {
    phylogeny, phyloref, phyx, ui, citations, resolution,
  },
  strict: debug,
});
