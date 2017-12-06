import Vue from 'vue'

const EventBus = {
    install(vue) {
        const bus = new Vue()
        vue.prototype.$bus = bus
    }
}

export default EventBus
