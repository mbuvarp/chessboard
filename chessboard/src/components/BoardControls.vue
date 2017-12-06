<template>

    <div id="controls">
        <div class="moves">
            <ul>
                <li v-for="move in movelist">
                    <div class="movenr" v-text="move.movenr"></div>
                    <div :class="{ 'halfmove': true, 'white': true, 'prev': move.prev === 'white' }" v-text="move.white"></div>
                    <div :class="{ 'halfmove': true, 'black': true, 'prev': move.prev === 'black' }" v-text="move.black"></div>
                </li>
            </ul>
            <div class="move-nav">
                
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

    const $ = require('jquery')

    export default {
        name: 'BoardControls',
        
        components: {

        },

        computed: {
            movelist() {
                const moves = []
                for (let i = 0; i < this.pgn.moves.length; i += 2) {
                    moves.push({
                        movenr: Math.floor(i / 2 + 1),
                        white: this.pgn.moves[i],
                        black: this.pgn.moves[i + 1],
                        prev: i >= this.pgn.moves.length - 2 ? (typeof this.pgn.moves[i + 1] === 'undefined' ? 'white' : 'black') : false
                    })
                }
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

        methods: {
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
                            &.prev {
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
            }
        }
        div.fen {
            width: 100%;
            margin-top: 8px;
        }
    }

</style>
