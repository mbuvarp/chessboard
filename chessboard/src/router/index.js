import Vue from 'vue';
import Router from 'vue-router';
import Game from '@/components/Game';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Game,
        },
        {
            path: '/game',
            name: 'Game',
            component: Game
        }
    ],
});
