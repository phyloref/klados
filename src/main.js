// Import Vue.
import { createApp } from 'vue';

// Import Phylotree CSS file.
import 'phylotree/dist/phylotree.css';

// Import Bootstrap.
import 'bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';


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

// Set up the Vue application.
export default createApp(App)
  .use(store)
  .mount('#app');
