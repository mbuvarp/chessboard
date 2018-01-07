import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        game: {
            playerWhite: 'White',
            playerBlack: 'Black',

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

                flipped: false
            }
        },
        theme: {
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
        resetGame(state, pgn) {
            // General
            state.game.halfmoves = []
            state.game.captures = {
                white: [],
                black: []
            }
            state.game.board = {
                highlight: {
                    legal: true,
                    move: true
                },

                flipped: false
            }

            // No pgn
            if (typeof pgn !== 'object') {
                state.game.playerWhite = 'White'
                state.game.playerBlack = 'Black'
                state.game.fen = ''
                state.game.pgn = {
                    event: null,
                    site: null, // City, Region COUNTRY (three letter code, IOC)
                    date: '??', // YYYY.MM.DD (?? = unknown)
                    round: null,
                    white: null, // Lastname, Firstname
                    black: null, // Lastname, Firstname
                    result: '*', // 1-0, 0-1, 1/2-1/2, * (other, e.g. ongoing)
                    moves: []
                }
            // From pgn
            } else {
                state.game.playerWhite = pgn.white
                state.game.playerBlack = pgn.black
                state.game.pgn = pgn
                state.game.board = {
                    highlight: {
                        legal: true,
                        move: true
                    },

                    flipped: false
                }
            }
        },

        updateConfigFEN(state, fen) {
            state.game.fen = fen
        },
        addPGNMove(state, move) {
            state.game.pgn.moves.push(move)
        },
        emptyPGNMoves(state) {
            state.game.pgn.moves = []
        },
        /*
          Halfmove contains:
            captured (captured piece or null)
            castling (0 for none, 1 for kingside, 2 for queenside)
            castlingOpportunities
              blackKing (true/false)
              blackQueen (true/false)
              whiteKing (true/false)
              whiteQueen (true/false)
            check (true/false)
            enPassant (string, square)
            piece (ChessPiece)
            promotion (string, 'RNBQ')
            source (string)
            target (string)
            timespan (ms)
        */
        addHalfMove(state, move) {
            state.game.halfmoves.push(move)
        },
        addCapturedPiece(state, piece) {
            state.game.captures[piece.color === 'W' ? 'white' : 'black'].push(piece.type)
        }
    },
})
