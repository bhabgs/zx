const { app, ipcMain, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");
import { crashHandle } from "./process-crash";
import { baseViewOpt, mainViewOpt } from "../config";

const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "show-media.html")
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/show-media.html`
    : formatUrl;

const winOption = {
  ...baseViewOpt,
  ...mainViewOpt,
  maxHeight: undefined,
  maxWidth: undefined,
  show: false,
  modal: true,
  resizable: true,
  fullscreenable: false  
};

let win;

process.on("main-win-closed", (e) => {
  win && !win.isDestroyed() && win.close();
});
/**
 * 创建窗口
 */
function createWindow(send = false, data) {
  win = new BrowserWindow(winOption);
  require("@electron/remote/main").enable(win.webContents);

  if (global.debugMode) {
    win.webContents.openDevTools();
  }

  win.loadURL(winURL).then(() => {
    if (send) {
      win.webContents.send("send-message", data);
      win.show();
      win.setSkipTaskbar(false);
    }
  });

  win.on("closed", () => {
    win = null;
  });

  win.on("hide", () => {
    const openerWin = global.mediaOpenerWin;
    if(openerWin && !openerWin.isDestroyed() && openerWin.isVisible()) {
      openerWin.focus()
    }
  })

  win.on('close', (e) => {
    if (!global.realQuit) {
      e.preventDefault();
      win.hide();
      win.setSkipTaskbar(true);
    }
  });
}

export default function ShowMedia() {
  createWindow();
  ipcMain.handle("show-media", async (event, data) => {
    win.setOpacity(0);
    global.mediaOpenerWin = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      win.unmaximize();
      win.webContents.send("send-message", data);
      win.show();
      win.setSkipTaskbar(false);
      // win.openDevTools();
    } else {
      createWindow(true, data);
    }
  });
  ipcMain.on("setOpacity", () => {
    win.setOpacity(1);
  })

  return win;
}
