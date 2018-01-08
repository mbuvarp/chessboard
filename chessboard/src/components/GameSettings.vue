<template>
    <div id="game-settings">
        <ul>
            <li>
                <check-slide text="Show legal moves" value="legal" @check="checkLegal"></check-slide>
            </li>
        </ul>
    </div>
</template>

<script>    
    import { mapState, mapMutations } from 'vuex'

    export default {
        name: 'GameSettings',

        computed: {
            ...mapState({
                legal: state => state.options.highlight.legal
            })
        },

        methods: {
            checkLegal(value) {
                this.toggleHighlightLegal(value)
            },

            ...mapMutations([
                'toggleHighlightLegal',
                'toggleHighlightMove'
            ])
        }
    }
</script>

<style lang="scss" scoped>

    div#game-settings {
        ul {
            list-style-type: none;
            padding: 0;

            li {
                padding: 0 0 0 18px;
            }
        }
    }

</style>