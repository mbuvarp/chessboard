import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        config: {
            board: {
                highlight: {
                    legal: true,
                    move: true
                },

                inverted: false,

                pieceSet: 'cburnett',
                pieceSets: [
                    'alfonso',
                    'cburnett',
                    'chessicons',
                    'chessmonk',
                    'freestaunton',
                    'kilfiger',
                    'makruk',
                    'maya',
                    'merida',
                    'metaltops',
                    'pirat',
                    'regular'
                ]
            }
        }
    }
})
