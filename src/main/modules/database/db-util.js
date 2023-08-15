const path = require("path");
const { app, remote } = require("electron");
import utils from "../../../modules/utils";

const App = process.type === "renderer" ? remote.app : app;

/**
 * 获取数据保存路径
 */
export const getSavePath = (dir = "") => {
  const savePath = path.join(utils.appDataDir, "databases", dir);
  return savePath;
};

/**
 * 创建数据保存路径
 */
export const createSavePath = (dir = "") => {
  const savePath = getSavePath(dir);
  if (!utils.dirExists(savePath)) {
    utils.makeDir(savePath);
  }
};
