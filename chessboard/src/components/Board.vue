<template>
    
    <div class="container">
        <div class="numbers">
            <div v-for="number in numbers" class="number" v-text="number"></div>
        </div>
        <div id="board">
            
            <div class="squares">
                <div v-for="rank in squares" class="rank">
                    <div
                        v-for="square in rank"
                        :class="{
                            'square': true,
                            'highlight-legal': highlightLegalSquare(square),
                            'highlight-move': highlightMoveSquare(square)
                        }"
                        :data-square="square"
                    >
                        <div
                            class="piece"
                            :style="'background-image: url(' + getPieceImagePath(square) + ');'"
                            v-if="getPieceBySquare(square)"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="corner"></div>
        <div class="letters">
            <div v-for="letter in letters" class="letter" v-text="letter"></div>
        </div>
    </div>

</template>

<script>
    import { mapState } from 'vuex'
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

                currentPiece: null,

                highlightedSquares: {
                    legalMoves: [],
                    move: []
                }
            }
        },

        computed: {
            ...mapState({
                boardConfig: state => state.config.board
            })
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

                this.currentPiece = piece

                if (this.boardConfig.highlight.legal)
                    this.highlightedSquares.legalMoves = piece.legalMoves
                if (this.boardConfig.highlight.move)
                    this.highlightedSquares.move.push(square)
            },
            pieceDragMove(evt) {
                const pieceElement = evt.target
                // keep the dragged position in the data-x/data-y attributes
                const x = (parseFloat(pieceElement.getAttribute('data-x')) || 0) + evt.dx
                const y = (parseFloat(pieceElement.getAttribute('data-y')) || 0) + evt.dy

                // translate the element
                // pieceElement.style.webkitTransform = `translate(${x}px, ${y}px)`
                // pieceElement.style.transform = `translate(${x}px, ${y}px)`
                pieceElement.style.left = x
                pieceElement.style.top = y
                pieceElement.style.zIndex = 1000

                // update the posiion attributes
                pieceElement.setAttribute('data-x', x)
                pieceElement.setAttribute('data-y', y)
            },
            pieceDragEnd(evt) {
                const pieceElement = evt.target
                pieceElement.style.zIndex = 100
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

                this.highlightedSquares.move = []

                // Check if move is legal
                const square = squareElement.getAttribute('data-square')
                if (this.currentPiece.moveIsLegal(square)) {
                    this.performMove(square)
                }

                // pieceElement.style.webkitTransform = 'translate(0px, 0px)'
                // pieceElement.style.transform = 'translate(0px, 0px)'
                pieceElement.style.left = 0
                pieceElement.style.top = 0

                // Update the posiion attributes
                pieceElement.setAttribute('data-x', 0)
                pieceElement.setAttribute('data-y', 0)

                squareElement.classList.remove('piece-drag-over')

                // Update currentPiece and refresh legal moves
                this.currentPiece = null
                this.highlightedSquares.legalMoves = []
            },

            performMove(square, piece) {
                if (typeof piece === 'undefined')
                    piece = this.currentPiece

                // Check if there is a capture
                if (this.squareIsOccupied(square, piece.opponent))
                    this.capturePiece(this.getPieceBySquare(square))


                const prevSquare = piece.square
                piece.square = square

                if (this.boardConfig.highlight.move)
                    this.highlightedSquares.move = [prevSquare, square]
                
                this.findAllLegalMoves()
            },
            capturePiece(piece) {
                console.log(piece)
                piece.capture()
            },

            squareIsOccupied(square, color) {
                const piece = this.getPieceBySquare(square)
                if (color)
                    return typeof piece !== 'undefined' && piece.color === color
                return typeof piece !== 'undefined'
            },
            findAllLegalMoves() {
                for (let i = 0; i < this.pieces.length; ++i)
                    if (!this.pieces[i].is_captured)
                        this.pieces[i].legalMoves = this.findLegalMovesForPiece(this.pieces[i])
            },
            findLegalMovesForPiece(piece) {
                // TODO check if can move, e.g. if there is a discovered check

                // Function to get letter from col number
                const lfc = col => String.fromCharCode(64 + col)
                // Function to get square from numbers
                const sfn = (col, rank) => `${lfc(col)}${rank}`
                // Function to get numbers from square
                const stn = sqr => [sqr.charCodeAt(0) - 64, parseInt(sqr.substring(1, 2), 10)]

                let legalMoves = []

                const letter = piece.square.substring(0, 1)
                const col = letter.charCodeAt(0) - 64
                const rank = parseInt(piece.square.substring(1, 2), 10)

                if (piece.type === 'P') {
                    // TODO en passant

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

                    // Check if squares are occupied
                    legalMoves.removeIf(square => this.squareIsOccupied(square))

                    // Check diagonal attack
                    if (piece.color === 'W') {
                        if (col > 1)
                            if (this.squareIsOccupied(sfn(col - 1, rank + 1), 'B'))
                                legalMoves.push(sfn(col - 1, rank + 1))
                        if (col < 8)
                            if (this.squareIsOccupied(sfn(col + 1, rank + 1), 'B'))
                                legalMoves.push(sfn(col + 1, rank + 1))
                    } else {
                        if (col > 1)
                            if (this.squareIsOccupied(sfn(col - 1, rank - 1), 'W'))
                                legalMoves.push(sfn(col - 1, rank - 1))
                        if (col < 8)
                            if (this.squareIsOccupied(sfn(col + 1, rank - 1), 'W'))
                                legalMoves.push(sfn(col + 1, rank - 1))
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

                    // Check blockage
                    // Col first
                    let sameCol = legalMoves.filter(move => stn(move)[0] === col)
                    const sameColAbove = sameCol.filter(move => stn(move)[1] > rank).sort(move => stn(move)[1] < rank)
                    const sameColBelow = sameCol.filter(move => stn(move)[1] < rank).sort(move => stn(move)[1] < rank)

                    for (let r = 0; r < sameColAbove.length; ++r) {
                        if (this.squareIsOccupied(sameColAbove[r])) {
                            const own = this.squareIsOccupied(sameColAbove[r], piece.color)
                            sameColAbove.splice(own ? r : r + 1)
                            break
                        }
                    }
                    for (let r = 0; r < sameColBelow.length; ++r) {
                        if (this.squareIsOccupied(sameColBelow[r])) {
                            const own = this.squareIsOccupied(sameColBelow[r], piece.color)
                            sameColBelow.splice(own ? r : r + 1)
                            break
                        }
                    }
                    sameCol = sameColAbove.concat(sameColBelow)

                    // Then rank
                    let sameRank = legalMoves.filter(move => stn(move)[1] === rank)
                    const sameRankLeft = sameRank.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] < col)
                    const sameRankRight = sameRank.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < sameRankLeft.length; ++c) {
                        if (this.squareIsOccupied(sameRankLeft[c])) {
                            const own = this.squareIsOccupied(sameRankLeft[c], piece.color)
                            sameRankLeft.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < sameRankRight.length; ++c) {
                        if (this.squareIsOccupied(sameRankRight[c])) {
                            const own = this.squareIsOccupied(sameRankRight[c], piece.color)
                            sameRankRight.splice(own ? c : c + 1)
                            break
                        }
                    }
                    sameRank = sameRankLeft.concat(sameRankRight)

                    legalMoves = sameCol.concat(sameRank)
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

                    legalMoves.removeIf(sqr => this.squareIsOccupied(sqr, piece.color))
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

                    // Check blockage
                    // Top first
                    let north = legalMoves.filter(move => stn(move)[1] > rank)
                    const northWest = north.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] > col)
                    const northEast = north.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < northWest.length; ++c) {
                        if (this.squareIsOccupied(northWest[c])) {
                            const own = this.squareIsOccupied(northWest[c], piece.color)
                            northWest.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < northEast.length; ++c) {
                        if (this.squareIsOccupied(northEast[c])) {
                            const own = this.squareIsOccupied(northEast[c], piece.color)
                            northEast.splice(own ? c : c + 1)
                            break
                        }
                    }
                    north = northWest.concat(northEast)

                    // Then bottom
                    let south = legalMoves.filter(move => stn(move)[1] < rank)
                    const southWest = south.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] > col)
                    const southEast = south.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < southWest.length; ++c) {
                        if (this.squareIsOccupied(southWest[c])) {
                            const own = this.squareIsOccupied(southWest[c], piece.color)
                            southWest.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < southEast.length; ++c) {
                        if (this.squareIsOccupied(southEast[c])) {
                            const own = this.squareIsOccupied(southEast[c], piece.color)
                            southEast.splice(own ? c : c + 1)
                            break
                        }
                    }
                    south = southWest.concat(southEast)

                    legalMoves = north.concat(south)
                } else if (piece.type === 'Q') {
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

                    // Check blockage
                    let straight = null
                    let diagonal = null

                    // Straight first
                    // Col first
                    let sameCol = legalMoves.filter(move => stn(move)[0] === col)
                    const sameColAbove = sameCol.filter(move => stn(move)[1] > rank).sort(move => stn(move)[1] < rank)
                    const sameColBelow = sameCol.filter(move => stn(move)[1] < rank).sort(move => stn(move)[1] < rank)

                    for (let r = 0; r < sameColAbove.length; ++r) {
                        if (this.squareIsOccupied(sameColAbove[r])) {
                            const own = this.squareIsOccupied(sameColAbove[r], piece.color)
                            sameColAbove.splice(own ? r : r + 1)
                            break
                        }
                    }
                    for (let r = 0; r < sameColBelow.length; ++r) {
                        if (this.squareIsOccupied(sameColBelow[r])) {
                            const own = this.squareIsOccupied(sameColBelow[r], piece.color)
                            sameColBelow.splice(own ? r : r + 1)
                            break
                        }
                    }
                    sameCol = sameColAbove.concat(sameColBelow)

                    // Then rank
                    let sameRank = legalMoves.filter(move => stn(move)[1] === rank)
                    const sameRankLeft = sameRank.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] < col)
                    const sameRankRight = sameRank.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < sameRankLeft.length; ++c) {
                        if (this.squareIsOccupied(sameRankLeft[c])) {
                            const own = this.squareIsOccupied(sameRankLeft[c], piece.color)
                            sameRankLeft.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < sameRankRight.length; ++c) {
                        if (this.squareIsOccupied(sameRankRight[c])) {
                            const own = this.squareIsOccupied(sameRankRight[c], piece.color)
                            sameRankRight.splice(own ? c : c + 1)
                            break
                        }
                    }
                    sameRank = sameRankLeft.concat(sameRankRight)

                    straight = sameCol.concat(sameRank)

                    // Then diagonals
                    // Top first
                    let north = legalMoves.filter(move => stn(move)[1] > rank)
                    const northWest = north.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] > col)
                    const northEast = north.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < northWest.length; ++c) {
                        if (this.squareIsOccupied(northWest[c])) {
                            const own = this.squareIsOccupied(northWest[c], piece.color)
                            northWest.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < northEast.length; ++c) {
                        if (this.squareIsOccupied(northEast[c])) {
                            const own = this.squareIsOccupied(northEast[c], piece.color)
                            northEast.splice(own ? c : c + 1)
                            break
                        }
                    }
                    north = northWest.concat(northEast)

                    // Then bottom
                    let south = legalMoves.filter(move => stn(move)[1] < rank)
                    const southWest = south.filter(move => stn(move)[0] < col).sort(move => stn(move)[0] > col)
                    const southEast = south.filter(move => stn(move)[0] > col).sort(move => stn(move)[0] < col)

                    for (let c = 0; c < southWest.length; ++c) {
                        if (this.squareIsOccupied(southWest[c])) {
                            const own = this.squareIsOccupied(southWest[c], piece.color)
                            southWest.splice(own ? c : c + 1)
                            break
                        }
                    }
                    for (let c = 0; c < southEast.length; ++c) {
                        if (this.squareIsOccupied(southEast[c])) {
                            const own = this.squareIsOccupied(southEast[c], piece.color)
                            southEast.splice(own ? c : c + 1)
                            break
                        }
                    }
                    south = southWest.concat(southEast)

                    diagonal = north.concat(south)

                    legalMoves = straight.concat(diagonal)
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

                    legalMoves.removeIf(sqr => this.squareIsOccupied(sqr, piece.color))
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

                let path = piece.color.toLowerCase() + piece.type.toLowerCase()
                path = `/static/images/pieces/${this.boardConfig.pieceSet}/${path}.svg`

                return path
            },
            highlightLegalSquare(square) {
                return this.highlightedSquares.legalMoves.includes(square)
            },
            highlightMoveSquare(square) {
                return this.highlightedSquares.move.includes(square)
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

    div.container {
        width: 100%;
        height: 100%;
        font-size: 0;
        font-family: 'OpenSans-Regular', arial, sans-serif;
        font-weight: bold;
        color: #f4e1d0;

        div.numbers {
            float: left;
            width: 5%;
            height: 95%;
            background-color: #723904;

            div.number {
                float: left;
                width: 100%;
                height: 12.5%;
                line-height: 350%;
                font-size: 1.5rem;
                text-align: center;
            }
        }
        div.corner {
            display: inline-block;
            width: 5%;
            height: 5%;
            background-color: #723904;
        }
        div.letters {
            display: inline-block;
            width: 95%;
            height: 5%;
            background-color: #723904;

            div.letter {
                float: left;
                width: 12.5%;
                height: 100%;
                font-size: 1.5rem;
                text-align: center;
            }
        }
        div#board {
            position: relative;
            width: 95%;
            color: #181818;

            &:after {
                content: '';
                display: block;
                padding-bottom: 100%;
            }
            div.squares {
                display: inline-block;
                position: absolute;
                width: 100%;
                height: 100%;

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
                        &.highlight-move {
                            &:after {
                                content: '';
                                position: absolute;
                                width: 100%;
                                height: 100%;
                                background-color: rgba(244, 232, 66, 0.5);
                                z-index: 0;
                            }
                        }
                        &.highlight-legal {
                            &:after {
                                content: '';
                                position: absolute;
                                width: 100%;
                                height: 100%;
                                background-color: rgba(65, 178, 244, 0.4);
                            }
                        }
                        div.piece {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            background-size: cover;
                            cursor: pointer;
                            z-index: 10;
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
    }

</style>