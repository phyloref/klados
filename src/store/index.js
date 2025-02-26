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
    // The reasoning results returned by JPhyloRef.
    // We need to store this globally so that two modules can access and edit it:
    //  - resolution needs it to store and retrieve resolution information.
    //  - phylogeny needs it so we can reset reasoning results if a phylogeny changes.
    reasoningResults: undefined,
  },
  modules: {
    phylogeny, phyloref, phyx, ui, citations, resolution,
  },
  strict: debug,
});
