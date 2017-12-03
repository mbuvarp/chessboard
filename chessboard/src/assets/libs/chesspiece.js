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

    set captured(capd) {
        this.is_captured = capd
        if (capd)
            this.square = null
    }
}

export default ChessPiece
