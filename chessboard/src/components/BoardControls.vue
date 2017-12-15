<template>

    <div id="controls">
        <div class="tabs">
            <div class="tab-head">
                <div class="tab-game">
                    Game
                </div>
                <div class="tab-settings">
                    Settings
                </div>
            </div>
            <game-info></game-info>
        </div>
    </div>

</template>

<script>
    import GameInfo from './GameInfo'

    export default {
        name: 'BoardControls',
        
        components: {
            GameInfo
        },

        data() {
            return {
                currentHalfMove: 0,
            }
        },
    }

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
        div.tabs {
            div.fen {
                width: 100%;
                margin-top: 8px;
            }
        }
    }

</style>
