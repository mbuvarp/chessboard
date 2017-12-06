<template>

    <div id="controls">
        <div class="moves">
            <ul>
                <li v-for="(move, index) in movelist">
                    <div class="movenr" v-text="index + 1"></div>
                    <div
                        :class="{ 'halfmove': true, 'white': true, 'current': index * 2 + 1 === currentHalfMove }"
                        v-text="move[0]"
                    ></div>
                    <div
                        :class="{ 'halfmove': true, 'black': true, 'current': index * 2 + 2 === currentHalfMove }"
                        v-text="move[1]"
                    ></div>
                </li>
            </ul>
            <div class="move-nav">
                <icon name="fast-backward"></icon>
                <icon name="step-backward" @click="step('backward')"></icon>
                <icon name="play"></icon>
                <icon name="pause"></icon>
                <icon name="step-forward" @click="step('forward')"></icon>
                <icon name="fast-forward"></icon>
            </div>
        </div>
        <div class="fen">
            <h3>FEN</h3>
            <input type="text" :value="fen">
        </div>
    </div>

</template>

<script>
    import { mapState, mapMutations } from 'vuex'
    import 'vue-awesome/icons/step-backward'
    import 'vue-awesome/icons/step-forward'
    import 'vue-awesome/icons/fast-backward'
    import 'vue-awesome/icons/fast-forward'
    import 'vue-awesome/icons/play'
    import 'vue-awesome/icons/pause'

    const $ = require('jquery')

    export default {
        name: 'BoardControls',
        
        data() {
            return {
                currentHalfMove: 0,
            }
        },

        computed: {
            movelist() {
                const moves = []
                for (let i = 0; i < this.pgn.moves.length; i += 2)
                    moves.push([this.pgn.moves[i], this.pgn.moves[i + 1]])
                return moves
            },

            ...mapState({
                pgn: state => state.config.pgn,
                fen: state => state.config.fen
            })
        },

        watch: {
            fen: {
                handler() {
                    setTimeout(() => {
                        $('.moves').scrollTop($('.moves').prop('scrollHeight'))
                    }, 25)
                },
                deep: true
            }
        },

        mounted() {
            this.$bus.$on('halfmove', this.halfMoveHandler)
        },

        methods: {
            halfMoveHandler() {
                ++this.currentHalfMove
            },
            step(direction) {
                this.$bus.$emit('step', { direction })
            },

            ...mapMutations([
                'updateConfigFEN'
            ])
        }
    };

</script>

<style lang="scss" scoped>

    @font-face {
        font-family: 'OpenSans-Regular';
        src: url('/static/fonts/OpenSans/OpenSans-Regular.ttf') format('truetype');        
    }

    div#controls {
        width: 440px;
        height: 720px;
        float: left;
        border-radius: 2px;
        box-sizing: border-box;
        font-family: 'OpenSans-Regular', arial, sans-serif;

        h3 {
            margin: 0 0 2px 0;
            letter-spacing: 2px;
        }
        input[type="text"] {
            width: 100%;
            box-sizing: border-box;
            padding: 3px 4px;
            border: 1px solid #bfbfbf;
            box-shadow: 0 1px 3px 0px rgba(0, 0, 0, 0.32);
            color: rgb(40, 60, 100);

            &:hover {
                box-shadow: 0 1px 3px 1px rgba(0, 0, 0, 0.32);
            }
        }
        div.moves {
            width: 100%;
            height: 480px;
            background-color: white;
            border: 1px solid #bfbfbf;
            box-shadow: 0 1px 3px 0px rgba(0, 0, 0, 0.32);
            color: rgb(40, 60, 100);
            box-sizing: border-box;

            ul {
                width: 100%;
                height: calc(100% - 36px);
                max-height: calc(100% - 36px);
                margin: 0;
                padding: 0;
                list-style-type: none;
                box-sizing: border-box;
                overflow-x: hidden;
                overflow-y: auto;

                li {
                    line-height: 1.7rem;

                    div {
                        display: inline-block;
                        box-sizing: border-box;

                        &.movenr {
                            width: 16%;
                            background-color: #eaeaea;
                            color: #888;
                            border-right: 1px solid #cfcfcf;
                            text-align: center;
                        }
                        &.halfmove {
                            width: 40%;

                            &.white {
                                border-right: 1px solid #cfcfcf;
                            }
                            &.current {
                                color: #e23516;
                            }
                        }
                    }
                }
            }
            div.move-nav {
                width: 100%;
                height: 36px;
                border-top: 1px solid #cfcfcf;
                background-color: #eaeaea;
                user-select: none;

                .fa-icon {
                    width: auto;
                    height: 20px;
                    margin-top: 8px;
                    margin-left: 10px;
                    color: #646470;

                    &:hover {
                        color: #9393a0;
                    }
                }
            }
        }
        div.fen {
            width: 100%;
            margin-top: 8px;
        }
    }

</style>
