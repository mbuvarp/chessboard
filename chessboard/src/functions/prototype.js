export default function () {
    function removeIf(callback) {
        let i = this.length
        while (i--) {
            if (callback(this[i], i)) {
                this.splice(i, 1)
            }
        }
    }
    Array.prototype.removeIf = removeIf

    function getColFromString() {
        return this.substring(0, 1)
    }
    String.prototype.getCol = getColFromString
    function getColNumFromString() {
        return this.getCol().charCodeAt(0) - 64
    }
    String.prototype.getColNum = getColNumFromString

    function getRankFromString() {
        return this.substring(1, 2)
    }
    String.prototype.getRank = getRankFromString
    function getRankNumFromString() {
        return parseInt(this.getRank(), 10)
    }
    String.prototype.getRankNum = getRankNumFromString

    function getColLetterFromNum() {
        return String.fromCharCode(64 + this)
    }
    Number.prototype.getColLetter = getColLetterFromNum
}
