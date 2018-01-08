<template>

    <div class="check-slide">
        <div :class="{ 'button': true, 'on': checked }" @click="checked = !checked"></div>
        <input type="checkbox" id="check" v-model="checked" :checked="value">
        <label for="check" :style="{ 'color': color }">
            {{ text }}
        </label>
    </div>

</template>
<script>
    export default {
        name: 'CheckSlide',
        props: {
            text: {
                type: String,
                default: ''
            },
            color: {
                type: String,
                default: '#454545'
            },
            value: {
                tyoe: Boolean,
                default: false
            }
        },
        data() {
            return {
                checked: false
            }
        },
        watch: {
            checked(value) {
                this.$emit('check', value)
            }
        }
    }
</script>
<style lang="scss" scoped>

    div.check-slide {
        position: relative;

        div.button {
            position: absolute;
            left: -4px;
            width: 18px;
            height: 18px;
            margin-top: 1px;
            border-radius: 50%;
            border: 1px solid black;
            box-shadow: 0 0 2px #aaa;
            background-color: white;
            transition: left 0.2s ease;

            &.on {
                left: 24px;
            }
        }
        input[type="checkbox"] {
            display: none;
        }
        label {
            user-select: none;

            &:before {
                content: '';
                display: inline-block;
                box-sizing: border-box;
                width: 42px;
                height: 18px;
                padding: 3px 0;
                margin: -3px 6px 0 0;
                vertical-align: middle;
                border-radius: 8px;
                border: 1px solid black;
                transition: background 0.2s ease;
                background: repeating-linear-gradient(
                    45deg,
                    #db553d,
                    #db553d 10px,
                    #ce391e 10px,
                    #ce391e 20px
                );
            }
        }
        input[type="checkbox"]:checked + label {
            &:before {
                background: repeating-linear-gradient(
                    45deg,
                    #6df273,
                    #6df273 10px,
                    #40d147 10px,
                    #40d147 20px
                );
            }
        }
    }

</style>