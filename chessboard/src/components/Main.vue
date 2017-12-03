<template>

    <div id="main">
        <board-container></board-container>
    </div>

</template>

<script>
    import BoardContainer from './BoardContainer'

    export default {
        name: 'Main',
        
        components: {
            BoardContainer
        }
    };

</script>

<style lang="scss" scoped>

    div#main {

    }

</style>
