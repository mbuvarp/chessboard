class ChessPiece {
    constructor(type, color, side, square) {
        this.type = type
        this.color = color
        this.side = side
        this.square = square

        this.legalMoves = []
        this.is_captured = false
    }

    moveIsLegal(targetSquare) {
        return this.legalMoves.includes(targetSquare)
    }

    capture() {
        this.is_captured = true
        this.legalMoves = []
    }

    get opponent() {
        return this.color === 'W' ? 'B' : 'W'
    }
}

export default ChessPiece
