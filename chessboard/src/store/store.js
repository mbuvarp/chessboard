import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        halfmoves: [],
        config: {
            fen: '',
            pgn: {
                event: null,
                site: null, // City, Region COUNTRY (three letter code, IOC)
                date: '??', // YYYY.MM.DD (?? = unknown)
                round: null,
                white: null, // Lastname, Firstname
                black: null, // Lastname, Firstname
                result: '*', // 1-0, 0-1, 1/2-1/2, * (other, e.g. ongoing)
                moves: []
            },
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
        updateConfigFEN(state, fen) {
            state.config.fen = fen
        },
        addPGNMove(state, move) {
            state.config.pgn.moves.push(move)
        },
        addHalfMove(state, move) {
            state.halfmoves.push(move)
        }
    },
})
