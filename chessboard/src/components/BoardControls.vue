<template>

    <div id="controls">
        <div class="game">
            <div class="info">
                <div class="players">
                    <div class="white">White</div>
                    <div class="vs">vs</div>
                    <div class="black">Black</div>
                </div>
                <div class="capstate">
                    <ul class="white">
                        <li class="cap" v-for="cap in getCaptures('B')">
                            <div class="piece-icon" :style="'background-image: url(' + getPieceImagePathByType(cap[0], 1) + ');'"></div>
                            <span v-if="cap[1] > 1" v-text="'x' + cap[1]"></span>
                        </li>
                    </ul>
                    <div class="score" v-text="(score > 0 ? '+' : '') + score"></div>
                    <ul class="black">
                        <li class="cap" v-for="cap in getCaptures('W')">
                            <div class="piece-icon" :style="'background-image: url(' + getPieceImagePathByType(cap[0], 0) + ');'"></div>
                            <span v-if="cap[1] > 1" v-text="'x' + cap[1]"></span>
                        </li>
                    </ul>
                </div>
            </div>
            <ul class="moves">
                <li v-for="(move, index) in movelist">
                    <div class="movenr" v-text="index + 1"></div>
                    <div
                        :class="{ 'halfmove': true, 'white': true, 'current': index * 2 + 1 === currentHalfMove }"
                        v-text="move[0]"
                        @click="goto(index * 2 + 1)"
                    ></div>
                    <div
                        :class="{ 'halfmove': true, 'black': true, 'current': index * 2 + 2 === currentHalfMove }"
                        v-text="move[1]"
                        @click="goto(index * 2 + 2)"
                        v-if="move[1]"
                    ></div>
                </li>
            </ul>
            <div class="bottom-controls">
                <div class="buttons move-nav">
                    <div class="button" @click=""><icon name="play"></icon></div>
                    <div class="button" @click=""><icon name="pause"></icon></div>
                    <div class="button" @click="goto(0)"><icon name="fast-backward"></icon></div>
                    <div class="button" @click="step(false)"><icon name="step-backward"></icon></div>
                    <div class="button" @click="step(true)"><icon name="step-forward"></icon></div>
                    <div class="button" @click="goto(-1)"><icon name="fast-forward"></icon></div>
                </div>
                <div class="buttons right">
                    <div class="button" @click="reset"><icon name="rotate-left"></icon></div>
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
    import { mapState, mapMutations, mapGetters } from 'vuex'
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
                pgn: state => state.game.pgn,
                fen: state => state.game.fen,
                halfmoves: state => state.halfmoves,
                score: state => state.game.score,
                captures: state => state.game.captures,
                pieceSet: state => state.theme.pieceSet
            }),
            ...mapGetters([
                'score'
            ])
        },

        mounted() {
            this.$bus.$on('halfmove', this.halfMoveHandler)
        },

        methods: {
            halfMoveHandler(move) {
                ++this.currentHalfMove
                this.addHalfMove(move)

                // Scroll move list
                setTimeout(() => {
                    $('ul.moves').scrollTop($('ul.moves').prop('scrollHeight'))
                }, 25)
            },

            step(direction) {
                this.$bus.$emit('step', {
                    direction,
                    currentHalfMove: this.currentHalfMove
                })

                if (direction && this.currentHalfMove < this.halfmoves.length)
                    ++this.currentHalfMove
                else if (!direction && this.currentHalfMove > 0)
                    --this.currentHalfMove
            },
            goto(halfmove) {
                if (halfmove === -1)
                    halfmove = this.halfmoves.length

                this.$bus.$emit('goto', {
                    halfmove,
                    currentHalfMove: this.currentHalfMove
                })

                this.currentHalfMove = halfmove
            },

            reset() {
                this.resetGame()
                this.$bus.$emit('reset', null)
            },

            getCaptures(color) {
                const caps = color === 'W' ? this.captures.white : this.captures.black
                const amt = {}

                caps.forEach(elmt => {
                    if (typeof amt[elmt] === 'undefined')
                        amt[elmt] = 0
                    ++amt[elmt]
                })

                const ret = []
                for (const type in amt) {
                    if (amt.hasOwnProperty(type)) {
                        ret.push([type, amt[type]])
                    }
                }

                return ret
            },
            getPieceImagePathByType(type, color) {
                if (typeof color === 'number')
                    color = color === 0 ? 'W' : 'B'

                let path = color.toLowerCase() + type.toLowerCase()
                path = `/static/images/pieces/${this.pieceSet}/${path}.svg`
                return path
            },

            ...mapMutations([
                'updateConfigFEN',
                'addHalfMove',
                'resetGame'
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
        div.game {
            width: 100%;
            height: 480px;
            background-color: white;
            border: 1px solid #bfbfbf;
            box-shadow: 0 1px 3px 0px rgba(0, 0, 0, 0.32);
            color: rgb(40, 60, 100);
            box-sizing: border-box;

            div.info {
                width: 100%;
                border-bottom: 1px solid #cfcfcf;
                background-color: #eaeaea;
                user-select: none;
                overflow: hidden;
                box-sizing: border-box;

                div.players {
                    width: 100%;
                    height: 36px;
                    box-sizing: border-box;

                    div {
                        display: inline-block;
                        line-height: 36px;
                        text-align: center;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        padding: 0 8px;
                        box-sizing: border-box;
                        text-shadow: -1px -1px 0 #ddd;
                        color: #445;

                        &.white, &.black {
                            width: 45%;
                        }
                        &.vs {
                            width: 10%;
                            color: #aaa;
                        }
                    }
                }
                div.capstate {
                    width: 100%;
                    height: 36px;
                    box-sizing: border-box;
                    height: 36px;

                    div.score {
                        position: relative;
                        display: inline-block;
                        width: 10%;
                        height: 100%;
                        line-height: 44px;
                        text-align: center;
                        overflow: hidden;
                        padding: 0 8px;
                        box-sizing: border-box;

                        &:before {
                            content: "Score";
                            position: absolute;
                            left: 50%;
                            top: -14px;
                            transform: translateX(-50%);
                            font-size: 0.6rem;
                            color: #999;
                            text-transform: uppercase;
                        }
                    }
                    ul.white, ul.black {
                        display: inline-block;
                        width: 45%;
                        height: 100%;
                        padding: 0;
                        margin: 0;
                        list-style-type: none;
                        vertical-align: top;
                        overflow: hidden;
                        text-align: center;

                        li.cap {
                            display: inline-block;
                            width: auto;
                            height: 36px;

                            div.piece-icon {
                                display: inline-block;
                                width: 24px;
                                height: 24px;
                                margin-top: 6px;
                                background-size: cover;
                            }
                            span {
                                display: inline-block;
                                height: 36px;
                                line-height: 42px;
                                vertical-align: top;
                                margin-left: -6px;
                                margin-right: 4px;
                                color: #666;
                                font-size: 0.6rem;
                            }
                        }
                    }
                }
            }
            ul.moves {
                width: 100%;
                height: calc(100% - 110px);
                max-height: calc(100% - 72px);
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
                    display: flex;
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
                            width: 42%;
                            cursor: default;
                            padding-left: 4px;

                            &.white {
                                border-right: 1px solid #cfcfcf;
                            }
                            &.current {
                                color: #e23516;
                            }
                            &:hover {
                                background-color: #96c2cc;
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
