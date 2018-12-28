import Vue from 'vue'

// Important Bootstrap and a default theme that mimicks the Bootstrap 3 theme.
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-4-theme/dist/bootstrap-theme.min.css'

// Import the main Vue file.
import App from './App.vue'

// Import our Vuex store.
import store from './store'

Vue.config.productionTip = false

new Vue({
  el: '#app',
  store,
  render: h => h(App),
})
