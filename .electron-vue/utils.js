const glob = require("glob");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const json2yaml = require("json2yaml");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const packageJson = require("../package.json");
const PAGE_PATH = path.resolve(__dirname, "../src/renderer/pages");

const MODE = process.env.MODE_ENV;

/* 存储数据使用变量 */
let packageOrigin = null; // package.json 文件原始数据
/* 存储数据使用变量 END */

exports.entries = () => {
  const entryFiles = glob.sync(`${PAGE_PATH}/*/*.js`);

  const entryMap = {};
  const htmlPlugin = [];
  const config = {
    filename: "index.html",
    template: path.resolve(__dirname, "../src/index.ejs"),
    templateParameters(compilation, assets, options) {
      return {
        compilation,
        webpack: compilation.getStats().toJson(),
        webpackConfig: compilation.options,
        htmlWebpackPlugin: {
          files: assets,
          options
        },
        process
      };
    },
    minify: {
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true
    },
    isProd: process.env.MODE_ENV == "pre" || process.env.MODE_ENV == "prod",
    nodeModules:
      process.env.NODE_ENV !== "production"
        ? path.resolve(__dirname, "../node_modules")
        : false
  };

  entryFiles.forEach(filePath => {
    const filename = filePath.substring(
      filePath.lastIndexOf("/") + 1,
      filePath.lastIndexOf(".")
    );

    entryMap[filename] = filePath;
    htmlPlugin.push(
      new HtmlWebpackPlugin({
        ...config,
        filename: `${filename}.html`,
        chunks: [filename]
      })
    );
  });

  return { entryMap, htmlPlugin };
};

exports.htmlPlugin = () => {
  let entryHtml = glob.sync(P);
};

/**
 * 打包时改变版本号，增加环境标识
 * @param handle 操作类型，modify--修改，restore--还原
 */
const EnvMap = new Map();
EnvMap.set("dev", "-develop");
EnvMap.set("test", "-test");
EnvMap.set("pre", "-stage");
EnvMap.set("prod", "");

const SuffixMode = ['test', 'dev']; // 打包时需要添加环境后缀，独立于其余环境安装

const SUFFIX = packageJson.name.replace("zhixin", "");
exports.changeVersionAddEnv = async (handle = "modify") => {
  let data = null;
  let ymlData = null;
  const ymlUrl = path.resolve(__dirname, "..", "electron-builder.yml");
  let appIdList = null;
  let version = packageJson.version;
  EnvMap.forEach(name => (version = version.replace(name, "")));
  // 如果是测试环境读取electron-builder
  // if (SuffixMode.includes(MODE) || !MODE) {
  //   let content = fs.readFileSync(ymlUrl, { encoding: "utf8" });
  //   ymlData = yaml.load(content);
  //   appIdList = ymlData.appId.split(".");
  // }
  switch (handle) {
    case "modify":
      packageOrigin = packageJson;

      data = {
        ...packageJson,
        version: `${version}${EnvMap.get(MODE)}`
      };
      // if (SuffixMode.includes(MODE) || !MODE) {
      //   ymlData.productName = ymlData.productName + SUFFIX;
      //   ymlData.nsis.shortcutName = ymlData.nsis.shortcutName + SUFFIX;
      //   ymlData.appId = [appIdList[0] + SUFFIX, ...appIdList.slice(1)].join(".");
      // }

      break;

    case "restore":
      data = {
        ...packageJson,
        version
      };
      // if (SuffixMode.includes(MODE) || !MODE) {
      //   ymlData.productName = ymlData.productName.replace(SUFFIX, "");
      //   ymlData.nsis.shortcutName = ymlData.nsis.shortcutName.replace(
      //     SUFFIX,
      //     ""
      //   );
      //   ymlData.appId = [
      //     appIdList[0].replace(SUFFIX, ""),
      //     ...appIdList.slice(1)
      //   ].join(".");
      // }
      break;
  }
  const url = path.resolve(__dirname, "..", "package.json");
  await fs.promises.writeFile(
    url,
    Buffer.from(JSON.stringify(data, null, "  ") + "\n", "utf-8")
  );
  // 如果是测试环境会写
  // if (SuffixMode.includes(MODE) || !MODE) {
  //   await fs.promises.writeFile(
  //     ymlUrl,
  //     Buffer.from(json2yaml.stringify(ymlData), "utf-8")
  //   );
  // }
};
