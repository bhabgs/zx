"use strict";

import { arch, tmpdir } from "os";

import crypto from "crypto";
const fs = require("fs");
const path = require("path");
const packageJson = require("../../../package.json");

const platform = {
  win32: /^win/i.test(process.platform),
  darwin: /^darwin/i.test(process.platform),
  linux: /^linux/i.test(process.platform)
};

const tmpdirPath = tmpdir();

const isObject = obj => {
  return Object.prototype.toString.call(str) === "[object Object]";
};

/**
 * 判断文件是否存在
 * @param {String} filePath 文件路径
 */
const fileExists = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
};

/**
 * 判断本地磁盘文件夹是否存在
 * @param {string} filePath 本地磁盘文件夹路径
 */
const dirExists = filePath => {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
};

/**
 * 创建本地磁盘文件夹
 * @param {String} dir 本地磁盘文件夹路径
 */
const makeDir = dir => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * 删除文件夹及文件夹下的文件
 * @param {string} dir 文件夹路径
 * @param {Boolean} isDeleteDir 是否删除文件夹
 * @returns
 */
const emptyDir = (dir, isDeleteDir) => {
  if (!dir || !fs.existsSync(dir)) {
    return;
  }
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.resolve(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      emptyDir(filePath, true);
      return;
    }
    if (stat.isFile()) {
      fs.unlinkSync(filePath);
    }
  });
  if (isDeleteDir) {
    fs.rmdirSync(dir);
  }
};

/**
 * @description 获取electron对象
 */
 const getElectron = () => {
  if (isMainProcess()) {
    return require("electron");
  }
  return require('@electron/remote');
};

/**
 * @description 是否是主线程
 * @returns {Boolean}
 */
const isMainProcess = () => {
  const electron = require("electron");
  return electron.app ? true : false;
};

/**
 * @description 获取数据文件夹路径
 * @returns {String}
 */
const getAppDataDir = () => {
  const electron = getElectron();
  const app = electron.app;
  let dir = "";
  if (app) {
    const name = packageJson.name;
    dir = path.join(app.getPath("appData"), name);
  }

  return dir;
};
/**
 * @description 获取文件夹所有文件信息
 * @returns {Number}
 */
const getDirSize = (dir, ignoreList = []) => {
  let fileList = []; //需要清空的文件列表
  let files = []; //该文件夹下的所有文件
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    console.error(err);
  }
  files.forEach(file => {
    // ignoreList为删除时出错文件（无权限删除或当前运行时不可删除文件）首次清缓存时为空，再次清缓存时为删除时发生异常文件，不计入再次清缓存列表
    if (!ignoreList.includes(file)) {
      let filePath = path.join(dir, file);
      let fileInfo = null;
      try {
        fileInfo = fs.statSync(filePath);
      } catch (err) {
        // 如果读取不到文件信息则该文件不计入清除缓存列表
        console.error(err);
      }
      if (fileInfo) {
        if (fileInfo.isDirectory()) {
          let list = getDirSize(filePath);
          fileList = fileList.concat(list);
        } else {
          fileList.push(fileInfo);
        }
      }
    }
  });
  return fileList;
};
/**
 * @description 删除文件夹下所有文件
 * @returns {null}
 */
const delDir = (dir, delRoot) => {
  let files = [];
  let ignoreList = [];
  // 如果存在该文件夹才进行操作
  if (fs.existsSync(dir)) {
    try {
      files = fs.readdirSync(dir);
      files.forEach((file, index) => {
        let curPath = path.join(dir, file);
        if (fs.statSync(curPath).isDirectory()) {
          // 如果删除文件是文件夹
          delDir(curPath, true); //递归删除文件夹
        } else {
          try {
            fs.unlinkSync(curPath); //删除文件
          } catch (error) {
            // 如果删除出错则下次计算缓存文件大小时该文件不计入缓存文件
            ignoreList.push(file);
            console.error(error);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
    // 删除根文件夹
    if (delRoot) fs.rmdirSync(dir);
    return ignoreList;
  }
};

/**
 * 数据类型
 * @param {any} obj 数据
 * @returns boolean | string | number | array | undefined | null | function | object | regExp | date | set | map | html
 */
const dataType = obj => {
  let toString = Object.prototype.toString;
  let typeMap = {
    "[object Boolean]": "boolean",
    "[object String]": "string",
    "[object Number]": "number",
    "[object Array]": "array",
    "[object Undefined]": "undefined",
    "[object Null]": "null",
    "[object Function]": "function",
    "[object Object]": "object",
    "[object RegExp]": "regExp",
    "[object Date]": "date",
    "[object Set]": "set",
    "[object Map]": "map",
    "[object HTMLDivElement]": "html"
  };
  return typeMap[toString.call(obj)];
};

const appDataDir = getAppDataDir();

/**
 * 屏幕展示动画
 * 从屏幕边缘移入
 * @param {Object} win // 动画展示的窗口实例
 * @param {String} pos   // 屏幕进入的边缘，left，right，top，bottom
 * @param {Number} dist  // 移动距离
 * @param {Object} screen  // 屏幕信息
 */
const showWindowTranslate = (win, pos, dist, screen) => {
  switch (pos) {
    case "left":
      break;

    case "right":
      break;
    case "top":
      break;
    case "bottom":
      break;
  }
};

/**
 * 生成GUID
 */
function generateUUID() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  const result = `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;

  return result;
}

/**
 * 根据自定义生成ID
 * @param {String} zwj 自定义分隔符
 * @param {Number} size 生成位数，4个字符一位
 */
function getRandomId(zwj = "", size = 8) {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  const result = Array.from(new Array(size)).map(a => S4());

  return result.join(zwj);
}

/**
 * 程序类型
 * 3-64位window系统
 * 4-64位MacOS系统
 * 5-32位window系统
 */
const appType = platform.win32 ? (["ia32", "x32"].includes(arch()) ? 5 : 3) : 4;

const getHashUrl = remoteUrl => {
  const originUrl = remoteUrl.split("?")[0];
  const hash = crypto.createHash("sha256");
  hash.update(originUrl);
  const hashUrl = hash.digest("hex");

  return hashUrl;
};

const getFileNameByURL = remoteUrl => {
  const lastIndex = remoteUrl.lastIndexOf("/");
  let name = "";
  if (lastIndex !== -1) {
    name = remoteUrl.substr(lastIndex + 1);
  }
  return name;
};

/**
 * 判断系统临时路径下是否存在文件夹
 * @param {String} dir 临时文件夹下文件夹名称
 * @param {Boolean} mk 不存在时是否自动创建
 */
function tmpdirExists(dir, mk = false) {
  let localPath = path.join(tmpdirPath, packageJson.name, dir);
  let result = null;
  if (dirExists(localPath)) {
    result = localPath;
  } else {
    mk && makeDir(localPath) && (result = localPath);
  }
  return result;
}
/**
 * @description 重命名规则：末尾增加四位随机数，如果扔重复，最多再重复5次
 * @returns {Number}
 */
const _getDiffName = (sourceName, blackList) => {
  const MAX_TIME = 5; //最多重复5次
  let S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  let extName = path.extname(sourceName);
  let name = path.basename(sourceName, extName);
  let newName;
  for (let i = 0; i < MAX_TIME; i++) {
    newName = `${name}-${S4()}${extName}`;
    if (!blackList.includes(newName)) {
      break;
    }
  }
  return newName;
}
/**
 * @description 判断文件列表中是否有重名文件，如果有重命名文件修改对应的名字
 * @returns {Number}
 */
 const renameRepeatFile = (files = []) => {
  let fileList = files;
  let fileMap = {};
  for (let i = 0; i < fileList.length; i++) {
    let fileName = fileList[i].name;
    if (fileMap.hasOwnProperty(fileName)) {
      fileMap[fileName] = fileMap[fileName] + 1;
      fileList[i].needRename = true;
    } else {
      fileMap[fileName] = 1;
      fileList[i].needRename = false;
    }
  }
  let noRepeat = Object.keys(fileMap);
  for (let i = 0; i < fileList.length; i++) {
    let file = fileList[i];
    if (file.needRename) {
      let newName = _getDiffName(file.name, noRepeat);
      noRepeat.push(newName);
      fileList[i].name = newName;
    }
    delete fileList[i].needRename;
  }
  return fileList;
};

export {
  platform,
  isObject,
  fileExists,
  dirExists,
  makeDir,
  emptyDir,
  getElectron,
  isMainProcess,
  appDataDir,
  dataType,
  showWindowTranslate,
  generateUUID,
  appType,
  getHashUrl,
  getFileNameByURL,
  tmpdirExists,
  getRandomId,
  renameRepeatFile
};

export default {
  platform, // 平台类型
  isObject, // 判断是否为对象
  fileExists, // 判断文件是否存在
  dirExists, // 判断文件夹是否存在
  makeDir, // 创建文件夹
  getElectron, // 获取electron
  isMainProcess,
  appDataDir, // 数据存放文件夹路径
  dataType, // 数据类型判断
  showWindowTranslate,
  generateUUID,
  getDirSize, //获取文件夹下所有文件
  delDir, //删除文件夹下所有文件
  appType,
  getHashUrl,
  getFileNameByURL,
  tmpdirExists,
  getRandomId,
  emptyDir, // 删除文件夹
  renameRepeatFile
};
