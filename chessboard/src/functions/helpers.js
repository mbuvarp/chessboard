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
            extractPGN(pgn) {
                // TODO Error checking
                // TODO PGN comments

                // Metadata
                const patternMeta = /\[\w+ ".+"\]/giu
                const metadata = {}
                // Check if there is metadata
                const containsMeta = patternMeta.test(pgn)
                if (containsMeta) {
                    const metas = pgn.match(patternMeta)
                    metas.forEach(meta => {
                        const key = meta.split('[')[1].split(' "')[0]
                        let value = meta.match(/".+"/giu)[0]
                        value = value.substring(1, value.length - 1)
                        metadata[key] = value
                    })
                }

                // Moves
                // Split if contains meta
                if (containsMeta)
                    pgn = pgn.split('\n\n')[1]

                const moveSplitPattern = /[0-9]+\./giu
                let splittedMoves = pgn.split(moveSplitPattern)
                // Remove first empty
                splittedMoves.splice(0, 1)
                // Trim all
                splittedMoves = splittedMoves.map(el => el.trim().replace('\n', ' '))

                const moves = {}
                for (let i = 0; i < splittedMoves.length; i++) {
                    const move = splittedMoves[i]
                    moves[i + 1] = {}

                    const movePattern = /^([a-hPRNBQK]+[1-8]?x?[a-h]?[1-8]x?=?[RNBQ]?[+#]?)|([oO]-[oO](-[oO])?)$/i
                    const resultPattern = /^([01]|(1\/2))-([01]|(1\/2))$/i
                    const splitted = move.split(' ')
                    const white = splitted[0]
                    const black = splitted[1]

                    if (movePattern.test(white))
                        moves[i + 1].white = white
                    else if (resultPattern.test(white)) {
                        moves.result = white
                        break
                    }

                    if (typeof black !== 'undefined') {
                        if (movePattern.test(black))
                            moves[i + 1].black = black
                        else if (resultPattern.test(black)) {
                            moves.result = black
                            break
                        }
                    } else break
                }

                return { metadata, moves }
            },
        }

        vue.prototype.$helpers = helpers
    }
}

export default Helpers
