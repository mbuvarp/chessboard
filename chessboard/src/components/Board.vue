<template>
    
    <div id="board">
        <div class="numbers">
            <div v-for="number in numbers" class="number" v-text="number"></div>
        </div>
        <div class="squares">
            <div v-for="(rank, rankIndex) in squares" class="rank">
                <div v-for="(square, squareIndex) in rank" class="square" :data-square="calculateSquare(rankIndex, squareIndex)">
                    <div
                        class="piece"
                        :style="'background-image: url(' + getPieceImagePath(square) + ');'"
                        v-if="square !== ''"
                    ></div>
                </div>
            </div>
        </div>
        <div class="letters">
            <div class="spacing"></div>
            <div v-for="letter in letters" class="letter" v-text="letter"></div>
        </div>
    </div>

</template>

<script>
    const interact = require('interactjs')
    
    export default {
        name: 'Board',

        data() {
            return {
                squares: [],
                numbers: ['8', '7', '6', '5', '4', '3', '2', '1'],
                letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

                legalMoves: [],
                pieceDraggedFrom: []
            }
        },

        mounted() {
            this.generateSquares()
            this.fillSquares()
            this.initInteract()
        },

        methods: {

            generateSquares() {
                for (let y = 0; y < 8; ++y) {
                    this.squares.push([])
                    for (let x = 0; x < 8; ++x)
                        this.squares[y].push('')
                }
            },
            fillSquares() {
                const rank1 = ['WRQ', 'WNQ', 'WBQ', 'WQ', 'WK', 'WBK', 'WNK', 'WRK']
                const rank2 = ['WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'WP6', 'WP7', 'WP8']
                const rank7 = ['BP1', 'BP2', 'BP3', 'BP4', 'BP5', 'BP6', 'BP7', 'BP8']
                const rank8 = ['BRQ', 'BNQ', 'BBQ', 'BQ', 'BK', 'BBK', 'BNK', 'BRK']

                this.squares[7] = rank1
                this.squares[6] = rank2
                this.squares[1] = rank7
                this.squares[0] = rank8
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
                const piece = evt.target
                const square = piece.parentElement.getAttribute('data-square')

                // Get array pos from square number
                const rank = 8 - parseInt(square.substring(1, 2), 10)
                const col = square.charCodeAt(0) - 65

                const pieceDescriptor = this.squares[rank][col]
                const pieceColor = pieceDescriptor.substring(0, 1)
                const pieceType = pieceDescriptor.substring(1, 2)

                const legalMoves = this.findLegalMoves(pieceType, pieceColor, rank, col)
                this.legalMoves = legalMoves

                // Update where piece started
                this.pieceDraggedFrom = [rank, col]
                console.log(legalMoves)
            },
            pieceDragMove(evt) {
                const piece = evt.target
                // keep the dragged position in the data-x/data-y attributes
                const x = (parseFloat(piece.getAttribute('data-x')) || 0) + evt.dx
                const y = (parseFloat(piece.getAttribute('data-y')) || 0) + evt.dy

                // translate the element
                piece.style.webkitTransform = `translate(${x}px, ${y}px)`
                piece.style.transform = `translate(${x}px, ${y}px)`
                piece.style.zIndex = '1000'

                // update the posiion attributes
                piece.setAttribute('data-x', x)
                piece.setAttribute('data-y', y)
            },
            pieceDragEnd(evt) {
                const piece = evt.target
                piece.style.zIndex = '10'
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
                const square = evt.target
                const piece = evt.relatedTarget

                // Check if move is legal
                const squareDescriptor = square.getAttribute('data-square')
                // Get array pos from square descriptor
                const rank = 8 - parseInt(squareDescriptor.substring(1, 2), 10)
                const col = squareDescriptor.charCodeAt(0) - 65

                if (this.moveIsLegal(rank, col)) {
                    square.appendChild(piece)

                    // Update squares
                    const draggedFromRank = this.pieceDraggedFrom[0]
                    const draggedFromCol = this.pieceDraggedFrom[1]
                    const pieceDescriptor = this.squares[draggedFromRank][draggedFromCol]
                    this.squares[draggedFromRank][draggedFromCol] = ''
                    this.squares[rank][col] = pieceDescriptor
                }

                piece.style.webkitTransform = 'translate(0px, 0px)'
                piece.style.transform = 'translate(0px, 0px)'

                // update the posiion attributes
                piece.setAttribute('data-x', 0)
                piece.setAttribute('data-y', 0)

                square.classList.remove('piece-drag-over')
            },

            findLegalMoves(pieceType, pieceColor, rank, col) {
                // TODO check if can move, e.g. if there is a discovered check

                const legalMoves = []
                for (let x = 0; x < 8; ++x)
                    for (let y = 0; y < 8; ++y)
                        legalMoves.push([x, y])

                // Pawns
                if (pieceType === 'P') {
                    // If white
                    if (pieceColor === 'W') {
                        // Remove ranks behind pawn
                        legalMoves.removeIf(val => val[0] >= rank)

                        // Check if pawn is on starting rank
                        if (rank === 6)
                            legalMoves.removeIf(val => val[0] <= 3)
                        // Or allow only one move
                        else
                            legalMoves.removeIf(val => val[0] <= rank - 2)

                        // Remove more than one left and right
                        legalMoves.removeIf(val => val[1] <= col - 2 || val[1] >= col + 2)
                        // Remove two up left and right
                        legalMoves.removeIf(val => val[0] === rank - 2 && val[1] !== col)
                    } else { // If black
                        legalMoves.push('hey')
                    }
                }

                return legalMoves
            },
            moveIsLegal(rank, col) {
                let legal = false
                function callback(elmt) {
                    if (elmt[0] === rank && elmt[1] === col)
                        legal = true
                }
                this.legalMoves.forEach(callback)
                return legal
            },

            calculateSquare(rankIndex, squareIndex) {
                const number = (8 - rankIndex).toString()
                const letter = String.fromCharCode(65 + squareIndex)

                return `${letter}${number}`
            },
            getPieceImagePath(piece) {
                if (piece === '')
                    return ''

                const color = piece.substring(0, 1)
                const type = piece.substring(1, 2)

                let path = ''
                switch (type) {
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

                path += color === 'W' ? '_white' : '_black'
                path = `/static/images/pieces/${path}.png`

                return path
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
                height: 90px;
                line-height: 90px;
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
                width: 90px;
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
                height: 90px;

                div.square {
                    width: 90px;
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