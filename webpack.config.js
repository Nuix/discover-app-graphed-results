const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: ['whatwg-fetch', './src/index.js'],
    devServer: {
        index: 'index.html',
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: process.env.GRAPHED_RESULTS_PORT || 12345
    },
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
