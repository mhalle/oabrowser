var path = require('path');
var fs = require('fs');
var nodeExternals = require('webpack-node-externals');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require("webpack");


var config = {
    devtool: "source-map",
    entry: {
        index: "./src/index"
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: "[name].bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.(es6|js)$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=650000&mimetype=image/svg+xml&name=fonts/[name].[ext]'
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=65000&mimetype=application/font-woff&name=fonts/[name].[ext]'
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=65000&mimetype=application/font-woff2&name=fonts/[name].[ext]'
            },
            {
                test: /\.[ot]tf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=65000&mimetype=application/octet-stream&name=fonts/[name].[ext]'
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=65000&mimetype=application/vnd.ms-fontobject&name=fonts/[name].[ext]'
            },
            {
                test: /\.html$/,
                // this strange configuration corrects for the fact that
                // 1. we have templates in a separate directory,
                // 2. ngtemplate-loader encodes full pathname into
                //    the template cache names. 
                // This trick strips off the prefix, then adds a normalized 
                // one back.
                loader: 'ngtemplate?relativeTo=ng-templates/&prefix=ng-templates/!html'
            },
            {
                test: /\.css$/,
                // loader: "style-loader!css-loader",
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
        ]
    },
    resolve: {
        extensions: ['', '.js', '.es6']
    },
    plugins: [
        new ExtractTextPlugin("[name].css"),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            THREE: "three",
        })
    ]
}

var nodeConfig = Object.assign({}, config, {
    target: 'node',
    externals: nodeExternals(),
    output: {
        path: path.join(__dirname, 'build'),
        filename: "[name]-node.bundle.js"
    },
});

module.exports = [config];