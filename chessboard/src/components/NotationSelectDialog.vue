<template>
    <div class="notation">
        <div
            :class="{ 'note': true, 'pgn': true, 'active': activeRadio === 0 }"
            @click="setActive(0)"
        >
            <h3>PGN</h3>
            <textarea v-model="pgn"></textarea>
            <div class="button">
                <button type="button" @click="loadPGN">Load PGN</button>
            </div>
        </div>
        <div
            :class="{ 'note': true, 'fen': true, 'active': activeRadio === 1 }"
            @click="setActive(1)"
        >
            <h3>FEN</h3>
            <input type="text" v-model="fen">
            <div class="button">
                <button type="button" @click="loadFEN">Load FEN</button>
            </div>
        </div>

    </div>
</template>
<script>
    export default {
        name: 'NotationSelectDialog',

        data() {
            return {
                pgn: '',
                fen: '',
                activeRadio: 0
            }
        },

        methods: {
            setActive(note) {
                this.activeRadio = note
            },
            loadPGN() {
                this.$emit('popupSubmit', {
                    type: 'pgn',
                    value: this.pgn
                })
            },
            loadFEN() {
                this.$emit('popupSubmit', {
                    type: 'fen',
                    value: this.fen
                })
            }
        }
    }
</script>
<style lang="scss" scoped>
    @import '../assets/style/_settings.scss';
    @import '../assets/style/_standards.scss';

    div.notation {
        height: 100%;

        div.note {
            width: 100%;

            &:not(:last-child) {
                margin-bottom: 1em;
            }

            textarea, input {
                box-sizing: border-box;
                padding: 0.4em;
                border: none;
                border: 1px solid $lightBorder;
                box-shadow: 0 1px 3px #aaa;
                color: #334;
            }
            textarea {
                width: 340px;
                height: 250px;
            }
            input {
                width: 100%;
            }
            h3 {
                margin: 0 0 4px 0;
                font-family: 'OpenSans-Regular';
            }
            div.button {
                width: 100%;
                margin-top: 2px;
                text-align: right;
            }
            &.fen {
                div.button {
                    margin-top: 6px;
                }
            }
        }
    }
</style>