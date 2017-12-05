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
        width: 720px;
        height: 720px;
        margin-right: 36px;
        float: left;
        text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.5);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.32);
        border-radius: 2px;
        box-sizing: border-box;
        overflow: hidden;
    }

</style>
