<template>
    
    <div id="app">
        <router-view/>
    </div>

</template>

<script>

    export default {
        name: 'app',
    };

</script>

<style lang="scss" scoped>

    #app {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-image: linear-gradient(#dbe0e0, #eaefef 10%, #f7fcfc);
    }

</style>
