const Popup = {
    install(vue) {
        const popup = function (options) {
            let promiseResolve = null
            let promiseReject = null
            const promise = new Promise((resolve, reject) => {
                promiseResolve = resolve
                promiseReject = reject
            })

            const opts = {
                promiseResolve,
                promiseReject,
                ...options
            }

            this.$bus.$emit('popup', opts)

            return promise
        }

        vue.prototype.$popup = popup
    }
}

export default Popup
