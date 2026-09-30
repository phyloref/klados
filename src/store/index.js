// Include Vuex to set it up correctly.
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
  // Strict mode never actually checks anything. Vuex only asserts "do not mutate
  // vuex store state outside mutation handlers" when NODE_ENV is not
  // 'production', but this turns strict mode on only in production, so all it
  // does there is run a deep synchronous watcher over the whole store. Enabling
  // it in development instead would fail wherever a v-model writes straight into
  // store state (the apomorphy fields in PhylorefView, for one).
  strict: debug,
});
