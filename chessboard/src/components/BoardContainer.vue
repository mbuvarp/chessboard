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
        display: inline-block;
        padding: 6px;
        background-color: white;
        text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 16px 5px rgba(0, 0, 0, 0.42),
                    inset 0 0 2px rgba(0, 0, 0, 0.63);
        border-radius: 2px;
    }

</style>
