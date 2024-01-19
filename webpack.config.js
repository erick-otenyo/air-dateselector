const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const NAME = "air-dateselector";

module.exports = function (env, argv) {
  const options = { mode: argv.mode };
  const dev = options.mode === "development";

  //  Plugins
  // -------------------------------------------------

  let plugins = [
    new webpack.DefinePlugin({
      "process.env": {},
    }),
    new HtmlWebpackPlugin({
      template: "./index-dev.html",
    }),
  ];

  let buildPlugins = [
    new MiniCssExtractPlugin({
      filename: `${NAME}.css`,
    }),
  ];

  let entry = {
    index: "./index-dev.js",
  };

  if (!dev) {
    entry.index = "./src/dateselector.js";
  }

  const config = {
    mode: options.mode,
    entry: entry,
    devtool: dev ? "eval-source-map" : false,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: dev ? "js/[name].js" : `${NAME}.js`,
      publicPath: "/",
      chunkFilename: "js/[name].js",
      library: dev ? undefined : "AirDateselector",
      libraryTarget: dev ? undefined : "umd",
      libraryExport: dev ? undefined : "default",
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)|dist/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: "defaults",
                    debug: true,
                    useBuiltIns: "usage",
                    corejs: 3,
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.scss$/,
          use: [
            dev ? "style-loader" : MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: { sourceMap: dev } },
            { loader: "postcss-loader", options: { sourceMap: dev } },
            { loader: "sass-loader", options: { sourceMap: dev } },
          ],
        },
      ],
    },
    resolve: {
      modules: [
        `${__dirname}/src/js`,
        `${__dirname}/src`,
        `${__dirname}/dist`,
        "node_modules",
      ],
    },
    plugins: dev ? plugins : buildPlugins,
  };

  if (dev) {
    config.devServer = {
      hot: true,
    };
  }

  return config;
};
