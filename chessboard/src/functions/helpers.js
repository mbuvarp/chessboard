const Helpers = {
    install(vue) {
        const helpers = {
            // General
            findObjectKey(object, callback) {
                for (const prop in object) {
                    if (object.hasOwnProperty(prop)) {
                        if (callback(object[prop]))
                            return prop
                    }
                }
                return null
            },
            numbersBetween(low, high) {
                if (low > high) {
                    const temp = low
                    low = high
                    high = temp
                }
                const n = []
                for (let i = low + 1; i < high; i++)
                    n.push(i)
                return n
            },

            // Chess
            pgnIsValid(pgn) {
                const lines = pgn.split('\n')
                if (lines.length === 1)
                    return false

                // Metadata
                const patternMeta = /\[\w+ ".+"\]/giu
                const metadata = []
                let breakLine = 0
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i] === '') {
                        breakLine = i
                        break
                    }
                    if (patternMeta.test(lines[i]))
                        metadata.push(lines[i])
                }

                const moveLines = lines.splice(breakLine + 1)
                const moves = moveLines.join(' ')

                const allMoves = moves.split(/[0-9]+\./)

                // Remove empty lines, and trim the rest
                for (let i = 0; i < allMoves.length; i++) {
                    if (allMoves[i] === '') {
                        allMoves.splice(i, 1)
                        i--
                    } else 
                        allMoves[i] = allMoves[i].trim()
                }

                return {
                    metadata,
                    moves: allMoves
                }
            },
        }

        vue.prototype.$helpers = helpers
    }
}

export default Helpers
