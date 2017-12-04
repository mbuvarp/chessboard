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
}
