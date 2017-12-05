<template>

    <div id="main">
        <div class="container">
            <board-container></board-container>
            <board-controls></board-controls>
        </div>
    </div>

</template>

<script>
    import BoardContainer from './BoardContainer'
    import BoardControls from './BoardControls'

    export default {
        name: 'Main',
        
        components: {
            BoardContainer,
            BoardControls
        }
    };

</script>

<style lang="scss" scoped>

    div#main {
        width: 100%;
        height: 100%;
        // background-color: burlywood;
        // background-image: linear-gradient(45deg, #c49f6d 25%, transparent 25%),
        //                   linear-gradient(-45deg, #c49f6d 25%, transparent 25%),
        //                   linear-gradient(45deg, transparent 75%, #c49f6d 75%),
        //                   linear-gradient(-45deg, transparent 75%, #c49f6d 75%);
        background-image: linear-gradient(#dbe0e0, #eaefef 10%, #f7fcfc);

        &:after {
            display: block;
        }

        .container {
            width: 80%;
            margin: 0 auto;
            padding-top: 24px;
        }
    }

</style>
