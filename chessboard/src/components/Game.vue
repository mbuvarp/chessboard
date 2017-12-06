<template>

    <div id="game">
        <section><board-container></board-container></section>
        <section><board-controls></board-controls></section>
    </div>

</template>

<script>
    import BoardContainer from './BoardContainer'
    import BoardControls from './BoardControls'

    export default {
        name: 'Game',
        
        components: {
            BoardContainer,
            BoardControls
        }
    };

</script>

<style lang="scss" scoped>

    div#game {
        height: 100%;
        text-align: center;
        padding: 36px;
        box-sizing: border-box;
        white-space: nowrap;

        section {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
    }

</style>
