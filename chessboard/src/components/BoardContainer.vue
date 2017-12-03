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
    }

</style>
