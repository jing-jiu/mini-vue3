const execa = require('execa')
const target = 'reactivity'
execa('rollup', [
        '-wc',
        '--environment',
        `TARGET:${target}`
    ], {
        stdio: 'inherit'
    }
)