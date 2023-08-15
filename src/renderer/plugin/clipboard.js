/*
 * @Author: lixiaowei
 * @Date: 2020-11-16 16:03:14
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-11-19 11:59:07
 * @Description: 剪切板处理
 * @FilePath: /zx-client-pc/src/renderer/plugin/clipboard.js
 */

import { clipboard, ipcRenderer } from "electron";
import { localImgToThumbnail } from "../../lib/utils";
import moment from "moment";
import { MessageBox } from "element-ui";

const { platform } = process;

const ProcessUtil = {
  readFile(formats) {
    // 文件处理
    // 获取复制的文件路径
    const filePath = platform.includes("win32")
      ? clipboard
          .readBuffer("FileNameW")
          .toString("ucs2")
          .replace(new RegExp(String.fromCharCode(0), "g"), "")
      : decodeURIComponent(clipboard.read("public.file-url")).replace(
          "file://",
          ""
        );
    let result;
    if (filePath) {
      result = [{ type: "file", content: { filePath } }];
    } else if (platform.includes("darwin") && formats.length === 1) {
      /**
       * 如果路径为空，并且formats有一个值
       * 为macOS平台时复制过个文件的处理，因formats为text/plain与复制纯文本冲突
       * 所以路径为空时调用一次复制文本的方法
       */
      result = ProcessUtil.readTextOrHtml(formats);
    }

    return result;
  },
  /**
   * 文本或HTML
   */
  readTextOrHtml(formats) {
    let text = clipboard.readText("clipboard");
    let html = clipboard.readHTML("clipboard");
    let result = [];
    if (text) {
      result.push({ type: "text", content: text });
    }
    if (html) {
      result.push({ type: "html", content: html });
    }

    return result;
  },
  /**
   * 读取图片类型处理
   */
  async readImage(formats, { formatName = false, thumb } = {}) {
    let image = clipboard.readImage("clipboard");
    let imgToPng = image.toPNG({ scaleFactor: 1 });
    let result;
    if (!imgToPng.length && platform.includes("darwin")) {
      result = ProcessUtil.readFile(formats); // 针对MacOS系统做文件复制特殊处理
    } else if (!imgToPng.length) {
      result = ProcessUtil.readTextOrHtml(formats);
    } else {
      let type = { ext: "png", mime: "image/png" };
      let name = clipboard.readText("clipboard");
      name = name || moment().format("YYYY-MM-DD-HHmmss");
      formatName && (name = name.replace(/\s/gi, "").substr(0, 20)); // 过滤文件名中的空格，并控制文件名长度，主要为图片、文字多格式
      let suffix = `.${type.ext}`;
      !name.endsWith(suffix) && (name += suffix);
      let data = {
        buffer: imgToPng,
        name,
        type: type.ext,
        mime: type.mime,
        size: imgToPng.length
      };

      if (thumb) {
        let base64Res = await localImgToThumbnail(Buffer.from(imgToPng), 10000);
        data.thumbnail = base64Res.base64;
        data = {
          ...data,
          ...base64Res
        };
      }

      result = [{ type: "image", content: data }];
    }

    return result;
  },
  /**
   * 用户选择保存图片还是文字
   * @param {*} formats
   * @param {*} readimg
   */
  async readImageOrText(formats, readimg, option = {}) {
    let img = readimg.toDataURL();
    let result = [];
    try {
      let selected = await MessageBox({
        title: "选择粘贴的形式",
        message: `<div class="show-img-box"><img src="${img}" /></div>`,
        dangerouslyUseHTMLString: true,
        customClass: "select-paste-type-modal",
        showClose: true,
        distinguishCancelAndClose: true,
        showCancelButton: true,
        cancelButtonText: "保留文字",
        confirmButtonText: "转为图片"
      });
      result = await ProcessUtil.readImage(formats, {
        ...option,
        formatName: true
      });
    } catch (e) {
      if (e === "cancel") {
        result = ProcessUtil.readTextOrHtml();
      }
    }

    return result;
  }
};

export default class ClipboardJS {
  static async readData(option) {
    option = option || { selectImgOrText: false, thumb: false };
    const { selectImgOrText, thumb } = option;

    const formats = clipboard.availableFormats("clipboard");
    const formatStr = formats.join("#").toLocaleLowerCase();
    let result;
    switch (true) {
      case !formatStr.length:
      case formatStr.includes("file"):
      case formatStr.includes("text/uri-list") && !formatStr.includes("image/"):
        // 文件
        result = ProcessUtil.readFile(formats);
        break;

      case (formatStr.match(/text\//g) || []).length > 1 &&
        formatStr.includes("image/"):
        // 图片或文字两种格式可选
        let readimg = clipboard.readImage("clipboard");
        if (readimg.isEmpty()) {
          result = ProcessUtil.readTextOrHtml(formats);
        } else if (selectImgOrText) {
          if (option.webcontentsId) {
            ipcRenderer.send("show-main-win");
          }
          result = ProcessUtil.readImageOrText(formats, readimg, option);
        } else {
          result = ProcessUtil.readTextOrHtml(formats) || [];
          let imgResult = await ProcessUtil.readImage(formats, {
            ...option,
            formatName: true
          });
          if (imgResult && imgResult.length) {
            result = result.concat(imgResult);
          }
        }
        break;

      case formatStr.includes("image/"):
        // 图片
        result = await ProcessUtil.readImage(formats, option);
        break;

      case formatStr.includes("text/html"):
      case formatStr.includes("text/plain"):
        // 文本
        if (
          formatStr.includes("text/plain") &&
          formats.length === 1 &&
          platform.includes("darwin")
        ) {
          // 针对MacOS复制多个文件时做处理
          // 这时的formats只有一个text/plain
          result = ProcessUtil.readFile(formats);
        } else {
          result = ProcessUtil.readTextOrHtml(formats);
        }
        break;
    }
    return result;
  }
}
