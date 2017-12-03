import Vue from 'vue';
import Router from 'vue-router';
import Main from '@/components/Main';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'Main',
            component: Main,
        },
    ],
});

// Prototype
function removeIf(callback) {
    let i = this.length
    while (i--) {
        if (callback(this[i], i)) {
            this.splice(i, 1)
        }
    }
}
Array.prototype.removeIf = removeIf
