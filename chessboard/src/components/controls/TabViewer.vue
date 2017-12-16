<template>

    <div class="tab-viewer">
        <div class="headers">
            <div
                :class="{ 'header': true, 'active': index === activeTab }"
                v-for="(header, index) in headers"
                v-text="header"
                @click="activeTab = index"
            ></div>
        </div>
        <div class="bodies">
            <div
                :class="{ 'body': true, 'active': index === activeTab }"
                v-for="(comp, index) in bodies"
                v-show="index === activeTab"
                @click="activeTab = index"
            >
                <component
                    :is="comp"
                ></component>
            </div>
        </div>
    </div>

</template>

<script>

    export default {
        name: 'TabViewer',

        data() {
            return {
                activeTab: 0
            }
        },

        props: {
            headers: {
                type: Array,
                required: true
            },
            bodies: {
                type: Array,
                required: true
            }
        }
    }

</script>

<style lang="scss">
    @import '../../assets/style/_settings.scss';
    @import '../../assets/style/_standards.scss';

    div.tab-viewer {
        border: 1px solid #bfbfbf;
        background-color: #eaeaea;
        border: 1px solid #bfbfbf;
        box-sizing: border-box;
        
        div.headers {
            color: rgb(60, 80, 100);

            div.header {
                display: inline-block;
                width: 50%;
                min-width: 180px;
                height: 2rem;
                line-height: 2rem;
                text-align: center;
                box-sizing: border-box;
                user-select: none;

                &:not(.active) {
                    border-bottom: 1px solid #bfbfbf;
                    color: rgb(120, 130, 140);
                    background-color: #d8d8d8;

                    &:hover {
                        background-color: #ddd;
                    }
                }
                &:not(:first-of-type) {
                    border-left: 1px solid #bfbfbf;
                }
            }
        }
    }

</style>