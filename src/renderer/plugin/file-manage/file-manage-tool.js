import got from "got";
import fs from "fs";
import fileEncrypt from "../file-encrypt/file-encrypt";
import { notification } from "ant-design-vue";
import path from "path";
import stream from "stream";
import util from "util";

const pipeline = util.promisify(stream.pipeline);

export const download = async ({ url, filePath, progress, cancel }) => {
  return new Promise((resolve, reject) => {
    const reqStream = got
      .stream(url)
      .on("downloadProgress", data => {
        progress && progress(data);
      })
      .on("error", e => {
        console.error(e);
        reqStream.destroy();
        writeStream.destroy();
        reject(e);
      })
      .on("close", e => {
        reject("cancel");
      });
    cancel &&
      (cancel.cancel = () => {
        reqStream.destroy();
        writeStream.destroy();
      });
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on("finish", () => {
      resolve("success");
    });

    reqStream.pipe(writeStream);
  });
};

export const downloadFileDecrypt = async ({
  url,
  filePath,
  isEncrypt = false,
  progress,
  cancel,
}) => {
  return new Promise(async (resolve, reject) => {
    const result = { code: 0 };
    try {
      console.time("下载");
      const reqStream = await got.stream(url, { responseType: "buffer" });
      reqStream.on("downloadProgress", data => {
        progress && progress(data);
      });
      let bodybuffer = [];
      reqStream.on("data", chunk => {
        bodybuffer.push(chunk);
      });
      reqStream.on("error", e => {
        reqStream.destroy();
        reject(e);
      });
      reqStream.on("end", async () => {
        console.timeEnd("下载");
        try {
          const bufferStream = Buffer.concat([...bodybuffer]);
          console.time("解密");
          let decryptStream = isEncrypt
            ? await fileEncrypt.decryptFileBufferFromStream(bufferStream)
            : fileEncrypt.bufferToStream(bufferStream);
          console.timeEnd("解密");
          console.time("写文件");
          await pipeline(decryptStream, fs.createWriteStream(filePath));
          console.timeEnd("写文件");
          result.code = 1;
        } catch (error) {
          result.code = 0;
          console.dir(error);
          if (error === "cancel") {
            result.type = "cancel";
          } else {
            result.type = "DownloadErr";
          }
        } finally {
          reqStream.destroy();
        }
        if (result.code === 0) {
          reject(result);
        } else {
          resolve(result);
        }
      });
      cancel &&
        (cancel.cancel = () => {
          reqStream.destroy();
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const downloadFile = async ({
  url,
  filePath,
  progress,
  cancel,
  isEncrypt = false
}) => {
  const result = { code: 0 };
  const downloadPath = filePath + ".crdownload";
  let time = performance.now();
  try {
    await download({
      url,
      filePath: downloadPath,
      progress,
      cancel
    });
    /* loggger output */
    console.info({
      type: "file download",
      name: path.basename(filePath),
      time: `${performance.now() - time}ms`
    });
    time = performance.now();
    /* loggger output */

    let readerStream = isEncrypt
      ? await fileEncrypt.decryptFileBuffer(downloadPath)
      : fs.createReadStream(downloadPath);
    await pipeline(readerStream, fs.createWriteStream(filePath));

    /* loggger output */
    console.info({
      type: "file 解密+保存",
      name: path.basename(filePath),
      time: `${performance.now() - time}ms`
    });
    /* loggger output */

    console.time("decrypt-2!!!!!");
    result.code = 1;
  } catch (error) {
    result.code = 0;
    console.dir(error);
    if (error === "cancel") {
      result.type = "cancel";
    } else {
      result.type = "DownloadErr";
    }
  } finally {
    fs.promises.unlink(downloadPath).catch(e => {
      console.error(e);
    });
  }

  if (result.code === 0) {
    throw result;
  } else {
    return result;
  }
};

/**
 * 文件弹出窗公共样式
 */
const commonNotifyStyle = {
  width: "300px",
  marginLeft: `${335 - 300}px`
};

/**
 * 文件下载进度显示
 * @param {*} uuid
 * @param {*} fileName
 * @param {*} cancelHandle
 * @param {*} progress
 */
export const openDownLoadingNotify = (
  uuid,
  fileName,
  cancelHandle,
  progress,
  needCancel = true,
  notifyType = "download"
) => {
  let notifyMsg = "下载";
  if (notifyType == "upload") {
    notifyMsg = "上传";
  }
  notification.open({
    key: uuid,
    message: `文件${notifyMsg}`,
    description: h => {
      return h("p", [
        `正在${notifyMsg}`,
        h(
          "i",
          { style: { color: "#4498F0", "word-break": "break-all" } },
          fileName
        ),
        h("p", [progress || 0, "%"])
      ]);
    },
    style: { ...commonNotifyStyle },
    duration: 0,
    btn: h => {
      const element = needCancel
        ? h(
            "a-button",
            {
              props: { type: "link", size: "small" },
              on: {
                click: () => {
                  if(cancelHandle && cancelHandle.cancel){
                    cancelHandle.cancel();
                    notification.close(uuid);
                  }
                },
              },
            },
            "取消"
          )
        : "";
      return element;
    },
    onClose() {
      if(cancelHandle && cancelHandle.cancel){
        cancelHandle.cancel();
        notification.close(uuid);
      }
    },
  });
};

/**
 * 文件下载错误提示
 * @param {*} fileName
 */
export const openDownloadErrorNotify = fileName => {
  notification.warning({
    message: "文件下载",
    render: h => {
      return h("p", [
        h("b", { style: { "padding-right": "10px" } }, "下载失败"),
        fileName
      ]);
    },
    style: { ...commonNotifyStyle },
    duration: 1.5
  });
};

/**
 * 文件取消下载提示
 * @param {*} fileName
 */
export const openCancelDownloadNotify = fileName => {
  this.$notification.warning({
    message: "文件下载",
    description: h => {
      return h("p", [
        h("b", { style: { "padding-right": "10px" } }, "取消下载"),
        h(
          "b",
          {
            style: {
              color: "#4498F0",
              "word-break": "break-all",
              "font-weight": 400,
              "line-height": 1.5
            }
          },
          fileName
        ),
      ]);
    },
    style: { ...commonNotifyStyle },
    duration: 1.5,
    onClose() {
      try {
      } catch (error) {}
    }
  });
};

/**
 * blob类型转buff类型
 * @param {*} data
 */
export const blobToBuffer = data => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const buf = Buffer.from(e.target.result);
      resolve(buf);
    };
    reader.onerror = reject;

    reader.readAsArrayBuffer(data);
  });
};
