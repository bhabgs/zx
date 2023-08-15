import path, { resolve } from "path";
import { ipcRenderer, shell } from "electron";
import {
  getHashUrl,
  getFileNameByURL,
  dirExists,
  makeDir,
  appDataDir,
  fileExists
} from "../../../modules/utils";
import { downloadFile } from "./file-manage-tool";
/**
 * 获取文件临时数据保存路径
 */
const getSavePath = (dir = "") => {
  const savePath = path.join(appDataDir, "fileTemp", dir);
  return savePath;
};

/**
 * 创建数据保存路径
 */
const createSavePath = (dir = "") => {
  const savePath = getSavePath(dir);
  if (!dirExists(savePath)) {
    makeDir(savePath);
  }
  return savePath;
};
createSavePath();

const cachingHashMap = new Map();

export default class FileCache {
  static async cacheFile2TempPath({ url, name, progress, isEncrypt = false }) {
    const hash = getHashUrl(url);
    const savePath = createSavePath(hash);
    name = name || getFileNameByURL(url.split("?")[0]);
    const filePath = path.join(savePath, name);

    if (cachingHashMap.has(hash)) {
      return new Promise((resolve, reject) => {
        let flag = 0;
        let time = setInterval(() => {
          if (!cachingHashMap.has(hash) || flag > 60 * 10) {
            if (fileExists(filePath)) {
              resolve({ filePath });
            } else {
              reject();
            }
            clearInterval(time);
          }
        }, 1000);
      });
    }
    cachingHashMap.set(hash, true);

    try {
      let result = await downloadFile({ url, filePath, isEncrypt, progress });
      const data = { key: hash, value: { filePath, hash, name } };
      const saveState = await ipcRenderer.invoke("db-save-data", {
        db: "fileCache",
        data
      }); // 存储文件缓存信息
      console.log(saveState);
    } catch (error) {
      return Promise.reject(error);
    } finally {
      cachingHashMap.delete(hash);
    }

    return { filePath };
  }
}
