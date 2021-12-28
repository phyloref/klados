// Import Vue.
import Vue from 'vue';

// Import Bootstrap.
import 'bootstrap';
import BootstrapVue from 'bootstrap-vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';

// Use vue-resize to track when phylogenies are resized.
import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

// Import phylotree.js
import 'phylotree/dist/phylotree.css';

// Import the main Vue file.
import App from './App.vue';

// Import our Vuex store.
import store from './store';

// Set up JQuery as a global.
window.$ = require('jquery');

// Load configuration from the 'src/config.js' file included with the source.
Vue.prototype.$config = require('./config.js');

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
