<template>
    
    <div id="app">
        <popup-dialog
            v-if="popup.show"
            :promiseResolve="popup.promiseResolve"
            :promiseReject="popup.promiseReject"
            :header="popup.header"
            :cancelText="popup.cancelText"
            :submitText="popup.submitText"
            :alpha="popup.alpha"
            :comp="popup.comp"
        ></popup-dialog>
        <router-view/>
    </div>

</template>

<script>

    export default {
        name: 'app',

        data() {
            return {
                popup: {
                    promise: null,
                    show: false,
                    header: '',
                    cancelText: 'Cancel',
                    submitText: 'Submit',
                    alpha: 0.2,
                    comp: null
                }
            }
        },

        mounted() {
            this.$bus.$on('popup', this.displayPopup)
        },

        methods: {
            displayPopup(options) {
                this.popup.promiseResolve = options.promiseResolve
                this.popup.promiseReject = options.promiseReject
                this.popup.header = options.header || ''
                this.popup.cancelText = options.cancelText || 'Cancel'
                this.popup.submitText = options.submitText || 'Submit'
                this.popup.alpha = options.alpha || 0.2
                this.popup.comp = options.comp || null

                this.popup.show = !this.popup.show
            }
        }
    }

</script>

<style lang="scss" scoped>

    #app {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-image: linear-gradient(#dbe0e0, #eaefef 10%, #f7fcfc);
    }

</style>
