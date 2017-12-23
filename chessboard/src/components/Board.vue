<template>
    
    <div class="container">
        <div class="checkmate modal" v-if="displayCheckmate">
            <h2 v-text="winner + ' wins!'"></h2>
            <div class="buttons">
                <div class="analyse" @click="analyse">
                    <icon name="search"></icon>
                    <span>Analyse</span>
                </div>
                <div class="reset" @click="reset">
                    <icon name="rotate-left"></icon>
                    <span>Reset</span>
                </div>
            </div>
        </div>
        <div class="load-pgn modal" v-if="loadPGN">
            <h2>Load PGN</h2>
            <textarea v-model="editablePGN"></textarea>
            <div class="buttons">
                <button type="button" @click="submittedPGN = ''">Cancel</button>
                <button type="button" @click="submittedPGN = editablePGN">Submit</button>
            </div>
        </div>
        <div class="side numbers">
            <div v-for="number in numbers" class="number" v-text="number"></div>
        </div>
        <div id="board" oncontextmenu="return false">
            <div
                v-for="arrow in highlightedSquares.arrows"
                class="arrow"
                :style="{
                    'left': arrow.left + 'px',
                    'top': arrow.top + 'px',
                    'width': arrow.length + 'px',
                    'transform': 'rotate(' + arrow.angle + 'deg)'
                }"
            ></div>
            <div class="shadow" v-if="promoting"></div>
            <div class="squares">
                <div v-for="rank in squares" class="rank">
                    <div
                        v-for="square in rank"
                        :class="{
                            'square': true,
                            'highlight-legal': highlightLegalSquare(square),
                            'highlight-move': highlightMoveSquare(square),
                            'highlight-marked': highlightMarkedSquare(square),
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
        <div class="side corner"></div>
        <div class="side letters">
            <div v-for="letter in letters" class="letter" v-text="letter"></div>
        </div>
        <div class="promoter" v-show="promoting">
            <div
                class="piece-img queen"
                @click="promoteTo('Q')"
                :style="{ backgroundImage: 'url(' + getPieceImagePathByType('Q', turn ? 'B': 'W') + ')' }"
                v-if="promoterOnTop"
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
                v-if="!promoterOnTop"
            ></div>
        </div>
    </div>

</template>

<script>
    import 'vue-awesome/icons/rotate-left'
    import 'vue-awesome/icons/search'
    import Vue from 'vue'
    import { mapState, mapMutations } from 'vuex'
    import ChessPiece from '../assets/classes/chesspiece'

    const $ = require('jquery')
    
    export default {
        name: 'Board',

        data() {
            return {
                loadPGN: false,
                loadFEN: false,
                submittedPGN: null,
                submittedFEN: null,
                editablePGN: '',
                displayCheckmate: false,

                pieces: [],
                squares: [],
                numbers: ['8', '7', '6', '5', '4', '3', '2', '1'],
                letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],

                gameStarted: false,
                currentPiece: null,
                turn: 0,
                check: false,
                checkmate: false,
                checkingPieces: [],
                enPassant: null,
                promoting: false,
                promotion: null,
                promoterOnTop: true,
                castling: {
                    whiteKing: true,
                    whiteQueen: true,
                    blackKing: true,
                    blackQueen: true
                },
                halfMove: 0,
                fullMove: 1,

                currentMoveStart: 0,

                interact: {
                    holdingPiece: null,
                    squareCoordinates: {},
                    overSquare: null,
                    arrowDragging: false,
                    currentArrowStartSquare: null,
                    currentArrowEndSquare: null
                },
                highlightedSquares: {
                    legalMoves: [],
                    move: [],
                    marked: [],
                    arrows: []
                },
                sounds: {
                    move: null,
                    capture: null,
                    castling: null,
                    check: null
                }
            }
        },

        computed: {
            winner() {
                return this.turn === 0 ? this.black : this.white
            },

            ...mapState({
                white: state => state.game.playerWhite,
                black: state => state.game.playerBlack,
                boardConfig: state => state.game.board,
                halfmoves: state => state.game.halfmoves,
                pieceSet: state => state.theme.pieceSet
            })
        },

        mounted() {
            this.generateSquares()
            this.generatePieces()
            this.findAllLegalMoves()

            this.loadSounds()

            $(document).on('keydown', this.keyDown)

            this.$bus.$on('step', this.moveStep)
            this.$bus.$on('goto', this.moveTo)
            this.$bus.$on('reset', this.reset)
            this.$bus.$on('load', this.load)

            Vue.nextTick(() => {
                this.initInteract()
            })

            this.startNewGame()
        },
        methods: {

            // ----------------------------------------
            // SETUP
            // ----------------------------------------
            reset() {
                // Reset state
                this.pieces = []
                this.squares = []
                this.gameStarted = false
                this.currentPiece = null
                this.turn = 0
                this.check = false
                this.checkmate = false
                this.displayCheckmate = false
                this.checkingPieces = []
                this.enPassant = null
                this.promoting = false
                this.promotion = null
                this.promoterOnTop = true
                this.castling = {
                    whiteKing: true,
                    whiteQueen: true,
                    blackKing: true,
                    blackQueen: true
                }
                this.halfMove = 0
                this.fullMove = 1
                this.currentMoveStart = 0
                this.highlightedSquares = {
                    legalMoves: [],
                    move: [],
                    marked: []
                }

                // Setup board
                this.generateSquares()
                this.generatePieces()
                this.findAllLegalMoves()

                // Store reset
                this.resetGame()
            },
            load(options) {
                if (options.type === 'pgn') {
                    const pgn = options.value
                    const extracted = this.$helpers.extractPGN(pgn)
                    console.log(extracted)
                }
            },
            analyse() {
                this.displayCheckmate = false
            },
            generateSquares() {
                for (let y = 8; y > 0; --y) {
                    this.squares.push([])
                    for (let x = 97; x < 105; ++x)
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
                        const letter = String.fromCharCode(97 + i)
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
                        const letter = String.fromCharCode(97 + i)
                        const square = n === 0 ? `${letter}2` : `${letter}7`

                        const piece = new ChessPiece(type, color, side, square)
                        this.pieces.push(piece)
                    }

                this.updateConfigFEN(this.createFEN())
            },
            startNewGame(reset) {
                if (reset)
                    this.reset()

                this.currentMoveStart = new Date().getTime()
                this.gameStarted = true
            },

            // ----------------------------------------
            // INTERACTION
            // ----------------------------------------
            initInteract() {
                $(document).on('mousedown', '.piece', this.pieceDragStart)
                $(document).on('mousemove', this.pieceDragMove)
                $(document).on('mouseup', '.piece', this.pieceDragEnd)

                $(document).on('mousedown', '.square', this.squareMouseDown)
                $(document).on('mousemove', '.square', this.squareMouseMove)
                $(document).on('mouseup', '.square', this.squareMouseEnd)
            },
            pieceDragStart(evt) {
                if (evt.button !== 0)
                    return

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
                this.findSquareCoordinates()

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
                const squareElement = this.getSquareElementByDescriptor(square)
                if (squareElement !== null && this.currentPiece.moveIsLegal(square))
                    if (!this.lookForCheckIf(this.currentPiece.square, square))
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
            squareMouseDown(evt) {
                if (evt.button !== 2)
                    return

                this.interact.arrowDragging = true

                const squareDescriptor = $(evt.currentTarget).attr('data-square')
                if (this.highlightedSquares.marked.includes(squareDescriptor))
                    this.highlightedSquares.marked.remove(squareDescriptor)
                else
                    this.highlightedSquares.marked.push(squareDescriptor)

                this.interact.currentArrowStartSquare = squareDescriptor
                this.interact.currentArrowEndSquare = squareDescriptor
                this.findSquareCoordinates()
            },
            squareMouseMove(evt) {
                if (!this.interact.arrowDragging)
                    return

                // Discover underlying square
                const square = this.$helpers.findObjectKey(this.interact.squareCoordinates, value => 
                    evt.pageX >= value.left && evt.pageX <= value.right &&
                    evt.pageY >= value.top && evt.pageY <= value.bottom
                )
                if (square !== this.interact.overSquare) {
                    this.interact.overSquare = square
                    this.interact.currentArrowEndSquare = square
                }
            },
            squareMouseEnd() {
                if (!this.interact.arrowDragging)
                    return

                this.interact.overSquare = null
                this.interact.arrowDragging = false

                const source = this.interact.currentArrowStartSquare
                const target = this.interact.currentArrowEndSquare
                if (this.highlightedSquares.arrows.findIndex(arrow => arrow.source === source && arrow.target === target) < 0)
                    this.addArrow(source, target)
                else
                    this.removeArrow(source, target)
            },
            findSquareCoordinates() {
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
            },
            addArrow(source, target) {
                if (source === target)
                    return

                const boardElement = $('div#board')
                const sourceSquareElement = this.getSquareElementByDescriptor(source)
                const targetSquareElement = this.getSquareElementByDescriptor(target)

                // Get coordinates
                const offsetLeft = Math.round(boardElement.offset().left)
                const offsetTop = Math.round(boardElement.offset().top)
                const fromX = Math.round(sourceSquareElement.offset().left + (sourceSquareElement[0].offsetWidth / 2) - offsetLeft * 2)
                const fromY = Math.round(sourceSquareElement.offset().top + (sourceSquareElement[0].offsetHeight / 2) - offsetTop)
                const toX = Math.round(targetSquareElement.offset().left + (targetSquareElement[0].offsetWidth / 2) - offsetLeft * 2)
                const toY = Math.round(targetSquareElement.offset().top + (targetSquareElement[0].offsetHeight / 2) - offsetTop)
                // Angle and length
                const deltaX = toX - fromX
                const deltaY = toY - fromY
                const length = Math.hypot(deltaX, deltaY)
                const theta = Math.atan2(deltaY, deltaX)
                const angle = theta * (180 / Math.PI)

                // Insert arrow
                // These values are depentant on css values. Maybe I can fix that.
                this.highlightedSquares.arrows.push({
                    source,
                    target,
                    left: fromX + offsetLeft,
                    top: fromY - 8,
                    length: length - 28,
                    angle
                })
            },
            removeArrow(source, target) {
                this.highlightedSquares.arrows.removeIf(arrow => arrow.source === source && arrow.target === target)
            },
            clearArrowsAndMarked() {
                this.highlightedSquares.arrows = []
                this.highlightedSquares.marked = []
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

                let captured = null
                let castling = 0

                // Check if there is a capture
                if (this.squareIsOccupied(square, piece.opponent)) {
                    captured = this.getPieceBySquare(square)
                    this.capturePiece(captured)
                    this.halfMove = -1
                } else if (square === this.enPassant && piece.type === 'P') {
                    const epSquare = this.enPassant.getFile() + (this.enPassant.getRankNum() + (piece.color === 'W' ? -1 : 1))
                    captured = this.getPieceBySquare(epSquare)
                    this.capturePiece(captured)
                    this.halfMove = -1
                }

                const prevSquare = piece.square
                piece.square = square

                // Check for castling
                if (piece.type === 'K') {
                    const rank = square.getRank()
                    const isCastling = rank === prevSquare.getRank() && // Same rank
                          Math.abs(square.getFileNum() - prevSquare.getFileNum()) === 2 // Moves two squares
                    if (isCastling) {
                        const direction = square.getFileNum() > prevSquare.getFileNum() // true = kingside
                        const rookFile = direction ? 'h' : 'a'
                        const rook = this.getPieceBySquare(`${rookFile}${rank}`)
                        rook.square = direction ? `f${rank}` : `d${rank}`
                        castling = direction ? 1 : 2
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
                    this.enPassant = String.fromCharCode(square.charCodeAt(0)) + (square.getRankNum() + (piece.color === 'W' ? -1 : 1))
                else
                    this.enPassant = null

                // Check for disambiguous moves for pgn
                let pgnFile = null
                let pgnRank = null
                if (piece.type !== 'P' && piece.type !== 'K') {
                    // Get pieces of same color and type as self
                    const sameButDifferent = this.pieces.filter(el =>
                        el.color === piece.color &&
                        el.type === piece.type &&
                        el.square !== piece.square
                    )

                    if (sameButDifferent.length === 1) {
                        // If there are one other piece
                        const other = sameButDifferent[0]
                        // If they can move to same square
                        if (piece.legalMoves.filter(m => other.legalMoves.includes(m)).length > 0) {
                            // Check if rank is equal, and if so, use file
                            if (prevSquare.getRank() === other.square.getRank())
                                pgnFile = prevSquare.getFile()
                            // Otherwise, use rank
                            else if (prevSquare.getFile() === other.square.getFile())
                                pgnRank = prevSquare.getRank()
                        }
                    } else if (sameButDifferent.length > 1) {
                        // If there are more than one other piece focused on same square (promoted), get them into array
                        const sameSquare = []
                        for (let i = 0; i < sameButDifferent.length; i++) {
                            const other = sameButDifferent[i]
                            if (other.legalMoves.includes(piece.square))
                                sameSquare.push(other)
                        }
                        // If one other
                        if (sameSquare.length === 1) {
                            const other = sameSquare[0]
                            // If they can move to same square
                            if (piece.legalMoves.filter(m => other.legalMoves.includes(m)).length > 0) {
                                if (prevSquare.getRank() === other.square.getRank())
                                    pgnFile = prevSquare.getFile()
                                else if (prevSquare.getFile() === other.square.getFile())
                                    pgnRank = prevSquare.getRank()
                            }
                        } else if (sameSquare.length > 1) {
                            // If more than one other, check how many are on the same rank
                            const selfRank = prevSquare.getRank()
                            const selfFile = prevSquare.getFile()
                            const sameRank = sameSquare.filter(p => p.square.getRank() === selfRank)
                            const sameFile = sameSquare.filter(p => p.square.getFile() === selfFile)
                            // If none on same rank, use that
                            if (sameFile.len === 0)
                                pgnFile = selfFile
                            // Elsewise, if none on same file, use that
                            else if (sameRank.len === 0)
                                pgnRank = selfRank
                            // Otherwise, use both
                            else {
                                pgnFile = selfFile
                                pgnRank = selfRank
                            }
                        }
                    }
                }

                // Check for promotion
                if (piece.type === 'P' && piece.square.getRank() === (piece.color === 'W' ? '8' : '1')) {
                    this.promote(piece, square)
                    const unwatch = this.$watch('promoting', function (value) {
                        if (!value) {
                            const promotedTo = this.promotion
                            this.promotion = null
                            this.finishTurn(piece, square, prevSquare, captured, castling, promotedTo, pgnFile, pgnRank)
                        }
                        unwatch()
                    })
                } else {
                    this.finishTurn(piece, square, prevSquare, captured, castling, null, pgnFile, pgnRank)
                }
            },
            capturePiece(piece) {
                this.addCapturedPiece(piece)
                piece.capture()
            },
            promote(piece, square) {
                const squareElement = this.getSquareElementByDescriptor(square)

                if (squareElement === null)
                    return

                this.promoting = true

                // Set promoter style
                const rank = square.getRankNum()
                const down = rank === 8 // TODO invert
                let top = squareElement[0].offsetTop
                if (!down)
                    top -= 3 * squareElement[0].offsetHeight
                this.promoterOnTop = down
                $('.promoter').css({
                    left: squareElement[0].offsetLeft + $('.side.numbers')[0].offsetWidth, // TODO side numbers?
                    top,
                    width: squareElement[0].offsetWidth,
                    height: squareElement[0].offsetHeight * 4
                })

                const unwatch = this.$watch('promotion', function (value) {
                    if (value)
                        piece.type = value
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

                if (!nocheck) {
                    const onColor = this.turn ? 'B' : 'W'
                    const check = this.lookForCheck(true, onColor)
                    this.check = check.length > 0
                    this.checkingPieces = check
                }
            },
            findLegalMovesForPiece(piece) {
                // TODO check if can move, e.g. if there is a discovered check

                // Function to get letter from file number
                const lfc = file => String.fromCharCode(96 + file)
                // Function to get square from numbers
                const sfn = (file, rank) => `${lfc(file)}${rank}`
                // Function to get numbers from square
                const stn = sqr => [sqr.charCodeAt(0) - 96, sqr.getRankNum()]

                let legalMoves = []

                const letter = piece.square.getFile()
                const file = piece.square.getFileNum()
                const rank = piece.square.getRankNum()

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
                        if (file > 1)
                            if (this.squareIsOccupied(sfn(file - 1, rank + 1), 'B') || sfn(file - 1, rank + 1) === this.enPassant)
                                legalMoves.push(sfn(file - 1, rank + 1))
                        if (file < 8)
                            if (this.squareIsOccupied(sfn(file + 1, rank + 1), 'B') || sfn(file + 1, rank + 1) === this.enPassant)
                                legalMoves.push(sfn(file + 1, rank + 1))
                    } else {
                        if (file > 1)
                            if (this.squareIsOccupied(sfn(file - 1, rank - 1), 'W') || sfn(file - 1, rank - 1) === this.enPassant)
                                legalMoves.push(sfn(file - 1, rank - 1))
                        if (file < 8)
                            if (this.squareIsOccupied(sfn(file + 1, rank - 1), 'W') || sfn(file + 1, rank - 1) === this.enPassant)
                                legalMoves.push(sfn(file + 1, rank - 1))
                    }
                } else if (piece.type === 'R') {
                    // Legal ranks
                    for (let i = 1; i <= 8; ++i) {
                        if (i === rank)
                            continue
                        legalMoves.push(`${letter}${i}`)
                    }
                    // Legal files
                    for (let i = 1; i <= 8; ++i) {
                        if (i === file)
                            continue
                        const ltr = lfc(i)
                        legalMoves.push(`${ltr}${rank}`)
                    }

                    // Check blockage
                    // File first
                    let sameFile = legalMoves.filter(move => stn(move)[0] === file)
                    const sameFileAbove = sameFile.filter(move => stn(move)[1] > rank).sort(move => stn(move)[1] < rank)
                    const sameFileBelow = sameFile.filter(move => stn(move)[1] < rank).sort(move => stn(move)[1] < rank)

                    for (let r = 0; r < sameFileAbove.length; ++r) {
                        if (this.squareIsOccupied(sameFileAbove[r])) {
                            const own = this.squareIsOccupied(sameFileAbove[r], piece.color)
                            sameFileAbove.splice(own ? r : r + 1)
                            break
                        }
                    }
                    for (let r = 0; r < sameFileBelow.length; ++r) {
                        if (this.squareIsOccupied(sameFileBelow[r])) {
                            const own = this.squareIsOccupied(sameFileBelow[r], piece.color)
                            sameFileBelow.splice(own ? r : r + 1)
                            break
                        }
                    }
                    sameFile = sameFileAbove.concat(sameFileBelow)

                    // Then rank
                    let sameRank = legalMoves.filter(move => stn(move)[1] === rank)
                    const sameRankLeft = sameRank.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] < file)
                    const sameRankRight = sameRank.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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

                    legalMoves = sameFile.concat(sameRank)
                } else if (piece.type === 'N') {
                    // Move two in direction
                    const left = file - 2
                    const up = rank + 2
                    const right = file + 2
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
                        const ul = file - 1
                        const ur = file + 1
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
                        const dl = file - 1
                        const dr = file + 1
                        if (dl >= 1)
                            legalMoves.push(`${lfc(dl)}${down}`)
                        if (dr <= 8)
                            legalMoves.push(`${lfc(dr)}${down}`)
                    }

                    legalMoves.removeIf(sqr => this.squareIsOccupied(sqr, piece.color))
                } else if (piece.type === 'B') {
                    // Moving left and up
                    for (let c = file - 1; c >= 1; --c) {
                        const r = rank + (file - c)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and up
                    for (let c = file + 1; c <= 8; ++c) {
                        const r = rank + (c - file)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving left and down
                    for (let c = file - 1; c >= 1; --c) {
                        const r = rank - (file - c)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and down
                    for (let c = file + 1; c <= 8; ++c) {
                        const r = rank - (c - file)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }

                    // Check blockage
                    // Top first
                    let north = legalMoves.filter(move => stn(move)[1] > rank)
                    const northWest = north.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] > file)
                    const northEast = north.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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
                    const southWest = south.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] > file)
                    const southEast = south.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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
                    // Legal files
                    for (let i = 1; i <= 8; ++i) {
                        if (i === file)
                            continue
                        const ltr = lfc(i)
                        legalMoves.push(`${ltr}${rank}`)
                    }
                    // Moving left and up
                    for (let c = file - 1; c >= 1; --c) {
                        const r = rank + (file - c)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and up
                    for (let c = file + 1; c <= 8; ++c) {
                        const r = rank + (c - file)
                        if (r > 8)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving left and down
                    for (let c = file - 1; c >= 1; --c) {
                        const r = rank - (file - c)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }
                    // Moving right and down
                    for (let c = file + 1; c <= 8; ++c) {
                        const r = rank - (c - file)
                        if (r < 1)
                            break
                        legalMoves.push(`${lfc(c)}${r}`)
                    }

                    // Check blockage
                    let straight = null
                    let diagonal = null

                    // Straight first
                    // File first
                    let sameFile = legalMoves.filter(move => stn(move)[0] === file)
                    const sameFileAbove = sameFile.filter(move => stn(move)[1] > rank).sort(move => stn(move)[1] < rank)
                    const sameFileBelow = sameFile.filter(move => stn(move)[1] < rank).sort(move => stn(move)[1] < rank)

                    for (let r = 0; r < sameFileAbove.length; ++r) {
                        if (this.squareIsOccupied(sameFileAbove[r])) {
                            const own = this.squareIsOccupied(sameFileAbove[r], piece.color)
                            sameFileAbove.splice(own ? r : r + 1)
                            break
                        }
                    }
                    for (let r = 0; r < sameFileBelow.length; ++r) {
                        if (this.squareIsOccupied(sameFileBelow[r])) {
                            const own = this.squareIsOccupied(sameFileBelow[r], piece.color)
                            sameFileBelow.splice(own ? r : r + 1)
                            break
                        }
                    }
                    sameFile = sameFileAbove.concat(sameFileBelow)

                    // Then rank
                    let sameRank = legalMoves.filter(move => stn(move)[1] === rank)
                    const sameRankLeft = sameRank.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] < file)
                    const sameRankRight = sameRank.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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

                    straight = sameFile.concat(sameRank)

                    // Then diagonals
                    // Top first
                    let north = legalMoves.filter(move => stn(move)[1] > rank)
                    const northWest = north.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] > file)
                    const northEast = north.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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
                    const southWest = south.filter(move => stn(move)[0] < file).sort(move => stn(move)[0] > file)
                    const southEast = south.filter(move => stn(move)[0] > file).sort(move => stn(move)[0] < file)

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
                            if (c === file - 1 && (r === rank - 1 || r === rank + 1 || r === rank))
                                legalMoves.push(`${lfc(c)}${r}`)
                            else if (c === file && (r === rank - 1 || r === rank + 1))
                                legalMoves.push(`${lfc(c)}${r}`)
                            else if (c === file + 1 && (r === rank - 1 || r === rank + 1 || r === rank))
                                legalMoves.push(`${lfc(c)}${r}`)
                        }

                    // Castling
                    if (!this.check) {
                        if (piece.color === 'W') {
                            if (this.castling.whiteKing &&
                                !this.squareIsOccupied('f1') &&
                                !this.squareIsOccupied('g1') &&
                                !this.squareIsAttacked('f1', piece.opponent) &&
                                !this.squareIsAttacked('g1', piece.opponent))
                                legalMoves.push('g1')
                            if (this.castling.whiteQueen &&
                                !this.squareIsOccupied('c1') &&
                                !this.squareIsOccupied('d1') &&
                                !this.squareIsAttacked('c1', piece.opponent) &&
                                !this.squareIsAttacked('d1', piece.opponent))
                                legalMoves.push('c1')
                        } else {
                            if (this.castling.blackKing &&
                                !this.squareIsOccupied('f8') &&
                                !this.squareIsOccupied('g8') &&
                                !this.squareIsAttacked('f8', piece.opponent) &&
                                !this.squareIsAttacked('g8', piece.opponent))
                                legalMoves.push('g8')
                            if (this.castling.blackQueen &&
                                !this.squareIsOccupied('c8') &&
                                !this.squareIsOccupied('d8') &&
                                !this.squareIsAttacked('c8', piece.opponent) &&
                                !this.squareIsAttacked('d8', piece.opponent))
                                legalMoves.push('c8')
                        }
                    }

                    legalMoves.removeIf(sqr => this.squareIsOccupied(sqr, piece.color))
                }

                return legalMoves
            },
            lookForCheck(returnPieces, onColor) {
                if (typeof returnPieces === 'undefined')
                    returnPieces = false

                // Check to see if king square is attacked
                const king = this.pieces.find(piece => piece.color === onColor && piece.type === 'K')

                if (typeof king === 'undefined')
                    // TODO invalid game
                    return false

                return this.squareIsAttacked(king.square, onColor === 'W' ? 'B' : 'W', returnPieces)
            },
            lookForCheckIf(fromSquare, toSquare) {
                const piece = this.getPieceBySquare(fromSquare)

                if (typeof piece === 'undefined')
                    // TODO error
                    return false

                const pieceOnTarget = this.getPieceBySquare(toSquare)
                if (typeof pieceOnTarget !== 'undefined')
                    pieceOnTarget.is_captured = true

                this.findAllLegalMoves(true)
                piece.square = toSquare
                this.findAllLegalMoves(true)
                const check = this.lookForCheck(false, piece.color)

                // Reset
                if (typeof pieceOnTarget !== 'undefined')
                    pieceOnTarget.is_captured = false
                piece.square = fromSquare
                this.findAllLegalMoves(false)
                return check
            },
            lookForCheckMate(onColor, checkedForCheck) {
                const isCheck = checkedForCheck || this.lookForCheck(true, onColor)
                if (isCheck !== true && isCheck.length === 0)
                    return false
                const checkingPieces = isCheck === true ? this.checkingPieces : isCheck

                const king = this.pieces.find(piece => piece.color === onColor && piece.type === 'K')
                if (typeof king === 'undefined')
                    // TODO invalid game
                    return false

                // Can king move out of check?
                for (let i = 0; i < king.legalMoves.length; i++) {
                    const targetSquare = king.legalMoves[i]
                    if (!this.lookForCheckIf(king.square, targetSquare))
                        return false
                }

                // If there are two, checking pieces and king couldn't move out of check, then there is a checkmate
                if (checkingPieces.length === 2)
                    return true

                // See if checking piece can be captured
                const checkingPieceSquare = checkingPieces[0].square
                const attackedBy = this.squareIsAttacked(checkingPieceSquare, onColor, true)
                if (attackedBy.length > 0) {
                    // See if one of the attacking pieces can move
                    for (let i = 0; i < attackedBy.length; i++) {
                        const attacker = attackedBy[i]
                        if (!this.lookForCheckIf(attacker.square, checkingPieceSquare)) {
                            return false
                        }
                    }
                }

                // So, none of the pieces attacking the checking piece can move. A piece has to block the check, in other words.
                // If the checking piece is a knight or a pawn, all is lost
                const checkingPieceType = checkingPieces[0].type
                if (checkingPieceType === 'N' || checkingPieceType === 'P')
                    return true

                // Check if any piece can move into one of the squares between attacking piece and king.
                const squaresBetween = this.getSquaresBetween(checkingPieceSquare, king.square)
                const pieces = this.pieces.filter(piece => !piece.is_captured && piece.color === onColor)
                for (let p = 0; p < pieces.length; p++) {
                    const piece = pieces[p]
                    // If piece is king, then that doesn't count, obviously
                    if (piece.type === 'K')
                        continue
                    for (let s = 0; s < squaresBetween.length; s++) {
                        const square = squaresBetween[s]
                        if (piece.legalMoves.includes(square))
                            return false
                    }
                }

                return true
            },
            finishTurn(piece, square, prevSquare, captured, castling, promotion, pgnFile, pgnRank) {
                // Increase halfMove and fullMove
                this.halfMove = piece.type === 'P' ? 0 : this.halfMove + 1
                this.fullMove += this.turn

                // Update turn
                this.turn = this.turn === 0 ? 1 : 0

                this.check = false
                this.checkingPieces = []

                if (this.boardConfig.highlight.move)
                    this.highlightedSquares.move = [prevSquare, square]

                // Find new legal moves
                this.findAllLegalMoves()

                // Play sound
                if (this.check)
                    this.playSound('check')
                else if (castling !== 0)
                    this.playSound('castling')
                else if (captured !== null)
                    this.playSound('capture')
                else
                    this.playSound('move')

                // Check for check and checkmate
                if (this.check) {
                    this.checkmate = this.lookForCheckMate(this.turn === 0 ? 'W' : 'B', true)

                    if (this.checkmate)
                        this.handleCheckMate()
                }

                // Update FEN, PGN and find new legal moves
                this.updateConfigFEN(this.createFEN())
                this.updateConfigPGN(
                    promotion === null ? piece.type : 'P',
                    square,
                    prevSquare,
                    captured !== null,
                    castling,
                    promotion,
                    this.check,
                    this.checkmate,
                    pgnFile,
                    pgnRank
                )

                // Timing
                const timeNow = new Date().getTime()
                const timespan = timeNow - this.currentMoveStart
                this.currentMoveStart = timeNow

                // Emit move event
                this.$bus.$emit('halfmove', {
                    piece,
                    source: prevSquare,
                    target: square,
                    captured,
                    castling,
                    castlingOpportunities: this.castling,
                    promotion,
                    enPassantSquare: this.enPassant,
                    check: this.check,
                    timespan
                })
            },
            handleCheckMate() {
                this.displayCheckmate = true
            },

            // ----------------------------------------
            // FIND SQUARES AND PIECES
            // ----------------------------------------

            squareIsOccupied(square, color) {
                const piece = this.getPieceBySquare(square)
                if (color)
                    return typeof piece !== 'undefined' && piece.color === color && !piece.is_captured
                return typeof piece !== 'undefined' && !piece.is_captured
            },
            squareIsAttacked(square, byColor, returnPieces) {
                if (typeof returnPieces === 'undefined')
                    returnPieces = false

                const attackingPieces = []
                const pieces = this.pieces.filter(piece => piece.color === byColor && !piece.is_captured)

                for (let i = 0; i < pieces.length; i++) {
                    const piece = pieces[i]
                    if (piece.type !== 'P' && piece.legalMoves.includes(square)) {
                        if (!returnPieces)
                            return true
                        else
                            attackingPieces.push(piece)
                    } else if (piece.type === 'P') {
                        const pawnFile = piece.square.charCodeAt(0)
                        const pawnLeft = String.fromCharCode(pawnFile - 1)
                        const pawnRight = String.fromCharCode(pawnFile + 1)
                        const pawnRank = piece.square.getRankNum()
                        const attackRank = pawnRank + (piece.color === 'W' ? 1 : -1)
                        const pawnThreat = [
                            `${pawnLeft}${attackRank}`,
                            `${pawnRight}${attackRank}`
                        ]
                        if (pawnThreat.includes(square))
                            if (!returnPieces)
                                return true
                            else
                                attackingPieces.push(piece)
                    }
                }

                return returnPieces && attackingPieces.length > 0 ? attackingPieces : false
            },
            getSquaresBetween(sourceSquare, targetSquare) {
                if (sourceSquare === targetSquare)
                    return []

                let sourceFile = sourceSquare.getFileNum()
                let sourceRank = sourceSquare.getRankNum()
                let targetFile = targetSquare.getFileNum()
                let targetRank = targetSquare.getRankNum()
                // Switch source and target so that source is left of target
                if (sourceFile > targetFile) {
                    const tempSourceFile = sourceFile
                    const tempSourceRank = sourceRank
                    sourceFile = targetFile
                    sourceRank = targetRank
                    targetFile = tempSourceFile
                    targetRank = tempSourceRank
                }
                const sourceFileLetter = sourceSquare.getFile()

                const between = []

                if (sourceFile === targetFile) {
                    // If same file
                    this.$helpers.numbersBetween(sourceRank, targetRank).forEach(rank => {
                        between.push(`${sourceFileLetter}${rank}`)
                    })
                } else if (sourceRank === targetRank) {
                    // If same rank
                    this.$helpers.numbersBetween(sourceFile, targetFile).forEach(file => {
                        const letter = file.getFileLetter()
                        between.push(`${letter}${sourceRank}`)
                    })
                } else {
                    // If diagonal
                    const filesBetween = this.$helpers.numbersBetween(sourceFile, targetFile)
                    const ranksBetween = this.$helpers.numbersBetween(sourceRank, targetRank)

                    // Sort arrays according to direction
                    if (sourceRank > targetRank && sourceFile < targetFile)
                        ranksBetween.sort((a, b) => a < b)

                    // Should be same length unless function is used incorrectly, but just to be sure
                    const min = Math.min(filesBetween.length, ranksBetween.length)
                    for (let i = 0; i < min; i++) {
                        const letter = filesBetween[i].getFileLetter()
                        const rank = ranksBetween[i]
                        between.push(`${letter}${rank}`)
                    }
                }

                return between
            },
            getSquareElementByDescriptor(desc) {
                const square = $(`.square[data-square="${desc}"]`)
                return square.length ? square : null
            },
            getPieceElementBySquare(square) {
                const squareElement = this.getSquareElementByDescriptor(square)
                if (typeof squareElement === 'undefined')
                    // TODO Error handling
                    return null

                return $('.piece', $(squareElement))
            },
            getPieceBySquare(square) {
                return this.pieces.find(piece => piece.square === square && !piece.is_captured)
            },

            // ----------------------------------------
            // BOARD VISUALS
            // ----------------------------------------

            getPieceImagePath(square) {
                const piece = this.getPieceBySquare(square)
                if (!piece)
                    return ''

                let path = piece.color.toLowerCase() + piece.type.toLowerCase()
                path = `/static/images/pieces/${this.pieceSet}/${path}.svg`

                return path
            },
            getPieceImagePathByType(type, color) {
                let path = color.toLowerCase() + type.toLowerCase()
                path = `/static/images/pieces/${this.pieceSet}/${path}.svg`
                return path
            },
            highlightLegalSquare(square) {
                return this.highlightedSquares.legalMoves.includes(square)
            },
            highlightMoveSquare(square) {
                return this.highlightedSquares.move.includes(square)
            },
            highlightMarkedSquare(square) {
                return this.highlightedSquares.marked.includes(square)
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
                    // Iterate over files, from A
                    for (let c = 97; c <= 104; ++c) {
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
            updateConfigPGN(type, square, prevSquare, capture, castling, promotion, check, checkmate, pgnFile, pgnRank) {
                let pgn = ''
                if (castling === 0) {
                    pgn += type === 'P' ? (capture ? prevSquare.getFile() : '') : type
                    pgn += pgnFile || ''
                    pgn += pgnRank || ''
                    pgn += capture ? 'x' : ''
                    pgn += square
                    pgn += promotion === null ? '' : `=${promotion}`
                    pgn += check && !checkmate ? '+' : ''
                    pgn += checkmate ? '#' : ''
                } else
                    pgn += castling === 1 ? 'O-O' : 'O-O-O'
                this.addPGNMove(pgn)
            },

            // ----------------------------------------
            // MOVE NAVIGATION
            // ----------------------------------------

            moveStep(evt, speed) {
                if (typeof speed === 'undefined')
                    speed = 80

                const halfmove = this.halfmoves[evt.currentHalfMove + (evt.direction ? 0 : -1)]
                if (typeof halfmove === 'undefined')
                    return null

                const source = evt.direction ? halfmove.source : halfmove.target
                const target = evt.direction ? halfmove.target : halfmove.source

                return this.animatedMove(source, target, speed).done(() => {
                    halfmove.piece.square = target

                    // Reset captured piece
                    if (halfmove.captured !== null) {
                        // Reset captive
                        halfmove.captured.is_captured = evt.direction
                        const captivePieceElement = this.getPieceElementBySquare(source)
                        if (typeof captivePieceElement !== 'undefined')
                            captivePieceElement.css({
                                left: 0,
                                top: 0
                            })
                    }

                    // Reset castling
                    if (halfmove.castling > 0) {
                        const side = halfmove.castling === 1 ? 'K' : 'Q'
                        const square = (side === 'K' ? 'h' : 'a') + (halfmove.piece.color === 'W' ? '1' : '8')
                        const rook = this.pieces.find(p => p.color === halfmove.piece.color && p.side === side && p.type === 'R')
                        rook.is_captured = false

                        this.animatedMove(rook.square, square, speed).done(() => {
                            rook.square = square
                        })
                    }

                    // Reset promotion
                    if (halfmove.promotion !== null)
                        if (evt.direction)
                            halfmove.piece.type = halfmove.promotion
                        else
                            halfmove.piece.type = 'P'

                    // Set correct state
                    this.castling = halfmove.castlingOpportunities
                    this.enPassant = halfmove.enPassantSquare

                    // Set highlighted squares
                    if (evt.direction)
                        this.highlightedSquares.move = [source, target]
                    else {
                        const prevHalfmove = this.halfmoves[evt.currentHalfMove - 2]
                        this.highlightedSquares.move = typeof prevHalfmove === 'undefined' ? [] : [prevHalfmove.source, prevHalfmove.target]
                    }
                })
            },
            moveTo(evt) {
                if (evt.halfmove === evt.currentHalfMove)
                    return

                const direction = evt.halfmove > evt.currentHalfMove

                this.moveStep({
                    direction,
                    currentHalfMove: evt.currentHalfMove
                }, 20).done(() => {
                    evt.currentHalfMove += direction ? 1 : -1
                    this.moveTo({
                        halfmove: evt.halfmove,
                        currentHalfMove: evt.currentHalfMove
                    })
                })
            },
            animatedMove(sourceSquare, targetSquare, speed) {
                if (typeof speed === 'undefined')
                    speed = 80

                const sourceSquareElement = this.getSquareElementByDescriptor(sourceSquare)
                if (typeof sourceSquareElement === 'undefined')
                    // TODO Error handling
                    return null

                const targetSquareElement = this.getSquareElementByDescriptor(targetSquare)
                if (typeof targetSquareElement === 'undefined')
                    // TODO Error handling
                    return null

                const pieceElement = this.getPieceElementBySquare(sourceSquare)

                // Get target coordinates
                const sourceX = sourceSquareElement.offset().left
                const sourceY = sourceSquareElement.offset().top
                const targetX = targetSquareElement.offset().left
                const targetY = targetSquareElement.offset().top
                const deltaX = targetX - sourceX
                const deltaY = targetY - sourceY

                // Animate and return promise
                return pieceElement.animate({
                    left: deltaX,
                    top: deltaY
                }, speed, 'linear').promise()
            },
            loadSounds(theme) {
                if (typeof theme === 'undefined')
                    theme = 'regular'

                const movePath = `/static/sounds/pieces/${theme}/move.wav`
                const capturePath = `/static/sounds/pieces/${theme}/capture.wav`
                const castlingPath = `/static/sounds/pieces/${theme}/castling.wav`
                const checkPath = `/static/sounds/pieces/${theme}/check.wav`
                this.sounds.move = new Audio(movePath)
                this.sounds.capture = new Audio(capturePath)
                this.sounds.castling = new Audio(castlingPath)
                this.sounds.check = new Audio(checkPath)
            },
            playSound(sound) {
                if (typeof this.sounds[sound] !== 'undefined' && this.sounds[sound] !== null)
                    this.sounds[sound].play()
            },

            // ----------------------------------------
            // OTHER
            // ----------------------------------------
            keyDown(evt) {
                switch (evt.key.toLowerCase()) {
                case 't':
                    this.animatedMove('e2', 'e3')
                    break;
                case 'escape':
                    this.clearArrowsAndMarked()
                    break;
                default:
                    break;
                }
            },

            ...mapMutations([
                'updateConfigFEN',
                'addPGNMove',
                'addCapturedPiece',
                'resetGame'
            ])
        }
    }

</script>

<style lang="scss" scoped>
    @import '../assets/style/_settings.scss';
    @import '../assets/style/_standards.scss';

    div.container {
        position: relative;
        width: 100%;
        height: 100%;
        font-size: 0;
        font-family: 'OpenSans-Regular', arial, sans-serif;

        div.checkmate {

            h2 {
                padding: 24px;
            }
            div.buttons {
                text-align: center;

                .fa-icon {
                    width: auto;
                    height: 22px;
                    color: #3b771c;
                    vertical-align: middle;
                }
                div {
                    display: inline-block;
                    padding: 4px 8px;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    color: #666;
                    vertical-align: top;
                    cursor: default;
                    border-radius: 2px;

                    &:hover {
                        background-color: rgba(0, 0, 0, 0.1);
                    }
                }
                div.analyse {
                    margin-right: 10px;
                }
                div.reset {
                    margin-left: 10px;
                }
            }
        }
        div.load-pgn {

            textarea {
                width: 100%;
                height: 260px;
                border: none;
                box-sizing: border-box;
                border: 1px solid $lightBorder;
                resize: vertical;
                color: #333;
            }
            div.buttons {
                width: 100%;
                text-align: right;
                margin-top: 4px;
            }
        }
        div.side {
            background-color: #9b6b47;
            background-color: rgba(235, 235, 235, 0.2);
            user-select: none;
            color: #f4e1d0;
            color: rgba(54, 54, 56, 0.7);
            text-shadow: 0px 0px 1px rgba(255, 255, 255, 0.6);
        }
        div.numbers {
            float: left;
            width: 5%;
            height: 95%;
            margin-right: 1px;

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
        }
        div.letters {
            display: inline-block;
            width: 95%;
            height: 5%;

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
            background-color: $lightSquare;
            background: $promoterBackground;
            border-radius: 2px;
            z-index: 1100 !important;
            box-shadow: 0 0 12px #111;

            div.piece-img {
                width: 100%;
                height: 25%;
                padding: 12px;
                box-sizing: border-box;
                background-size: cover;
                border-radius: 4px;

                &:hover {
                    background-color: rgba(91, 52, 8, 0.35);
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
            div.arrow {
                position: absolute;
                width: 200px;
                height: 16px;
                background-color: rgba(66, 134, 244, 0.75);
                z-index: 11;
                transform-origin: 0% 50%;
                transform: rotate(25deg);
                pointer-events: none;

                &:after {
                    content: '';
                    display: block;
                    width: 0;
                    height: 0;
                    margin-left: 100%;
                    margin-top: -8px;
                    border-top: 16px solid transparent;
                    border-bottom: 16px solid transparent;
                    border-left: 28px solid rgba(66, 134, 244, 0.75);
                }
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
                        &.highlight-marked {
                            &:after {
                                content: '';
                                position: absolute;
                                width: 100%;
                                height: 100%;
                                background-color: rgba(201, 0, 0, 0.6);
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
                            background-color: $lightSquare;
                            /*background-color: transparent;*/
                        }
                        div.square:nth-child(even) {
                            background-color: $darkSquare;
                            /*background-color: rgba(0, 0, 0, 0.3);*/
                        }
                    }
                    &:nth-child(even) {
                        div.square:nth-child(odd) {
                            background-color: $darkSquare;
                            /*background-color: rgba(0, 0, 0, 0.3);*/
                        }
                        div.square:nth-child(even) {
                            background-color: $lightSquare;
                            /*background-color: transparent;*/
                        }
                    }
                }
            }
        }
    }

</style>