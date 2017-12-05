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

    function getFileFromString() {
        return this.substring(0, 1)
    }
    String.prototype.getFile = getFileFromString
    function getFileNumFromString() {
        return this.getFile().charCodeAt(0) - 96
    }
    String.prototype.getFileNum = getFileNumFromString

    function getRankFromString() {
        return this.substring(1, 2)
    }
    String.prototype.getRank = getRankFromString
    function getRankNumFromString() {
        return parseInt(this.getRank(), 10)
    }
    String.prototype.getRankNum = getRankNumFromString

    function getFileLetterFromNum() {
        return String.fromCharCode(96 + this)
    }
    Number.prototype.getFileLetter = getFileLetterFromNum
}
