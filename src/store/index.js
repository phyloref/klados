import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: {
    CURATION_TOOL_VERSION: '0.1',
    testcase: {
      phylorefs: [],
      phylogenies: [],
    },
  },
  strict: debug,
});
