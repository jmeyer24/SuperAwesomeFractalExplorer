const path = require('path');

module.exports = {
    module: {
        rules: [
          {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
    optimization: {
        minimize: false
    },
    mode: "development",
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    devServer: {
        writeToDisk: true,
        contentBase: './dist',
        port: 8081,
        open: false

    },
};