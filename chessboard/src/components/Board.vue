<template>
    
    <div id="board">
        <!-- <div class="numbers">
            <div v-for="number in numbers" class="number" v-text="number"></div>
        </div> -->
        <div class="squares">
            <div v-for="rank in squares" class="rank">
                <div v-for="square in rank" class="square" :data-square="square">
                    <div
                        class="piece"
                        :style="'background-image: url(' + getPieceImagePath(square) + ');'"
                        v-if="getPieceBySquare(square)"
                    ></div>
                </div>
            </div>
        </div>
        <!-- <div class="letters">
            <div class="spacing"></div>
            <div v-for="letter in letters" class="letter" v-text="letter"></div>
        </div> -->
    </div>

</template>

<script>
    import ChessPiece from '../assets/libs/chesspiece'

    const interact = require('interactjs')
    
    export default {
        name: 'Board',

        data() {
            return {
                pieces: [],
                squares: [],
                numbers: ['8', '7', '6', '5', '4', '3', '2', '1'],
                letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

                legalMoves: [],
                currentPiece: null
            }
        },

        mounted() {
            this.generateSquares()
            this.generatePieces()
            this.findAllLegalMoves()
            this.initInteract()

            document.addEventListener('keydown', this.keyDown)
        },

        methods: {

            generateSquares() {
                for (let y = 8; y > 0; --y) {
                    this.squares.push([])
                    for (let x = 65; x < 73; ++x)
                        this.squares[8 - y].push(String.fromCharCode(x) + y.toString())
                }
            },
            generatePieces() {
                // Generate officers
                const officers = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
                for (let n = 0; n < 2; ++n)
                    for (let i = 0; i < officers.length; ++i) {
                        const type = officers[i]
                        const color = n === 0 ? 'W' : 'B'
                        const side = i < 3 ? 'Q' : (i > 4 ? 'K' : null)
                        const letter = String.fromCharCode(65 + i)
                        const square = n === 0 ? `${letter}1` : `${letter}8`

                        const piece = new ChessPiece(type, color, side, square)
                        this.pieces.push(piece)
                    }

                // Generate pawns
                for (let n = 0; n < 2; ++n)
                    for (let i = 0; i < officers.length; ++i) {
                        const type = 'P'
                        const color = n === 0 ? 'W' : 'B'
                        const side = null
                        const letter = String.fromCharCode(65 + i)
                        const square = n === 0 ? `${letter}2` : `${letter}7`

                        const piece = new ChessPiece(type, color, side, square)
                        this.pieces.push(piece)
                    }
            },

            initInteract() {
                interact('.piece').draggable({
                    inertia: false,
                    restrict: {
                        restriction: '#board'
                    },
                    onstart: this.pieceDragStart,
                    onmove: this.pieceDragMove,
                    onend: this.pieceDragEnd
                })

                interact('.square').dropzone({
                    accept: '.piece',

                    ondragenter: this.pieceDragEnter,
                    ondragleave: this.pieceDragLeave,
                    ondrop: this.pieceDragDrop
                })
            },
            pieceDragStart(evt) {
                // Find legal moves
                const pieceElement = evt.target
                const square = pieceElement.parentElement.getAttribute('data-square')
                const piece = this.getPieceBySquare(square)

                console.log(piece.legalMoves)

                this.currentPiece = piece
            },
            pieceDragMove(evt) {
                const pieceElement = evt.target
                // keep the dragged position in the data-x/data-y attributes
                const x = (parseFloat(pieceElement.getAttribute('data-x')) || 0) + evt.dx
                const y = (parseFloat(pieceElement.getAttribute('data-y')) || 0) + evt.dy

                // translate the element
                pieceElement.style.webkitTransform = `translate(${x}px, ${y}px)`
                pieceElement.style.transform = `translate(${x}px, ${y}px)`
                pieceElement.style.zIndex = '1000'

                // update the posiion attributes
                pieceElement.setAttribute('data-x', x)
                pieceElement.setAttribute('data-y', y)
            },
            pieceDragEnd(evt) {
                const pieceElement = evt.target
                pieceElement.style.zIndex = '10'
            },
            pieceDragEnter(evt) {
                const square = evt.target
                square.classList.add('piece-drag-over')
            },
            pieceDragLeave(evt) {
                const square = evt.target
                square.classList.remove('piece-drag-over')
            },
            pieceDragDrop(evt) {
                const squareElement = evt.target
                const pieceElement = evt.relatedTarget

                // Check if move is legal
                const square = squareElement.getAttribute('data-square')

                if (this.currentPiece.moveIsLegal(square)) {
                    squareElement.appendChild(pieceElement)
                    this.currentPiece.square = square
                }

                pieceElement.style.webkitTransform = 'translate(0px, 0px)'
                pieceElement.style.transform = 'translate(0px, 0px)'

                // Update the posiion attributes
                pieceElement.setAttribute('data-x', 0)
                pieceElement.setAttribute('data-y', 0)

                squareElement.classList.remove('piece-drag-over')

                // Update currentPiece and refresh legal moves
                this.currentPiece = null
                this.findAllLegalMoves()
            },

            findAllLegalMoves() {
                for (let i = 0; i < this.pieces.length; ++i)
                    this.pieces[i].legalMoves = this.findLegalMovesForPiece(this.pieces[i])
            },
            findLegalMovesForPiece(piece) {
                // TODO check if can move, e.g. if there is a discovered check

                // Function to get letter from col number
                const lfc = col => String.fromCharCode(64 + col)

                const legalMoves = []

                const letter = piece.square.substring(0, 1)
                const col = letter.charCodeAt(0) - 64
                const rank = parseInt(piece.square.substring(1, 2), 10)

                if (piece.type === 'P') {
                    if (piece.color === 'W') {
                        // Advance pawn 1
                        if (rank < 8)
                            legalMoves.push(`${letter}${rank + 1}`)
                        // Advance pawn 2 if on home rank
                        if (rank === 2)
                            legalMoves.push(`${letter}${rank + 2}`)
                    } else {
                        // Advance pawn 1
                        if (rank > 1)
                            legalMoves.push(`${letter}${rank - 1}`)
                        // Advance pawn 2 if on home rank
                        if (rank === 7)
                            legalMoves.push(`${letter}${rank - 2}`)
                    }
                } else if (piece.type === 'R') {
                    // Legal ranks
                    for (let i = 1; i <= 8; ++i) {
                        if (i === rank)
                            continue
                        legalMoves.push(`${letter}${i}`)
                    }
                    // Legal cols
                    for (let i = 1; i <= 8; ++i) {
                        if (i === col)
                            continue
                        const ltr = lfc(i)
                        legalMoves.push(`${ltr}${rank}`)
                    }
                } else if (piece.type === 'N') {
                    // Move two in direction
                    const left = col - 2
                    const up = rank + 2
                    const right = col + 2
                    const down = rank - 2

                    if (left >= 1) {
                        const lu = rank + 1
                        const ld = rank - 1
                        if (lu <= 8)
                            legalMoves.push(`${lfc(left)}${lu}`)
                        if (ld >= 1)
                            legalMoves.push(`${lfc(left)}${ld}`)
                    }
                    if (up <= 8) {
                        const ul = col - 1
                        const ur = col + 1
                        if (ul >= 1)
                            legalMoves.push(`${lfc(ul)}${up}`)
                        if (ur <= 8)
                            legalMoves.push(`${lfc(ur)}${up}`)
                    }
                    if (right <= 8) {
                        const ru = rank + 1
                        const rd = rank - 1
                        if (ru <= 8)
                            legalMoves.push(`${lfc(right)}${ru}`)
                        if (rd >= 1)
                            legalMoves.push(`${lfc(right)}${rd}`)
                    }
                    if (down >= 1) {
                        const dl = col - 1
                        const dr = col + 1
                        if (dl >= 1)
                            legalMoves.push(`${lfc(dl)}${down}`)
                        if (dr <= 8)
                            legalMoves.push(`${lfc(dr)}${down}`)
                    }
                } else if (piece.type === 'B') {
                    // Moving left and up
                    for (let c = col - 1; c >= 1; --c) {
                        const r = rank + (col - c)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and up
                    for (let c = col + 1; c <= 8; ++c) {
                        const r = rank + (c - col)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving left and down
                    for (let c = col - 1; c >= 1; --c) {
                        const r = rank - (col - c)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and down
                    for (let c = col + 1; c <= 8; ++c) {
                        const r = rank - (c - col)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                } else if (piece.type === 'Q') {
                    // Everywhere but current square
                    for (let c = 1; c <= 8; ++c)
                        for (let r = 1; r <= 8; ++r)
                            if (c !== col || r !== rank)
                                legalMoves.push(`${lfc(c)}${r}`)
                } else if (piece.type === 'K') {
                    for (let c = 1; c <= 8; ++c)
                        for (let r = 1; r <= 8; ++r) {
                            if (c === col - 1 && (r === rank - 1 || r === rank + 1 || r === rank))
                                legalMoves.push(`${lfc(c)}${r}`)
                            else if (c === col && (r === rank - 1 || r === rank + 1))
                                legalMoves.push(`${lfc(c)}${r}`)
                            else if (c === col + 1 && (r === rank - 1 || r === rank + 1 || r === rank))
                                legalMoves.push(`${lfc(c)}${r}`)
                        }
                }

                return legalMoves
            },

            getPieceBySquare(square) {
                return this.pieces.find(piece => piece.square === square)
            },
            getPieceImagePath(square) {
                const piece = this.getPieceBySquare(square)
                if (!piece)
                    return ''

                let path = ''
                switch (piece.type) {
                case 'P':
                    path += 'pawn'
                    break;
                case 'R':
                    path += 'rook'
                    break;
                case 'N':
                    path += 'knight'
                    break;
                case 'B':
                    path += 'bishop'
                    break;
                case 'Q':
                    path += 'queen'
                    break;
                case 'K':
                    path += 'king'
                    break;
                default:
                    break;
                }

                path += piece.color === 'W' ? '_white' : '_black'
                path = `/static/images/pieces/${path}.png`

                return path
            },

            keyDown(evt) {
                switch (evt.key.toLowerCase()) {
                case 't':
                    break;
                default:
                    break;
                }
            }
        }
    }

</script>

<style lang="scss" scoped>
    
    @font-face {
        font-family: 'OpenSans-Regular';
        src: url('/static/fonts/OpenSans/OpenSans-Regular.ttf') format('truetype');        
    }

    div#board {
        width: 755px;
        height: 755px;
        margin: 10px auto 0;
        font-size: 0;
        font-family: 'OpenSans-Regular', arial, sans-serif;
        color: #181818;

        div.numbers {
            display: inline-block;
            width: 35px;
            height: 720px;
            background-color: #f9ca8b;

            div.number {
                float: left;
                width: 35px;
                height: 12.5%;
                line-height: 12.5%;
                font-size: 1.5rem;
                text-align: center;
            }
        }
        div.letters {
            width: 755px;
            height: 35px;
            background-color: #f9ca8b;

            div.spacing {
                display: inline-block;
                width: 35px;
            }
            div.letter {
                display: inline-block;
                width: 12.5%;
                height: 35px;
                line-height: 35px;
                font-size: 1.5rem;
                text-align: center;
            }
        }
        div.squares {
            display: inline-block;
            width: 720px;
            height: 720px;

            div.rank {
                width: 100%;
                height: 12.5%;

                div.square {
                    width: 12.5%;
                    height: 100%;
                    display: inline-block;
                    position: relative;
                    box-sizing: border-box;

                    &.piece-drag-over {
                        border: 3px solid rgba(0,0,0,0.4);
                    }

                    div.piece {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        background-size: cover;
                        cursor: pointer;

                    }
                }
                &:nth-child(odd) {
                    div.square:nth-child(odd) {
                        background-color: #eaa44f;
                    }
                    div.square:nth-child(even) {
                        background-color: #ad7129;
                    }
                }
                &:nth-child(even) {
                    div.square:nth-child(odd) {
                        background-color: #ad7129;
                    }
                    div.square:nth-child(even) {
                        background-color: #eaa44f;
                    }
                }
            }
        }
    }

</style>