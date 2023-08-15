const request = require("request");
const fs = require("fs");
import moment from "moment";
const { ipcRenderer } = require("electron");
const remote = require('@electron/remote');
const { dialog } = remote;
const path = require("path");

const emptyFn = new Function();


// 查找可用的文件或文件夹名称，待优化
async function findPath({ path, name, extension }) {
  if (typeof extension == "undefined") {
    extension = name.slice(name.lastIndexOf("."));
    name = name.slice(0, -extension.length);
  }
  if (!fs.existsSync(path + "/" + name + extension)) {
    return path + "/" + name + extension;
  }
  let suffix = 1;
  while (fs.existsSync(path + "/" + name + "-" + suffix + extension)) {
    suffix++;
  }
  return path + "/" + name + "-" + suffix + extension;
}

async function filedownload({ url, path }) {
  return new Promise(function(resolve, reject) {
    try {
      if (url.includes("data:")) {
        const base64Data = url.replace(/^data:\w+\/\w+;base64,/, "");
        const dataBuffer = Buffer.from(base64Data, "base64");
        const write = fs.createWriteStream(path);
        write.write(dataBuffer);
        write
          .on("error", e => {
            resolve(false);
          })
          .on("finish", () => {
            resolve(true);
          });
        write.end();
      } else {
        const req = request(url);

        const write = fs.createWriteStream(path);
        // write.pipe(req)
        req.pipe(write);

        req
          .on("response", data => {})
          .on("error", e => {
            resolve(false);
          })
          .on("end", () => {
            resolve(true);
          });
      }
    } catch (error) {
      reject(error);
    }
  });
}

class FileManager {
  static async download({
    size,
    url,
    name,
    filters = [],
    //    progress = emptyFn,
    success = emptyFn,
    error = emptyFn,
    cancel = emptyFn
  }) {
    let received_bytes = 0; // 已经接收到的字节
    let total_bytes = size; // 总字节数
    try {
      let path,
        result = {
          mes: "",
          type: "success"
        };
      let chosedPath;
      if (url instanceof Array) {
        path = await dialog.showOpenDialog({
          filters,
          properties: ["openDirectory"]
        });

        if (path.canceled) {
          cancel({ canceled: true });
          return new Error("cancel save");
        }

        chosedPath = path.filePaths[0];

        if (url.length === 1) {
          let p = await findPath({
            path: chosedPath,
            name: url[0].name,
            extension: url[0].extension
          });

          result.type = await filedownload({
            url: url[0].url,
            path: p
          });
          if (result.type) {
            result.mes = "下载成功";
          }
        } else {
          let planName = name ? name : moment().format("YYYY-MM-DD");
          let p = await findPath({
            path: chosedPath,
            name: planName,
            extension: ""
          });
          fs.mkdirSync(p);
          let success = 0,
            failed = 0;
          for (let i = 0; i < url.length; i++) {
            let value = await filedownload({
              url: url[i].url,
              path: p + "/" + url[i].name
            });
            value ? success++ : failed++;
          }
          if (success > 0) {
            result.type = true;
            result.mes = `${success}个成功，${failed}个失败`;
          } else {
            result.type = false;
          }
        }
      } else {
        path = await dialog.showSaveDialog({
          filters,
          defaultPath: name
        });
        if (path.canceled) {
          cancel({ canceled: true });
          return new Error("cancel save");
        }
        chosedPath = path.filePath;
        result.type = await filedownload({
          url,
          path: chosedPath
        });
        if (result.type) {
          result.mes = "下载成功";
        }
      }

      if (result.type) {
        success(result.mes, chosedPath);
      } else {
        error();
      }
    } catch (error) {
      error(error);
    }
  }
}

export default FileManager;
