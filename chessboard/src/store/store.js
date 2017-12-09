import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        game: {
            halfmoves: [],
            captures: {
                white: [],
                black: []
            },
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
            }
        },
        theme: {

        }
    },

    getters: {
        score(state) {
            const values = {
                P: 1,
                N: 3,
                B: 3,
                R: 5,
                Q: 9
            }

            const capsWhite = state.game.captures.white
            const capsBlack = state.game.captures.black

            let score = 0

            capsWhite.forEach(elmt => {
                score -= values[elmt]
            })
            capsBlack.forEach(elmt => {
                score += values[elmt]
            })

            return score
        }
    },

    mutations: {
        updateConfigFEN(state, fen) {
            state.game.fen = fen
        },
        addPGNMove(state, move) {
            state.game.pgn.moves.push(move)
        },
        addHalfMove(state, move) {
            state.game.halfmoves.push(move)
        },
        addCapturedPiece(state, piece) {
            state.game.captures[piece.color === 'W' ? 'white' : 'black'].push(piece.type)
        }
    },
})
