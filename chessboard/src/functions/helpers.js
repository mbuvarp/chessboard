const Helpers = {
    install(vue) {
        const helpers = {
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
            }
        }

        vue.prototype.$helpers = helpers
    }
}

export default Helpers
