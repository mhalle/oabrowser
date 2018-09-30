const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var webpack = require("webpack");
const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
    devtool: "source-map",
    entry: { main: './src/index.js' },
    output: {
        path: path.join(__dirname, 'build'),
        filename: "[name].bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(es6|js)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts/'
                    }
                }]
            },
            {
                test: /\.html$/,
                // this strange configuration corrects for the fact that
                // 1. we have templates in a separate directory,
                // 2. ngtemplate-loader encodes full pathname into
                //    the template cache names. 
                // This trick strips off the prefix, then adds a normalized 
                // one back.
                use: [{
                  loader:'ngtemplate-loader?relativeTo=ng-templates/&prefix=ng-templates/' },
                  { loader: 'html-loader' }],
              },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader', MiniCssExtractPlugin.loader, 'css-loader'
                ],
              }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css'
          }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            THREE: "three",
        })
    ]
}

