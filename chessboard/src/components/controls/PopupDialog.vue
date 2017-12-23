<template>
    <div class="popup"
        :style="{
            'background-color': 'rgba(0, 0, 0, ' + alpha + ')'
        }"
    >
        <div class="body">
            <div class="close">
                <icon class="icon" name="close" @click="cancel"></icon>
            </div>
            <h2 v-text="header" v-if="header !== ''"></h2>
            <component :is="comp" @popupCancel="cancel" @popupSubmit="submit"></component>
        </div>
    </div>
</template>
<script>
    import 'vue-awesome/icons/close'

    export default {
        name: 'PopupDialog',

        props: {
            promiseResolve: {
                type: Function,
                required: true
            },
            promiseReject: {
                type: Function,
                required: true
            },
            header: {
                type: String,
                default: ''
            },
            comp: {
                type: Object,
                required: true
            },
            alpha: {
                type: Number,
                default: 0,
                validator: value => value >= 0 && value <= 1
            }
        },

        methods: {
            cancel(evt) {
                this.promiseReject(evt)
                this.$popup()
            },
            submit(evt) {
                this.promiseResolve(evt)
                this.$popup()
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import '../../assets/style/_settings.scss';
    @import '../../assets/style/_standards.scss';

    div.popup {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1000;

        div.body {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            padding: 2em;
            border-radius: 2px;
            box-shadow: 0 2px 6px black;
            background-color: white;

            div.close {
                position: absolute;
                width: 48px;
                height: 48px;
                top: -12px;
                right: -12px;
                background-color: white;
                border-radius: 50%;
                background: linear-gradient(
                    45deg,
                    #cbcfd6,
                    #eaecef
                );
                box-shadow: 0 0 6px 1px #999;

                &:hover {
                    background: linear-gradient(
                        45deg,
                        #b1b9c6,
                        #dee2e8
                    );

                    .icon {
                        color: #88b;
                    }
                }
                .icon {
                    position: absolute;
                    width: auto;
                    height: 26px;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #77a;
                }
            }
        }
    }
</style>