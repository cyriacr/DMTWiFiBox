import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import i18n from './i18n'

Vue.config.productionTip = false
// Vue.http.headers.common['Access-Control-Allow-Origin'] = 'http://localhost:3000'
// Vue.http.headers.common['Access-Control-Request-Method'] = '*'/ipaddr

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
