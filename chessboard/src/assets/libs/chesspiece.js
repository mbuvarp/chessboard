class ChessPiece {
    constructor(type, color, side, square) {
        this.type = type
        this.color = color
        this.side = side
        this.square = square

        this.legalMoves = []
    }

    moveIsLegal(targetSquare) {
        return this.legalMoves.includes(targetSquare)
    }
}

export default ChessPiece
