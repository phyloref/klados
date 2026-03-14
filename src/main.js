// Import Vue.
import { createApp, configureCompat } from '@vue/compat';

// Configure Vue 2 compat mode before app creation.
configureCompat({ MODE: 2 });

// Import Phylotree CSS file.
import 'phylotree/dist/phylotree.css';

// Import Bootstrap.
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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

// Set up Vue app.
const app = createApp(App);
app.use(store);
app.mount('#app');
