// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Icon from 'vue-awesome/components/Icon'
import App from './App'
import TabViewer from './components/controls/TabViewer'
import PopupDialog from './components/controls/PopupDialog'
import router from './router'
import store from './store/store'
import helpers from './functions/helpers'
import prototype from './functions/prototype'
import bus from './functions/bus'
import popup from './functions/popup'

Vue.config.productionTip = false

Vue.use(store)
Vue.use(helpers)
Vue.use(prototype)
Vue.use(bus)
Vue.use(popup)

Vue.component('icon', Icon)
Vue.component('tab-viewer', TabViewer)
Vue.component('popup-dialog', PopupDialog)

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    store,
    template: '<App/>',
    components: { App },
})
