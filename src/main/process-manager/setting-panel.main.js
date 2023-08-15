/*
 * @Author: lixiaowei
 * @Date: 2021-04-15 16:55:48
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-15 17:49:00
 * @Description: 设置面板
 * @FilePath: /zx-client-pc/src/main/process-manager/setting-panel.main.js
 */

const { ipcMain, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");

const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "setting-panel.html")
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/setting-panel.html`
    : formatUrl;

let win = null;

export function create() {
  if (win && !win.isDestroyed()) {
    win.show();
    return win;
  }

  win = new BrowserWindow({
    width: 500,
    height: 540,
    modal: true,
    frame: false,
    resizable: false,
    show: false,
    offscreen: true, // 是否绘制和渲染可视区域外的窗口
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  // for electron 12+ https://github.com/electron/electron/issues/23506
    }
  });
  require("@electron/remote/main").enable(win.webContents);
  if (global.debugMode) {
    win.webContents.openDevTools();
  }
  win.on("ready-to-show", () => {
    win.show();
  });

  win.loadURL(winURL);
}

export function show() {
  if (!win || win.isDestroyed()) {
    create();
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
}

export function close() {
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

export function send(channel, ...args) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

export default { create, show, close, send };
