import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        config: {
            fen: '',
            pgn: '',
            board: {
                highlight: {
                    legal: true,
                    move: true
                },

                flipped: false,

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
            },
            theme: {

            }
        }
    },

    mutations: {
        updateConfigFEN(state, value) {
            state.config.fen = value
        }
    }
})
