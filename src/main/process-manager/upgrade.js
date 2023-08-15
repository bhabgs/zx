/*
 * @Author: lixiaowei
 * @Date: 2021-01-04 21:13:45
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-27 16:31:53
 * @Description: 升级
 * @FilePath: /zx-client-pc/src/main/process-manager/upgrade.js
 */
import { ipcMain, BrowserWindow } from "electron";
import url from "url";
import path from "path";

let win;
const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "upgrade.html")
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/upgrade.html`
    : formatUrl;

function create({ url, closeOther = false }) {
  if (win && !win.isDestroyed()) {
    show();
    return;
  }
  win = new BrowserWindow({
    width: 421,
    height: 160,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  // for electron 12+ https://github.com/electron/electron/issues/23506
    },
    show: false
  });
  // win.openDevTools();

  require("@electron/remote/main").enable(win.webContents);
  if (global.debugMode) {
    win.webContents.openDevTools();
  }
  win.once("ready-to-show", () => {
    win.show();
    send("download", url);
  });

  win.loadURL(winURL);

  if (closeOther) {
    global.ZX_FOCUS_CLOSE_WIN_FLAG = true;

    BrowserWindow.getAllWindows().forEach((item) => {
      if (item.id !== win.id) {
        item.close();
      }
    });

    delete global.ZX_FOCUS_CLOSE_WIN_FLAG;
  }
}

function send(channel, ...args) {
  win.webContents.send(channel, ...args);
}

function show() {
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
}

function close() {
  win.close();
}

export default { create, send, show, close };
