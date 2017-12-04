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
            }
        }

        vue.prototype.$helpers = helpers
    }
}

export default Helpers
