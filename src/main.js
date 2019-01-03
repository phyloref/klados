// Import Vue.
import Vue from 'vue';

// Import Bootstrap.
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import Bootstrap-Vue, which helps integrate Bootstrap with Vue.
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

import 'bootstrap-vue/dist/bootstrap-vue.css';

// Import the main Vue file.
import App from './App.vue';

// Import our Vuex store.
import store from './store';

// Import JQuery.
window.$ = require('jquery');

Vue.config.productionTip = false;

export default new Vue({
  el: '#app',
  store,
  render: h => h(App),
});
