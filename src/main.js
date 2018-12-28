import Vue from 'vue'
import App from './App.vue'

// Important Bootstrap and a default theme that mimicks the Bootstrap 3 theme.
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-4-theme/dist/bootstrap-theme.min.css'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
