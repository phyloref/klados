// Import Vue.
import Vue from 'vue';

// Important Bootstrap and a default theme that mimicks the Bootstrap 3 theme.
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-4-theme/dist/bootstrap-theme.min.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';

// Use icons from Font Awesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Use vue-resize to track when phylogenies are resized.
import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

// Import the main Vue file.
import App from './App.vue';

// Import our Vuex store.
import store from './store';

// Set up FontAwesomeIcon.
library.add(faExclamationCircle);
Vue.component('font-awesome-icon', FontAwesomeIcon);

// Add additional features to Vue.
Vue.use(BootstrapVue);
Vue.use(VueResize);

// Turn off the Vue production tip on the console on Vue startup.
Vue.config.productionTip = false;

// Set up Vue object.
export default new Vue({
  el: '#app',
  store,
  render: h => h(App),
});
