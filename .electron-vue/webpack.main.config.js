"use strict";

process.env.BABEL_ENV = "main";

const path = require("path");
const { dependencies } = require("../package.json");
const webpack = require("webpack");

const dotenvWebpack = require("dotenv-webpack");
const { dotenv } = require("../config/plugin.config");

let mainConfig = {
  entry: {
    main: path.join(__dirname, "../src/main/index.js")
  },
  externals: [...Object.keys(dependencies || {})],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        enforce: "pre",
        exclude: /node_modules/,
        use: {
          loader: "eslint-loader",
          options: {
            formatter: require("eslint-friendly-formatter")
          }
        }
      },
      {
        test: /\.js$/,
        use: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: "node-loader"
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 10,
            name: "appicon/[name].[ext]"
          }
        }
      },
      {
        test: /\.yml$/,
        loader: "yml-loader"
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== "production",
    __filename: process.env.NODE_ENV !== "production"
  },
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "../dist/electron")
  },
  plugins: [new dotenvWebpack(dotenv()), new webpack.NoEmitOnErrorsPlugin()],
  resolve: {
    extensions: [".js", ".json", ".node"]
  },
  target: "electron-main",
  stats: "verbose"
};

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== "production") {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      __static: `"${path.join(__dirname, "../static").replace(/\\/g, "\\\\")}"`
    })
  );
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === "production") {
  mainConfig.optimization = {};
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": '"production"'
    })
  );
}

module.exports = mainConfig;
