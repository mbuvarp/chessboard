<template>

    <div id="controls">
        <div class="pgn">
            <ul>
                
            </ul>
        </div>
        <div class="fen">
            <h3>FEN</h3>
            <input type="text" :value="fen">
        </div>
    </div>

</template>

<script>
    import { mapState, mapMutations } from 'vuex'

    export default {
        name: 'BoardControls',
        
        components: {

        },

        computed: {
            movelist() {
                
            },

            ...mapState({
                pgn: state => state.config.pgn,
                fen: state => state.config.fen
            })
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
        padding: 16px 20px;
        float: left;
        background-color: #fafafa;
        box-shadow: 0 0 16px 5px rgba(0, 0, 0, 0.42),
                    inset 0 0 2px rgba(0, 0, 0, 0.63);
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
        div.fen {
            width: 100%;
        }
    }

</style>
