<template>

    <div id="board-container">
        <board></board>
    </div>

</template>

<script>
    import Board from './Board'

    export default {
        name: 'BoardContainer',
        
        components: {
            Board
        }
    };

</script>

<style lang="scss" scoped>

    div#board-container {
        width: 90vmin;
        height: 90vmin;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.32);
        border-radius: 2px;
        box-sizing: border-box;
        overflow: hidden;
    }

</style>
