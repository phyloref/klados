// Import Vue.
import Vue from 'vue';

// Import VueCookies (https://www.npmjs.com/package/vue-cookies)
import VueCookies from 'vue-cookies';

// Import Phylotree.
import 'phylotree';

// Import Bootstrap.
import 'bootstrap';
import BootstrapVue from 'bootstrap-vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';

// Use vue-resize to track when phylogenies are resized.
import VueResize from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

// Import the main Vue file.
import App from './App.vue';

// Import our Vuex store.
import store from './store';

// Set up JQuery as a global.
import jQuery from "jquery";
window.$ = jQuery;

// Set up Buffer as a global (csv-stringify needs this).
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

// Load configuration from the 'src/config.js' file included with the source.
// Vue.prototype.$config = require('./config.js');

// Add additional features to Vue.
Vue.use(BootstrapVue);
Vue.use(VueResize);
Vue.use(VueCookies);

// Turn off the Vue production tip on the console on Vue startup.
Vue.config.productionTip = false;

// Set up Vue object.
export default new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
