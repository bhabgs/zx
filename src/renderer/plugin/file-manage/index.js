"use strict";
import path from "path";
import { ipcRenderer, shell } from "electron";
import fs, { mkdir } from "fs";
import { notification, message } from "ant-design-vue";
const archiver = require("archiver");
import os from "os";

import {
  downloadFile as downloadTool,
  downloadFileDecrypt,
  openCancelDownloadNotify,
  openDownloadErrorNotify,
  openDownLoadingNotify,
  blobToBuffer
} from "./file-manage-tool";
import {
  getHashUrl,
  fileExists,
  dirExists,
  makeDir,
  appDataDir,
  emptyDir,
  tmpdirExists,
  renameRepeatFile,
  generateUUID
} from "../../../modules/utils";
import FileCacheClass from "./file-cache";
import FileEncrypt from "../file-encrypt/file-encrypt";
import utils from "../utils";
import service from "../../service";
import Logger from "../../../modules/logger";

let tmpUploadDir = tmpdirExists("upload", true);

const QueueMap = new Map();

export default class FileManage {
  static async downloadFile(
    {
      url,
      name,
      isBlob = false,
      isLocal = false,
      isEncrypt = false,
      sign = false,
      allowCancel = true
    },
    data
  ) {
    const type_source = url || name;
    let type = path.extname(type_source).replace(".", "");
    type.includes("?") && (type = type.slice(0, type.indexOf("?")));

    const filters = [];

    if (type) {
      // 有数据类型增加类型筛选
      filters.push({ name: `.${type}`, extensions: [type] });
    }
    const selected = await ipcRenderer.invoke("save-dialog", {
      name,
      filters
    });
    const onlySelectSave = isBlob || isLocal;

    const returnData = { code: 0 };

    if (selected.canceled) {
      message.info("取消下载");
      returnData.type = "cacel";
      return;
    }

    const filePath = selected.filePath;
    returnData.filePath = filePath;
    const fileName = path.basename(filePath); // 获取保存时的真实文件名
    if (onlySelectSave) {
      let buf = data;
      if (isBlob) {
        buf = await blobToBuffer(data);
      }
      const downloadPath = filePath;

      const write = await fs.promises.writeFile(downloadPath, buf);
      message.success(`${fileName} 下载成功`);
      returnData.code = 1;
    } else {
      const uuid = utils.getRandomId("", 2); // 生成此次处理进程的唯一标识
      try {
        let signUrl = sign ? await service.getSignedUrlByOss({ url }) : url;
        const cancelHandle = {};
        openDownLoadingNotify(uuid, fileName, cancelHandle, 0, allowCancel);
        // 进度回调函数
        const progressHandle = data => {
          const { percent, transferred, total } = data;
          const progress = Math.floor(percent * 100);
          openDownLoadingNotify(uuid, fileName, cancelHandle, progress, progress >= 100 ? false : allowCancel);
        };

        await downloadTool({
          url: signUrl,
          filePath,
          progress: progressHandle,
          cancel: cancelHandle,
          isEncrypt
        });
        returnData.code = 1;
        message.success(`${fileName} 下载成功`);
      } catch (error) {
        returnData.code = 0;
        returnData.error = error;
        returnData.type = error.type;
        console.dir(error);
        if (error.type === "cancel") {
          message.info(`${fileName} 取消下载`);
        } else {
          message.error(`${fileName} 下载失败`);
        }
      }
      notification.close(uuid);
    }

    return returnData;
  }

  /**
   * fileList 批量下载的文件列表
   * name 重命名的压缩文件，或者目录文件名
   * allowCancel 是否允许取消
   * downloadType zip表示下载打成压缩包，folder表示直接下载文件夹
   * showAsOneFile true表示进度条只展示最终文件夹或压缩文件的名称；false表示逐一展示下载文件的名称
   */
  static async downloadFileBatch({
    fileList,
    name = "批量文件下载",
    allowCancel = true,
    downloadType = "zip",
    showAsOneFile = true,
  }) {
    let returnData = { code: 0 };
    const selected = await ipcRenderer.invoke("save-dialog", {
      name: name || "批量文件下载",
      filters: [
        downloadType == "folder" ? {} : { name: `.zip`, extensions: ["zip"] },
      ],
    });
    const lastFilePath = selected.filePath;
    let lastFileName = path.basename(lastFilePath)
    // 可能存在同时批量下载多个文件夹，因此此处也需要多个
    const saveTempPath = path.join(appDataDir, "fileTemp", `batchDownloadTemp-${generateUUID()}`);
    if (!dirExists(saveTempPath)) {
      // 不存在临时文件夹就创建一个
      makeDir(saveTempPath);
    } else {
      // 存在就清空
      emptyDir(saveTempPath, false);
    }
    returnData.filePath = lastFilePath;
    if (selected.canceled) {
      message.info("取消下载");
      returnData.type = "cacel";
      return;
    }

    const cancelHandle = {};
    
    // 如果没有fileSize字段，则默认给一个默认大小1000；无此字段认为文件大小相同
    let getSize = (file)=>parseInt(file && file.fileSize || 1000);
    fileList = renameRepeatFile(fileList);
    let totalSize = fileList.map(item => getSize(item)).reduce((prev, next) => {
      return prev + next;
    }, 0); // 记录全部文件大小
    let uuid = utils.getRandomId("", 2); // 生成此次处理进程的唯一标识
    let downloadTotalSize = 0;// 记录已经下载文件的大小
    for (let i = 0; i < fileList.length; i++) {
      if(!showAsOneFile){
        uuid = utils.getRandomId("", 2); // 生成此次处理进程的唯一标识
      }
      try {
        const file = fileList[i];
        let currentSize = getSize(file);//记录当前文件的大小
        openDownLoadingNotify(uuid, showAsOneFile ? lastFileName : file.name, cancelHandle, showAsOneFile ? Math.floor(downloadTotalSize * 100.0/totalSize) : 0, allowCancel);
        const progressHandle = data => {
          const { percent, transferred, total } = data;
          let progress;
          if(showAsOneFile){
            progress = Math.floor((downloadTotalSize + percent * currentSize) * 100.0 / totalSize);
          }
          else{
            progress = Math.floor(percent * 100);
          }
          openDownLoadingNotify(uuid, showAsOneFile ? lastFileName : file.name, cancelHandle, progress, progress >= 100 ? false : allowCancel);
        };
        const filePath = path.join(saveTempPath, `${file.name}`);
        let signUrl = file.sign
          ? await service.getSignedUrlByOss({ url: file.url })
          : file.url;
        const req = await downloadFileDecrypt({
          url: signUrl,
          isEncrypt: file.isEncrypt,
          filePath,
          progress: progressHandle,
          cancel: cancelHandle,
        });
        // 最后一个文件才置成100%；
        downloadTotalSize += currentSize;
        if(showAsOneFile == true && fileList.length - 1 == i || showAsOneFile == false){
          progressHandle({ percent: 100 });
          notification.close(uuid);
        }
      } catch (error) {
        message.error(`下载失败, 请稍后重试`);
        returnData.code = 0;
        returnData.error = error;
        notification.close(uuid);
        break;
      } 
    }
    return new Promise((resolve, reject) => {
      if (downloadType == "folder") {
        try {
          if (!dirExists(lastFilePath)) {
            // 不存在目标文件夹就创建一个
            makeDir(lastFilePath);
          }
          let lastOutput;
          let lastFileName = fileList[fileList.length - 1].name;
          Promise.all(
            fileList.map(async (item) => {
              let source = path.join(saveTempPath, `${item.name}`);
              let target = path.join(lastFilePath, `${item.name}`);
              let curOutput = fs.createWriteStream(target);

              if (item.name == lastFileName) {
                lastOutput = curOutput;
              }
              return await fs.createReadStream(source).pipe(curOutput);
            })
          );
          lastOutput.on("close", function () {
            emptyDir(saveTempPath, true);
            returnData.code = 1;
            message.success("批量下载完成");
            resolve(returnData);
          });

        } catch (err) {
          returnData.code = 0;
          returnData.err = err;
          message.error("批量下载失败");
          reject(returnData);
        }
      } else {
        const output = fs.createWriteStream(lastFilePath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });
        output.on("close", function () {
          emptyDir(saveTempPath, true);
          returnData.code = 1;
          message.success("批量下载完成");
          resolve(returnData);
        });

        archive.on("error", function (err) {
          returnData.code = 0;
          returnData.err = err;
          message.error("批量下载失败");
          reject(returnData);
        });

        archive.pipe(output);

        archive.directory(saveTempPath, false).finalize();
      }
    });
  }

  static async cacheFile({ url, name, isEncrypt, progress }) {
    const hashUrl = getHashUrl(url);
    let openResult = {};
    try {
      // 获取是否缓存
      let dbresult = await ipcRenderer.invoke("db-get-data", {
        db: "fileCache",
        key: hashUrl
      });
      let filePath;
      if (dbresult.code === 0 || !fileExists(dbresult.data.filePath)) {
        const result = await FileCacheClass.cacheFile2TempPath({
          url,
          name,
          isEncrypt
        });
        filePath = result.filePath;
      } else {
        filePath = dbresult.data.filePath;
      }
      openResult.code = 1;
      openResult.localPath = filePath;
    } catch (error) {
      console.error(error);
      openResult = { code: 0, ...error };
    }
    if (openResult.code === 0) {
      return Promise.reject(openResult);
    } else {
      return openResult;
    }
  }

  /**
   * 根据 URL 缓存合并转发数据文件
   */
  static async saveCombineFile(url) {
    const hash = getHashUrl(url);
    const signURL = await service.getSignedUrlByOss({ url });
    makeDir(path.join(appDataDir, "combineMsg"))
    const filePath = path.join(appDataDir, "combineMsg", hash);
    await downloadFileDecrypt({
      url: signURL,
      isEncrypt: false,
      filePath
    });
  }

  /**
   * 远程文件预览
   */
  static async openRemoteFile({ url, name, isEncrypt, sign = false }) {
    const hashUrl = getHashUrl(url);
    let openResult = {};
    if (!QueueMap.has(hashUrl)) {
      QueueMap.set(hashUrl, { url, name, hashUrl });
      try {
        // 获取是否缓存
        let dbresult = await ipcRenderer.invoke("db-get-data", {
          db: "fileCache",
          key: hashUrl
        });
        let filePath;
        if (dbresult.code === 0 || !fileExists(dbresult.data.filePath)) {
          let signUrl = sign ? await service.getSignedUrlByOss({ url }) : url;
          const result = await FileCacheClass.cacheFile2TempPath({
            url: signUrl,
            name,
            isEncrypt
          });
          filePath = result.filePath;
        } else {
          filePath = dbresult.data.filePath;
        }
        openResult.code = (await shell.openPath(filePath)) == "" ? 1 : 0;
        if (openResult.code === 1) openResult.localPath = filePath;
      } catch (error) {
        console.error(error);
        openResult = { code: 0, ...error };
      } finally {
        QueueMap.delete(hashUrl);
      }
    } else {
      openResult = {
        code: 0,
        type: "opening",
        message: "已有相同文件正在打开"
      };
    }

    return openResult;
  }

  static async openLocalPath({ localPath, operate }) {
    let result = { code: 0 };
    if (localPath) {
      if (fileExists(localPath) || dirExists(localPath)) {
        operate === 1
          ? shell.openPath(localPath)
          : shell.showItemInFolder(localPath);

        result.code = 1;
      } else {
        result.type = "OpenError";
        result.message = "路径不存在";
      }
    }

    return result;
  }

  static async uploadFile({ localPath, isEncrypt, folder, isPub } = {}) {
    const uuid = utils.getRandomId("", 2); // 生成此次处理进程的唯一标识
    try {
      console.time("upload");
      const type = path.extname(localPath).replace(".", "");
      const name = path.basename(localPath);
      let filePath = localPath;
      let isRm = false; // 是否在上传完成后删除本地文件
      let fileInfo = await fs.promises.stat(filePath);
      if (isEncrypt) {
        console.time("encrypt!");
        const t1 = performance.now();
        filePath = await FileEncrypt.encryptFileBuffer(localPath, {});

        /* loggger output */
        console.info({
          type: "file 加密",
          name: path.basename(filePath),
          time: `${performance.now() - t1}ms`
        });
        /* loggger output */

        isRm = true; // 解密后使用的是临时文件路径，所以上传完成后进行清理是否硬盘空间
        console.timeEnd("encrypt!");
      }
      openDownLoadingNotify(uuid, name, {}, 0, false, "upload");
      const progressHandle = data => {
        const { percent, transferred, total } = data;
        const progress = Math.floor(percent * 100);
        openDownLoadingNotify(uuid, name, {}, progress, false, "upload");
      };
      const t2 = performance.now();
      const result = await service.ossUploadAli(filePath, {
        type,
        folder,
        isPub,
        progress: progressHandle
      });
      progressHandle({ percent: 100 });
      /* loggger output */
      console.info({
        type: "file 上传oss",
        name: path.basename(filePath),
        time: `${performance.now() - t2}ms`
      });
      /* loggger output */

      console.log("fileData upload sucess ", result);
      isRm && fs.promises.unlink(filePath);
      const { name: ossName, url, bucket, folder: folderName } = result || {};
      const returnData = {
        ossName,
        url,
        name,
        type,
        size: fileInfo.size,
        bucket,
        folder: folderName,
        isEncrypt,
        isPub
      };
      console.timeEnd("upload");
      return returnData;
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    } finally {
      notification.close(uuid);
    }
  }

  static getDefaultFilePath(dir, name, extension) {
    if (typeof extension == "undefined") {
      extension = name.slice(name.lastIndexOf("."));
      name = name.slice(0, -extension.length);
    } else {
      name.lastIndexOf(extension) !== -1 &&
        (name = name.slice(0, -extension.length));
    }
    let filePath = path.join(dir, name + extension);
    if (!fileExists(filePath)) {
      return filePath;
    }
    let suffix = 1;
    do {
      filePath = path.join(dir, `${name}(${suffix})${extension}`);
      suffix++;
      if (suffix > 200) {
        break;
      }
    } while (fileExists(filePath));
    return filePath;
  }
}
