// Import Vue.
import Vue from 'vue';

// Import Bootstrap.
import 'bootstrap';
import BootstrapVue from 'bootstrap-vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';

// Use icons from Font Awesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Import the main Vue file.
import App from './App.vue';

// Import our Vuex store.
import store from './store';

// Set up FontAwesomeIcon.
library.add(faExclamationCircle);
Vue.component('font-awesome-icon', FontAwesomeIcon);

// Add additional features to Vue.
Vue.use(BootstrapVue);

// Import JQuery.
window.$ = require('jquery');

Vue.config.productionTip = false;

export default new Vue({
  el: '#app',
  store,
  render: h => h(App),
});
