// Include Vue and Vuex to set up them up correctly.
import Vue from 'vue';
import Vuex from 'vuex';

// Import individual store modules.
import phylogeny from './modules/phylogeny';
import phyloref from './modules/phyloref';
import phyx from './modules/phyx';
import ui from './modules/ui';
import owlterms from './modules/owlterms';
import citations from './modules/citations';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: {
    CURATION_TOOL_VERSION: '0.1',
  },
  modules: {
    phylogeny, phyloref, phyx, ui, owlterms, citations,
  },
  strict: debug,
});
