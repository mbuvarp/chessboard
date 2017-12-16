<template>

    <div id="controls">
        <tab-viewer
            class="tab-viewer"
            :headers="['Game', 'Settings']"
            :bodies="[gameInfoComponent, gameSettingsComponent]"
        ></tab-viewer>
    </div>

</template>

<script>
    import GameInfo from './GameInfo'
    import GameSettings from './GameSettings'

    export default {
        name: 'BoardControls',
        
        components: {
            GameInfo
        },

        data() {
            return {
                gameInfoComponent: GameInfo,
                gameSettingsComponent: GameSettings
            }
        },
    }

</script>

<style lang="scss" scoped>

    @font-face {
        font-family: 'OpenSans-Regular';
        src: url('/static/fonts/OpenSans/OpenSans-Regular.ttf') format('truetype');        
    }

    div#controls {
        width: 440px;
        height: 90vh;
        margin-left: 36px;
        border-radius: 2px;
        box-sizing: border-box;
        font-family: 'OpenSans-Regular', arial, sans-serif;

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
        .tab-viewer {
            box-shadow: 0 1px 3px 0px rgba(0, 0, 0, 0.32);
        }
    }

</style>
