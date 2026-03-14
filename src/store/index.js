// Import Vuex store creation function.
import { createStore } from 'vuex';

// Import individual store modules.
import phylogeny from './modules/phylogeny';
import phyloref from './modules/phyloref';
import phyx from './modules/phyx';
import resolution from './modules/resolution';
import ui from './modules/ui';
import citations from './modules/citations';

const debug = import.meta.env.PROD;

export default createStore({
  state: {
    CURATION_TOOL_VERSION: '0.1',
  },
  modules: {
    phylogeny, phyloref, phyx, ui, citations, resolution,
  },
  strict: debug,
});
