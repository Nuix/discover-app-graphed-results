const path = require('path');

module.exports = {
    mode: 'production',
    entry: ['whatwg-fetch', './src/index.js'],
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    }
};
