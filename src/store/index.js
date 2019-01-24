import Vue from 'vue';
import Vuex from 'vuex';

// Import modules.
import phyx from './modules/phyx';
import ui from './modules/ui';
import owlterms from './modules/owlterms';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: {
    CURATION_TOOL_VERSION: '0.1',
  },
  modules: { phyx, ui, owlterms },
  strict: debug,
});
