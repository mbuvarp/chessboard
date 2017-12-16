// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Icon from 'vue-awesome/components/Icon'
import App from './App'
import TabViewer from './components/controls/TabViewer'
import router from './router'
import store from './store/store'
import helpers from './functions/helpers'
import prototype from './functions/prototype'
import bus from './functions/bus'

Vue.config.productionTip = false

Vue.use(store)
Vue.use(helpers)
Vue.use(prototype)
Vue.use(bus)

Vue.component('icon', Icon)
Vue.component('tab-viewer', TabViewer)

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    store,
    template: '<App/>',
    components: { App },
})
