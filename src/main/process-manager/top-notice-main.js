const { ipcMain, BrowserWindow, screen } = require("electron");
const url = require("url");
const path = require("path");
import { baseViewOpt } from "../config";
import { platform, generateUUID } from "../../modules/utils";
import { crashHandle } from "./process-crash";

const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "top-notice.html")
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/top-notice.html`
    : formatUrl;

const winOpt = {
  ...baseViewOpt,
  x: 0,
  y: 0,
  width: 366,
  height: 146,
  minWidth: 366,
  minHeight: 146,
  maxWidth: 366,
  maxHeight: 146,
  show: false,
  modal: true,
  resizable: false, // 窗口是否可以改变尺寸
  minimizable: false, // 窗口是否可以最小化
  maximizable: false, // 窗口是否可以最大化
  focusable: true, // 窗口是否可以聚焦
  useContentSize: true, // width 和 height 将设置为 web 页面的尺寸(译注: 不包含边框), 这意味着窗口的实际尺寸将包括窗口边框的大小，稍微会大一点
  offscreen: true, // 是否绘制和渲染可视区域外的窗口
  movable: false,
  fullscreenable: false,
  alwaysOnTop: true,
  skipTaskbar: true
};

let topNoticeWin = null; // 强制通知窗口
let timeout = null; // 显示通知窗口定时
const tempList = new Map(); // 临时存储通知数据
const PromiseMap = new Map();
let closeTimeout = null; // 定时关闭
let canSend = false; // 是否可以发送数据，渲染进程是否已经准备好接收

/* 通知进程事件绑定 */

ipcMain.handle("top-notice", (evt, type, ...data) => {
  switch (type) {
    case "show": // 展示通知
      return showTopNotice(...data);

    case "closeIds": // 根据通知Id关闭通知
      topNoticeWin &&
        topNoticeWin.webContents &&
        topNoticeWin.webContents.emit("notice-pass", ...data);
      break;

    default:
      break;
  }
});

/* 通知进程事件绑定 END */

function showTopNotice(data) {
  const promise = new Promise((resolve, reject) => {
    const _uuid = generateUUID("-"); // 生成UUID作为本条通知的唯一标识
    data._uuid = _uuid;

    PromiseMap.set(_uuid, { resolve, reject, data });
    tempList.set(_uuid, data);
    clearTimeout(closeTimeout); // 清理定时关闭

    if (topNoticeWin && !topNoticeWin.isDestroyed()) {
      // 弹框实例存在并未被销毁
      if (canSend) {
        timeoutPush();
        topNoticeWin.show();
      }
    } else {
      // 不存在或被销毁，重建弹框
      initWindow(true);
    }
  });

  return promise;
}

function initWindow(isSend = false) {
  const displayInfo = screen.getPrimaryDisplay();
  const { width, height } = displayInfo.workArea;

  // 距离屏幕可用区域边缘20px
  winOpt.x = width - winOpt.width - 20;
  if (platform.win32) {
    // window窗口定位在右下角
    winOpt.y = height - winOpt.height - 20;
  } else {
    // Mac && Linux定位在右上角
    winOpt.y = 20;
  }
  topNoticeWin = new BrowserWindow(winOpt);
  require("@electron/remote/main").enable(topNoticeWin.webContents);

  crashHandle(topNoticeWin, { handle: "close" });

  topNoticeWin.loadURL(winURL);
  if (isSend) {
    // 初始化时需要发送通知内容
    topNoticeWin.webContents.on("can-send", () => {
      timeoutPush();
      topNoticeWin.show();
      canSend = true;
    });
  }

  topNoticeWin.on("close", event => {
    TopNotice.close();
  });

  topNoticeWin.on("closed", () => {
    topNoticeWin = null;
    canSend = false;
    clearPromiseMap();
  });

  topNoticeWin.webContents.on("destroyed", () => {
    topNoticeWin = null;
    canSend = false;
    clearPromiseMap();
  });

  /**
   * 弹框按钮处理
   */
  topNoticeWin.webContents.on("handle-notify", data => {
    const { uuids, type, has } = data;

    if (!has) {
      // 无通知时，隐藏弹框
      closeTimeout = setTimeout(() => {
        topNoticeWin.hide();
      }, 100);
    }

    uuids.forEach(uuid => {
      if (PromiseMap.has(uuid)) {
        // 存在promise实例
        const { resolve, reject } = PromiseMap.get(uuid);
        // 执行resolve
        resolve && resolve({ type });

        PromiseMap.delete(uuid);
      }
    });
  });

  return topNoticeWin;
}

function clearPromiseMap() {
  PromiseMap.forEach(value => {
    try {
      value.reject({ type: "clear" });
    } catch (error) {
      console.error(error);
    }
  });
  PromiseMap.clear();
  tempList.clear();
}

function timeoutPush(params) {
  clearTimeout(timeout);
  setTimeout(() => {
    const data = [...tempList.values()];
    tempList.clear();
    topNoticeWin.webContents.emit("push-notice", data);
  }, 300);
}

export default class TopNotice {
  /**
   * 关闭弹框
   */
  static close() {
    if (topNoticeWin && !topNoticeWin.isDestroyed()) {
      // 弹框实例存在并未被销毁
      topNoticeWin.hide();
    }
    clearPromiseMap();
  }
}
