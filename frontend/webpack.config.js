const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './frontend/src/main.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/[name].[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  resolve: { extensions: ['.js', '.jsx'] },
  plugins: [new HtmlWebpackPlugin({ template: './frontend/public/index.html' })],
  devServer: { port: 8080, historyApiFallback: true, proxy: [{ context: ['/api'], target: 'http://localhost:8081' }] },
};
