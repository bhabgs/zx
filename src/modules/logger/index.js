"use strict";

import utils from "../utils";
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const electron = utils.getElectron();
const app = electron.app;
const shell = electron.shell;
const isMainProcess = utils.isMainProcess();
const logSysName = isMainProcess ? "system" : "renderer";
const loggerPath = path.join(utils.appDataDir, "logs");
const ConfigPath = path.join(utils.appDataDir, "logs", "config.json");
const DefaultType = "log";
const appVersion = app.getVersion();
(() => {
  createLoggerFolder();
  createConfigFile();
  deleteAllOverdue();
})();

/**
 * @description 创建log文件夹
 */
function createLoggerFolder() {
  createFolder(loggerPath);
}

/**
 * @description 创建配置文件
 */
function createConfigFile() {
  try {
    createLoggerFolder();
    let isConfigExists = utils.fileExists(ConfigPath);
    if (isConfigExists) {
      // ....
    } else {
      fs.writeFileSync(ConfigPath, JSON.stringify({ day: 7 })); // 日志默认7天过期
    }
  } catch (error) {}
}

/**
 * @description 根据文件夹路径创建文件夹
 * @param {String} folderPath 文件夹路径
 */
function createFolder(folderPath) {
  try {
    if (!utils.dirExists(folderPath)) {
      utils.makeDir(folderPath);
    }
  } catch (error) {}
}

/**
 * @description 获取log配置
 */
function getLoggerConfig() {
  try {
    let content = fs.readFileSync(ConfigPath, { encoding: "utf-8" });
    content = JSON.parse(content);
    return content;
  } catch (error) {}
}

/**
 * @description 优化日志内容，加写入日期
 * @param {String} content 日志内容
 * @param {String} type 日志类型
 */
function formateLogContent({ content, type } = {}) {
  try {
    let time = moment().format("YYYY-MM-DD HH:mm:ss SSS");
    let log = { type, time, process: logSysName, version: appVersion, content };
    log = JSON.stringify(log);

    return `${log}\n`;
  } catch (error) {}
}

/**
 * @description 删除所有过期日志
 */
function deleteAllOverdue() {
  try {
    let loggerFolderList = fs.readdirSync(loggerPath);
    loggerFolderList.forEach(folder => {
      let folderPath = path.join(loggerPath, folder);
      deleteOverdue(folderPath);
    });
  } catch (error) {}
}

/**
 * @description 删除过期log文件夹
 * @param {String} logFolder log文件夹路径
 */
function deleteOverdue(logFolder) {
  try {
    let currentTime = Date.now();
    let loggerConfig = getLoggerConfig();
    let overdueTime = loggerConfig.day * 24 * 60 * 60 * 1000; // 过期时间
    let isFolderExists = utils.dirExists(logFolder);
    if (isFolderExists) {
      let logFiles = fs.readdirSync(logFolder);
      logFiles.forEach(file => {
        let filePath = path.join(logFolder, file);
        let fileInfo = fs.statSync(filePath);
        let fileCreateTime = new Date(fileInfo.ctime).getTime();
        let isOverdue = currentTime - fileCreateTime > overdueTime;
        isOverdue && fs.unlinkSync(filePath);
      });
    }
  } catch (error) {}
}

/**
 * @description 保存日志
 * @param {Object} option
 */
function saveLog({ type = DefaultType, content = "{}" } = {}) {
  try {
    let savePath = path.join(loggerPath, type);
    let time = moment().format("YYYY-MM-DD");

    createFolder(savePath);
    savePath = path.join(savePath, time);

    let isLogFileExists = utils.fileExists(savePath);
    let saveFunc = isLogFileExists ? fs.appendFileSync : fs.writeFileSync;
    saveFunc(savePath, content);
  } catch (error) {}
}

/**
 * @description 日志存储
 */
export default class Logger {
  constructor() {}

  /**
   * 设置日志存储时间
   * @param {Object} option 配置
   */
  static setConfig(option) {
    try {
      let day = option.day;
      let oldOpt = getLoggerConfig();
      let isValidOpt = utils.dataType(day) === "number";
      let newOpt = {};
      if (isValidOpt) {
        newOpt = { ...oldOpt, ...newOpt };
        newOpt = JSON.stringify(newOpt);
        fs.writeFileSync(ConfigPath, newOpt);
        deleteAllOverdue();
      } else {
        console.error("参数无效，日志存储设置失败");
      }
    } catch (error) {}
  }
  /**
   *
   * @param {String} content 日志内容
   */
  static warn(content) {
    let option = {
      type: "warn",
      content
    };

    option.content = formateLogContent(option);

    saveLog(option);
  }

  /**
   *
   * @param {String} content 日志内容
   */
  static error(content) {
    let option = {
      type: "error",
      content
    };

    option.content = formateLogContent(option);

    saveLog(option);
  }
  /**
   *
   * @param {String} content 日志内容
   */
  static log(content) {
    let option = {
      type: "log",
      content
    };

    option.content = formateLogContent(option);

    saveLog(option);
  }
  /**
   *
   * @param {String} content 日志内容
   */
  static info(content) {
    let option = {
      type: "info",
      content
    };

    option.content = formateLogContent(option);

    saveLog(option);
  }

  /* search(lookingForString) {

  } */
  /**
   * @description 打开日志存放文件夹
   */
  static open() {
    shell.openPath(loggerPath);
  }
}
