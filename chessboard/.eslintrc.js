// https://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: true,
    },
    extends: 'airbnb-base',
    // required to lint *.vue files
    plugins: [
        'html'
    ],
    // check if imports actually resolve
    'settings': {
        'import/resolver': {
            'webpack': {
                'config': 'build/webpack.base.conf.js'
            }
        }
    },
    // add your custom rules here
    'rules': {
        // don't require .vue extension when importing
        'import/extensions': [
            'error',
            'always', {
                'js': 'never',
                'vue': 'never'
            }
        ],
        // allow optionalDependencies
        'import/no-extraneous-dependencies': [
            'error', {
                'optionalDependencies': ['test/unit/index.js']
            }
        ],
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'indent': ['error', 4],
        'no-trailing-spaces': 0,
        'semi': 0,
        'comma-dangle': 0,
        'linebreak-style': 0,
        'no-plusplus': 0,
        'curly': 0,
        'no-console': 0,
        'no-extend-native': 0,
        'no-else-return': 0,
        'arrow-parens': 0,
        'no-nested-ternary': 0,
        'no-continue': 0,
        'max-len': 0,
        'no-param-reassign': 0,
        'no-mixed-operators': 0,
        'no-restricted-syntax': 0,
        'no-prototype-builtins': 0,
        'func-names': 0,
        'prefer-arrow-callback': 0
    }
}
