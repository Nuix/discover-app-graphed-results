const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: ['whatwg-fetch', './src/index.js'],
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] }, 
            { test: /\.(jpe?g|png|gif)$/i, loader: "file-loader" },
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            "$": "jquery",
            "jQuery": "jquery",
            "window.jQuery": "jquery"
        }),
    ]
};
