<template>
    
    <div class="container">
        <div class="numbers">
            <div v-for="number in numbers" class="number" v-text="number"></div>
        </div>
        <div id="board">
            <div class="shadow" v-if="promoting"></div>
            <div class="squares">
                <div v-for="rank in squares" class="rank">
                    <div
                        v-for="square in rank"
                        :class="{
                            'square': true,
                            'highlight-legal': highlightLegalSquare(square),
                            'highlight-move': highlightMoveSquare(square),
                            'piece-drag-over': interact.overSquare === square
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
        <div class="corner">
            <div :class="turn ? 'black' : 'white'"></div>
        </div>
        <div class="letters">
            <div v-for="letter in letters" class="letter" v-text="letter"></div>
        </div>
        <div class="promoter" v-show="promoting">
            <div
                class="piece-img queen"
                @click="promoteTo('Q')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('Q', turn ? 'B': 'W') + ')' }"
                v-if="!promoterToRight"
            ></div>
            <div
                class="piece-img rook"
                @click="promoteTo('R')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('R', turn ? 'B': 'W') + ')' }"
            ></div>
            <div
                class="piece-img knight"
                @click="promoteTo('N')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('N', turn ? 'B': 'W') + ')' }"
            ></div>
            <div
                class="piece-img bishop"
                @click="promoteTo('B')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('B', turn ? 'B': 'W') + ')' }"
            ></div>
            <div
                class="piece-img queen"
                @click="promoteTo('Q')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('Q', turn ? 'B': 'W') + ')' }"
                v-if="promoterToRight"
            ></div>
        </div>
    </div>

</template>

<script>
    import Vue from 'vue'
    import { mapState, mapMutations } from 'vuex'
    import ChessPiece from '../assets/libs/chesspiece'

    // const interact = require('interactjs')
    const $ = require('jquery')
    
    export default {
        name: 'Board',

        data() {
            return {
                pieces: [],
                squares: [],
                numbers: ['8', '7', '6', '5', '4', '3', '2', '1'],
                letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

                currentPiece: null,
                turn: 0,
                check: false,
                enPassant: null,
                promoting: false,
                promotion: null,
                promoterToRight: true,
                castling: {
                    whiteKing: true,
                    whiteQueen: true,
                    blackKing: true,
                    blackQueen: true
                },
                halfMove: 0,
                fullMove: 1,

                interact: {
                    holdingPiece: null,
                    squareCoordinates: {},
                    overSquare: null
                },
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

            document.addEventListener('keydown', this.keyDown)

            Vue.nextTick(() => {
                this.initInteract()
            })
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

                this.updateConfigFEN(this.createFEN())
            },

            // ----------------------------------------
            // INTERACTION
            // ----------------------------------------
            initInteract() {
                $(document).on('mousedown', '.piece', this.pieceDragStart)
                $(document).on('mousemove', this.pieceDragMove)
                $(document).on('mouseup', '.piece', this.pieceDragEnd)
            },
            pieceDragStart(evt) {
                const pieceElement = $(evt.target)

                // Get mouse position within element
                const parentOffset = pieceElement.parent().offset();
                const relX = Math.round(evt.pageX - parentOffset.left);
                const relY = Math.round(evt.pageY - parentOffset.top);

                // Snap to middle
                const midX = -Math.round(pieceElement[0].offsetWidth / 2) + relX + 1
                const midY = -Math.round(pieceElement[0].offsetHeight / 2) + relY - 1
                pieceElement.css({
                    left: midX,
                    top: midY,
                    zIndex: 1000
                })
                this.interact.holdingPiece = pieceElement
                this.interact.holdingPieceStartX = midX
                this.interact.holdingPieceStartY = midY

                // Find all square coordinates
                const squares = $('.square')
                for (let s = 0; s < squares.length; ++s) {
                    const square = $(squares[s])
                    const squareDescriptor = square.attr('data-square')
                    const left = square.offset().left
                    const top = square.offset().top
                    const right = left + square[0].offsetWidth
                    const bottom = top + square[0].offsetHeight
                    this.interact.squareCoordinates[squareDescriptor] = {
                        left, top, right, bottom
                    }
                }

                // Update current piece and highlights
                const square = pieceElement.parent().attr('data-square')
                const piece = this.getPieceBySquare(square)

                this.currentPiece = piece

                if (this.boardConfig.highlight.legal)
                    this.highlightedSquares.legalMoves = piece.legalMoves
                if (this.boardConfig.highlight.move)
                    this.highlightedSquares.move.push(square)
            },
            pieceDragMove(evt) {
                if (this.interact.holdingPiece === null)
                    return

                const pieceElement = this.interact.holdingPiece

                // Update position
                const parentOffset = pieceElement.parent().offset();
                const midX = Math.round(pieceElement[0].offsetWidth / 2) + 1
                const midY = Math.round(pieceElement[0].offsetHeight / 2) - 1
                const deltaX = evt.pageX - parentOffset.left - midX
                const deltaY = evt.pageY - parentOffset.top - midY

                this.interact.holdingPiece.css({
                    left: deltaX,
                    top: deltaY
                })

                // Discover underlying square
                const square = this.$helpers.findObjectKey(this.interact.squareCoordinates, value => 
                    evt.pageX >= value.left && evt.pageX <= value.right &&
                    evt.pageY >= value.top && evt.pageY <= value.bottom
                )
                if (square !== this.interact.overSquare) {
                    this.interact.overSquare = square
                }
            },
            pieceDragEnd() {
                if (this.interact.holdingPiece === null)
                    return

                this.highlightedSquares.move = []

                const pieceElement = this.interact.holdingPiece

                // Snap piece to square if legal move and perform move
                const square = this.interact.overSquare
                const squareElement = this.squareElementByDescriptor(square)
                if (squareElement !== null && this.currentPiece.moveIsLegal(square))
                    if ((!this.check && this.currentPiece.type !== 'K') || !this.lookForCheckIf(this.currentPiece.square, square))
                        this.performMove(square)
                

                pieceElement.css({
                    left: 0,
                    top: 0,
                    zIndex: 100
                })

                this.interact.holdingPiece = null
                this.interact.overSquare = null

                // Update currentPiece and refresh legal moves
                this.currentPiece = null
                this.highlightedSquares.legalMoves = []
            },

            // ----------------------------------------
            // MOVES
            // ----------------------------------------
            performMove(square, piece) {
                if (typeof piece === 'undefined')
                    piece = this.currentPiece

                if (piece.color !== ['W', 'B'][this.turn])
                    return

                if (piece.square === square)
                    return

                // Check if there is a capture
                if (this.squareIsOccupied(square, piece.opponent)) {
                    this.capturePiece(this.getPieceBySquare(square))
                    this.halfMove = -1
                } else if (square === this.enPassant && piece.type === 'P') {
                    const epSquare = this.enPassant.substring(0, 1) + (parseInt(this.enPassant.substring(1, 2), 10) + (piece.color === 'W' ? -1 : 1))
                    this.capturePiece(this.getPieceBySquare(epSquare))
                    this.halfMove = -1
                }

                const prevSquare = piece.square
                piece.square = square

                // Check for castling
                if (piece.type === 'K') {
                    const rank = square.substring(1, 2)
                    const isCastling = rank === prevSquare.substring(1, 2) && // Same rank
                          Math.abs(square.charCodeAt(0) - prevSquare.charCodeAt(0)) === 2 // Moves two squares
                    if (isCastling) {
                        const direction = square.charCodeAt(0) > prevSquare.charCodeAt(0) // true = kingside
                        const rookCol = direction ? 'H' : 'A'
                        const rook = this.getPieceBySquare(`${rookCol}${rank}`)
                        rook.square = direction ? `F${rank}` : `D${rank}`
                    }
                }

                if (piece.type === 'K') {
                    if (piece.color === 'W') {
                        this.castling.whiteKing = false
                        this.castling.whiteQueen = false
                    } else {
                        this.castling.blackKing = false
                        this.castling.blackQueen = false
                    }
                } else if (piece.type === 'R') {
                    if (piece.color === 'W')
                        if (piece.side === 'K')
                            this.castling.whiteKing = false
                        else
                            this.castling.whiteQueen = false
                    else
                        if (piece.side === 'K')
                            this.castling.blackKing = false
                        else
                            this.castling.blackQueen = false
                }

                // Check for en passant
                if (piece.type === 'P' && Math.abs(square.charCodeAt(1) - prevSquare.charCodeAt(1)) > 1)
                    this.enPassant = String.fromCharCode(square.charCodeAt(0)) + (parseInt(square.substring(1, 2), 10) + (piece.color === 'W' ? -1 : 1))
                else
                    this.enPassant = null

                const finishTurn = function (self) {
                    // Increase halfMove and fullMove
                    self.halfMove = piece.type === 'P' ? 0 : self.halfMove + 1
                    self.fullMove += self.turn

                    // Update turn
                    self.turn = self.turn === 0 ? 1 : 0

                    self.check = false

                    if (self.boardConfig.highlight.move)
                        self.highlightedSquares.move = [prevSquare, square]
                    
                    // Update FEN and find new legal moves
                    self.updateConfigFEN(self.createFEN())
                    self.findAllLegalMoves()
                }

                // Check for promotion
                if (piece.type === 'P' && piece.square.substring(1, 2) === (piece.color === 'W' ? '8' : '1')) {
                    this.promote(piece, square)
                    const unwatch = this.$watch('promoting', function (value) {
                        if (!value)
                            finishTurn(this)
                        unwatch()
                    })
                } else {
                    finishTurn(this)
                }
            },
            capturePiece(piece) {
                piece.capture()
            },
            promote(piece, square) {
                const squareElement = this.squareElementByDescriptor(square)

                if (squareElement === null)
                    return

                this.promoting = true

                // Set promoter style
                const col = Math.abs(square.charCodeAt(0) - (this.boardConfig.flipped ? 73 : 64))
                const toRight = col > 5
                let left = squareElement.offset().left
                if (toRight)
                    left -= 3 * squareElement[0].offsetWidth
                this.promoterToRight = toRight
                $('.promoter').css({
                    left,
                    top: squareElement.offset().top,
                    width: squareElement[0].offsetWidth * 4,
                    height: squareElement[0].offsetHeight
                })

                const unwatch = this.$watch('promotion', function (value) {
                    if (value) {
                        piece.type = value
                        this.promotion = null
                    }
                    unwatch()
                })
            },
            promoteTo(type) {
                this.promotion = type
                this.promoting = false
            },
            findAllLegalMoves(nocheck) {
                if (typeof nocheck === 'undefined')
                    nocheck = false

                for (let i = 0; i < this.pieces.length; ++i)
                    if (!this.pieces[i].is_captured)
                        this.pieces[i].legalMoves = this.findLegalMovesForPiece(this.pieces[i])

                if (!nocheck)
                    this.check = this.lookForCheck()
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
                            if (this.squareIsOccupied(sfn(col - 1, rank + 1), 'B') || sfn(col - 1, rank + 1) === this.enPassant)
                                legalMoves.push(sfn(col - 1, rank + 1))
                        if (col < 8)
                            if (this.squareIsOccupied(sfn(col + 1, rank + 1), 'B') || sfn(col + 1, rank + 1) === this.enPassant)
                                legalMoves.push(sfn(col + 1, rank + 1))
                    } else {
                        if (col > 1)
                            if (this.squareIsOccupied(sfn(col - 1, rank - 1), 'W') || sfn(col - 1, rank - 1) === this.enPassant)
                                legalMoves.push(sfn(col - 1, rank - 1))
                        if (col < 8)
                            if (this.squareIsOccupied(sfn(col + 1, rank - 1), 'W') || sfn(col + 1, rank - 1) === this.enPassant)
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

                    // Castling
                    if (piece.color === 'W') {
                        if (this.castling.whiteKing &&
                            !this.squareIsOccupied('F1') &&
                            !this.squareIsOccupied('G1') &&
                            !this.squareIsAttacked('F1', piece.opponent) &&
                            !this.squareIsAttacked('G1', piece.opponent))
                            legalMoves.push('G1')
                        if (this.castling.whiteQueen &&
                            !this.squareIsOccupied('C1') &&
                            !this.squareIsOccupied('D1') &&
                            !this.squareIsAttacked('C1', piece.opponent) &&
                            !this.squareIsAttacked('D1', piece.opponent))
                            legalMoves.push('C1')
                    } else {
                        if (this.castling.blackKing &&
                            !this.squareIsOccupied('F8') &&
                            !this.squareIsOccupied('G8') &&
                            !this.squareIsAttacked('F8', piece.opponent) &&
                            !this.squareIsAttacked('G8', piece.opponent))
                            legalMoves.push('G8')
                        if (this.castling.blackQueen &&
                            !this.squareIsOccupied('C8') &&
                            !this.squareIsOccupied('D8') &&
                            !this.squareIsAttacked('C8', piece.opponent) &&
                            !this.squareIsAttacked('D8', piece.opponent))
                            legalMoves.push('C8')
                    }

                    legalMoves.removeIf(sqr => this.squareIsOccupied(sqr, piece.color))
                }

                return legalMoves
            },
            lookForCheck() {
                // Check to see if king square is attacked
                const whiteKing = this.pieces.find(piece => piece.color === 'W' && piece.type === 'K')
                const blackKing = this.pieces.find(piece => piece.color === 'B' && piece.type === 'K')

                if (typeof whiteKing === 'undefined' || typeof blackKing === 'undefined')
                    // TODO invalid game
                    return false

                return this.squareIsAttacked(whiteKing.square, 'B') || this.squareIsAttacked(blackKing.square, 'W')
            },
            lookForCheckIf(fromSquare, toSquare) {
                const piece = this.getPieceBySquare(fromSquare)

                if (typeof piece === 'undefined')
                    // TODO error
                    return false

                const pieceOnTarget = this.getPieceBySquare(toSquare)
                if (typeof pieceOnTarget !== 'undefined')
                    pieceOnTarget.is_captured = true

                piece.square = toSquare
                this.findAllLegalMoves(true)
                const check = this.lookForCheck()

                // Reset
                if (typeof pieceOnTarget !== 'undefined')
                    pieceOnTarget.is_captured = false
                piece.square = fromSquare
                this.findAllLegalMoves(false)
                return check
            },
            squareIsOccupied(square, color) {
                const piece = this.getPieceBySquare(square)
                if (color)
                    return typeof piece !== 'undefined' && piece.color === color
                return typeof piece !== 'undefined'
            },
            squareIsAttacked(square, color) {
                for (let i = 0; i < this.pieces.length; i++) {
                    const piece = this.pieces[i]
                    if (piece.is_captured)
                        continue
                    if (piece.color === color) {
                        if (piece.type !== 'P' && piece.legalMoves.includes(square))
                            return true
                        else {
                            const pawnCol = piece.square.charCodeAt(0)
                            const pawnLeft = String.fromCharCode(pawnCol - 1)
                            const pawnRight = String.fromCharCode(pawnCol + 1)
                            const pawnRank = parseInt(piece.square.substring(1, 2), 10)
                            const attackRank = pawnRank + (piece.color === 'W' ? 1 : -1)
                            const pawnThreat = [
                                `${pawnLeft}${attackRank}`,
                                `${pawnRight}${attackRank}`
                            ]
                            if (pawnThreat.includes(square))
                                return true
                        }
                    }
                }
                return false
            },

            // ----------------------------------------
            // FIND SQUARES AND PIECES
            // ----------------------------------------

            squareElementByDescriptor(desc) {
                const square = $(`.square[data-square="${desc}"]`)
                return square.length ? square : null
            },
            getPieceBySquare(square) {
                return this.pieces.find(piece => piece.square === square)
            },

            // ----------------------------------------
            // BOARD VISUALS
            // ----------------------------------------
            getPieceImagePath(square) {
                const piece = this.getPieceBySquare(square)
                if (!piece)
                    return ''

                let path = piece.color.toLowerCase() + piece.type.toLowerCase()
                path = `/static/images/pieces/${this.boardConfig.pieceSet}/${path}.svg`

                return path
            },
            getPieceImagePathByType(type, color) {
                let path = color.toLowerCase() + type.toLowerCase()
                path = `/static/images/pieces/${this.boardConfig.pieceSet}/${path}.svg`
                return path
            },
            highlightLegalSquare(square) {
                return this.highlightedSquares.legalMoves.includes(square)
            },
            highlightMoveSquare(square) {
                return this.highlightedSquares.move.includes(square)
            },


            // ----------------------------------------
            // CONFIGURATION
            // ----------------------------------------
            createFEN() {
                let fen = ''

                // Iterate over ranks, descending
                for (let r = 8; r >= 1; --r) {
                    let rankStr = ''
                    let empty = 0
                    // Iterate over cols, from A
                    for (let c = 65; c <= 72; ++c) {
                        const letter = String.fromCharCode(c)
                        const piece = this.getPieceBySquare(`${letter}${r}`)
                        if (typeof piece === 'undefined')
                            ++empty
                        else {
                            if (empty) {
                                rankStr += empty
                                empty = 0
                            }
                            rankStr += piece.color === 'B' ? piece.type.toLowerCase() : piece.type.toUpperCase()
                        }
                    }
                    fen += (rankStr || '8')
                    fen += empty > 0 && empty < 8 ? empty : ''
                    fen += r === 1 ? '' : '/'
                }

                // Turn
                const color = this.turn === 0 ? 'w' : 'b'
                fen += ` ${color} `

                // Castling
                fen += this.castling.whiteKing ? 'K' : ''
                fen += this.castling.whiteQueen ? 'Q' : ''
                fen += this.castling.blackKing ? 'k' : ''
                fen += this.castling.blackQueen ? 'q' : ''

                // En passant
                fen += this.enPassant === null ? ' - ' : ` ${this.enPassant.toLowerCase()} `

                // Half move and full move
                fen += `${this.halfMove} ${this.fullMove}`

                return fen
            },

            // ----------------------------------------
            // OTHER
            // ----------------------------------------
            keyDown(evt) {
                switch (evt.key.toLowerCase()) {
                case 't':
                    this.createFEN()
                    break;
                default:
                    break;
                }
            },

            ...mapMutations([
                'updateConfigFEN'
            ])
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
            user-select: none;

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
            position: relative;
            width: 5%;
            height: 5%;
            background-color: #723904;

            div {
                width: 60%;
                height: 60%;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                box-shadow: inset 0 0 2px #333;

                &.white { background-color: white; }
                &.black { background-color: black; }
            }
        }
        div.letters {
            display: inline-block;
            width: 95%;
            height: 5%;
            background-color: #723904;
            user-select: none;

            div.letter {
                float: left;
                width: 12.5%;
                height: 100%;
                font-size: 1.5rem;
                text-align: center;
            }
        }
        div.promoter {
            position: absolute;
            box-sizing: border-box;
            padding: 4px;
            background-color: #ad7129;
            background: repeating-linear-gradient(
                135deg,
                #ad7129,
                #ad7129 4px,
                #bf7f33 4px,
                #bf7f33 8px
            );
            border-radius: 4px;
            z-index: 1100 !important;
            box-shadow: 0 0 12px #111, inset 0 0 2px #333;

            div.piece-img {
                display: inline-block;
                width: 25%;
                height: 100%;
                padding: 12px;
                box-sizing: border-box;
                background-size: cover;
                border-radius: 4px;

                &:hover {
                    background-color: rgba(91, 52, 8, 0.55);
                }
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
            div.shadow {
                position: absolute;
                width: 100%;
                height: 100%;
                left: calc(5% + 2px);
                background-color: rgba(0, 0, 0, 0.6);
                z-index: 500;
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