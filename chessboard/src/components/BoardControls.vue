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
            <div class="bottom-controls">
                <div class="buttons move-nav">
                    <div class="button" @click=""><icon name="play"></icon></div>
                    <div class="button" @click=""><icon name="pause"></icon></div>
                    <div class="button" @click=""><icon name="fast-backward"></icon></div>
                    <div class="button" @click="step(false)"><icon name="step-backward"></icon></div>
                    <div class="button" @click="step(true)"><icon name="step-forward"></icon></div>
                    <div class="button" @click=""><icon name="fast-forward"></icon></div>
                </div>
                <div class="buttons right">
                    <div class="button" @click=""><icon name="rotate-left"></icon></div>
                </div>
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
    import 'vue-awesome/icons/rotate-left'

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
                fen: state => state.config.fen,
                halfmoves: state => state.halfmoves
            })
        },

        watch: {
            fen: {
                handler() {
                    setTimeout(() => {
                        $('.moves ul').scrollTop($('.moves ul').prop('scrollHeight'))
                    }, 25)
                },
                deep: true
            }
        },

        mounted() {
            this.$bus.$on('halfmove', this.halfMoveHandler)
        },

        methods: {
            halfMoveHandler(move) {
                ++this.currentHalfMove
                this.addHalfMove(move)
            },
            step(direction) {
                this.$bus.$emit('step', {
                    direction,
                    halfmove: this.currentHalfMove
                })

                if (direction && this.currentHalfMove < this.halfmoves.length)
                    ++this.currentHalfMove
                else if (!direction && this.currentHalfMove > 0)
                    --this.currentHalfMove
            },

            ...mapMutations([
                'updateConfigFEN',
                'addHalfMove'
            ])
        }
    };

</script>

<style lang="scss" scoped>

    @font-face {
        font-family: 'OpenSans-Regular';
        src: url('/static/fonts/OpenSans/OpenSans-Regular.ttf') format('truetype');        
    }
    @keyframes rolling { 
        0% { background-position: 0% 19% }
        50% { background-position: 100% 82% }
        100% { background-position: 0% 19% }
    }

    div#controls {
        width: 440px;
        height: 90vh;
        margin-left: 36px;
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
            padding: 4px 5px;
            border: 1px solid #bfbfbf;
            box-shadow: 0 1px 3px 0px rgba(0, 0, 0, 0.32);
            color: rgb(65, 88, 107);
            background: linear-gradient(270deg, #effaff, #ffffff);
            background-size: 400% 400%;
            animation: rolling 30s ease infinite;

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

                &::-webkit-scrollbar {
                    width: 8px;
                }
                 
                &::-webkit-scrollbar-track {
                    background-color: transparent;
                }
                 
                &::-webkit-scrollbar-thumb {
                    background-color: #bebec6;
                }
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
                            cursor: default;

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
            div.bottom-controls {
                width: 100%;
                height: 36px;
                border-top: 1px solid #cfcfcf;
                background-color: #eaeaea;
                user-select: none;
                
                .fa-icon {
                    width: auto;
                    height: 100%;
                    color: #7a7a87;

                    &:hover {
                        color: #9393a0;
                    }
                    &:active {
                        color: #a7a7b2;
                    }
                }
                div.buttons {
                    display: inline-block;
                    width: 50%;
                    height: 100%;

                    &.move-nav {
                        div.button:nth-child(3) {
                            margin-left: 20px;
                        }
                    }
                    div.button {
                        display: inline-block;
                        height: 20px;
                        margin-top: 8px;
                        margin-left: 10px;
                    }
                    &.right {
                        text-align: right;

                        div.button {
                            margin-left: 0px;
                            margin-right: 12px;
                        }
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
