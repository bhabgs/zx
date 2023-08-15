import { app, BrowserWindow, ipcMain, Menu, dialog, desktopCapturer, ipcRenderer, session, webRequest } from "electron";
require('@electron/remote/main').initialize()

const os = require("os");
const path = require("path");
const util = require("util");

const builderConfig = require("../../electron-builder.yml");
import AppTray from "./native-ui/tray";
import utils from "../modules/utils";

const { productName, nsis } = builderConfig;

import Logger from "../modules/logger";
import { crashedExitOrRelaunch } from "./process-manager/process-crash"; // 进程崩溃处理

import axios from "axios";

/**
 * 配置
 */
import { baseViewOpt, mainViewOpt } from "./config";

/**
 * 控制模块
 */
import "./controller/token.controller";
import "./controller/process-event-push.controller";
import "./controller/leveldb-model";
import "./controller/sqlite-model/ipc";
import SecretController from "./controller/secret.controller";
import ServerTimeController from "./controller/server-time.controller";
import Shortcut from "./modules/shortcut/shortcut";
/**
 * 子线程
 */
import MainView from "./process-manager/main-view";
// const { useCapture } = require("./process-manager/screen-cut"); // 截图
import TopNotice from "./process-manager/top-notice-main"; // 强制提醒弹窗
import ShowMediaWin from "./process-manager/show-media-win";

/**
 * IPC
 */
import DialogIPC from "./ipc/dialog-ipc";
import AppIPC from "./ipc/app-ipc";
import "./ipc/setting-ipc";
import "./ipc/popup-ipc";
import UpgradeIPC from "./ipc/upgrade-ipc";

const processWin = {};
let isShowUpdateDialog = false;

if (process.env.NODE_ENV === "development" || process.argv.map(x => x.replaceAll('-','')).find(x => x === 'debug')) {
  global.debugMode = true
} else {
  global.debugMode = false
}

Logger.log("app start");

if (process.platform === "win32") {
  // 解决 win7 运行之后的白屏问题
  const isWin7 = os.release().startsWith("6.1");
  if (isWin7) {
    app.disableHardwareAcceleration();
  }
}

app.commandLine.appendSwitch("ignore-certificate-errors");

/* Gpu process crashed */
app.on("gpu-process-crashed", (event, killed) => {
  Logger.log({ event: util.inspect(event), killed });
  // crashedExitOrRelaunch({ message: "程序因异常崩溃" });
});
/* Gpu process crashed END */

app.on("will-finish-launching", () => {
  // require("../modules/crash-reporter").init();
});

/**
 * 应用信息
 * 获取应用更新时会用到version、appType
 */
global.appInfo = {
  version: app.getVersion(), // 应用版本
  appType: utils.appType, // 客户端类型
  appTypeName: utils.platform.win32
    ? "Window"
    : utils.platform.darwin
    ? "MacOS"
    : utils.platform.linux
    ? "Linux"
    : "",
  platform: utils.platform,
  productName,
  shortcutName: nsis.shortcutName
};

let appTrayInstance = null; // 托盘图标的实例

/**
 * 隐藏窗体的菜单栏
 */
if (utils.platform.darwin) {
  const template = [
    {
      label: "Application",
      submenu: [
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: "编辑",
      submenu: [
        { label: "撤销", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "复制", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "剪切", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "全选", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
} else {
  Menu.setApplicationMenu(null);
}
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = path.join(__dirname, "/static").replace(/\\/g, "\\\\");
}
let mainWin = null;

function initialize() {
  makeSingleInstance();
  app.on("ready", () => {
    // 行动中心iframe、独立弹窗 入口请求不使用缓存
    session.defaultSession.webRequest.onBeforeSendHeaders(
      {
        urls: ["*://*/action-center/*"],
        // types: ["mainFrame", "subFrame"]
      },
      (details, callback) => {
        // console.log("url:", details.url, details.resourceType);
        if (["mainFrame", "subFrame"].includes(details.resourceType)) {
          // 不使用缓存
          details.requestHeaders["Cache-Control"] = "no-cache";
        }
        callback({ requestHeaders: details.requestHeaders });
      }
    );


    DialogIPC();
    AppIPC();
    UpgradeIPC();

    SecretController();
    ServerTimeController.start();

    appTrayInstance = new AppTray();
    const { useCapture } = require("./process-manager/screen-cut-entry");
    useCapture();

    createWindow();
    Shortcut.init();

    app.on("activate", () => {
      if (mainWin === null) {
        createWindow();
      } else {
        AppTray.showWindow();
      }
    });
  });
  app.on("before-quit", () => {
    Shortcut.clear();
    ServerTimeController.stop();
    mainWin.webContents.send("before-quit");
    global.realQuit = true;
  });
}

initialize();

function makeSingleInstance() {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.exit();
  } else {
    app.on("second-instance", (event, commandLine, workerDirectory) => {
      if (mainWin) {
        if (mainWin.isMinimized()) mainWin.restore();
        if (!mainWin.isVisible()) mainWin.show(), mainWin.setSkipTaskbar(false);
        mainWin.focus();
      }
    });
  }
}

function createWindow() {
  /**
   * Initial window options
   */

  mainWin = MainView(appTrayInstance);
  mainWin.on("focus", () => {
    mainWin.webContents.send("on-focus");
  });
  mainWin.on("blur", () => {
    mainWin.webContents.send("on-blur");
  });
  mainWin.on('close', (e) => {
    if (!global.realQuit) {
      e.preventDefault();
      waitUntilNotFullscreen(mainWin, () => {
        mainWin.hide();
        mainWin.setSkipTaskbar(true);
      });
    }
  });
}

function createOtherWindow() {
  if (!processWin.showMedia) processWin.showMedia = ShowMediaWin();
}

function waitUntilNotFullscreen(win, fn) {
  if(win.isFullScreen()){
    win.once('leave-full-screen', fn)
    win.setFullScreen(false);
  } else {
    fn();
  }
}

ipcMain.handle(
  'DESKTOP_CAPTURER_GET_SOURCES',
  (event, opts) => desktopCapturer.getSources(opts)
);

ipcMain.handle("get-current-locate", async (event) =>{
  console.log("获取 IP 地址信息");
  try {
    const res = await axios.get("http://ip.cn/api/index?type=0");
    return res.data;
  } catch (error) {
    return null;
  }
})

ipcMain.on("closeWin", (event, type) => {
  let operateWin = BrowserWindow.fromWebContents(event.sender);
  waitUntilNotFullscreen(operateWin, () => {
    operateWin.hide();
    operateWin.setSkipTaskbar(true);
    if (type === "copy") {
      mainWin.webContents.send("close-win", type);
    }
  });
});

ipcMain.on("browser-backward", () => {
  mainWin.webContents.goBack();
});

ipcMain.on("gomain", () => {
  // 来到首页
  createOtherWindow();
  mainWin.resizable = true; // 允许页面改变大小
  mainWin.setContentSize(mainViewOpt.width, mainViewOpt.height);
  mainWin.setMinimumSize(mainViewOpt.minWidth, mainViewOpt.minHeight);
  mainWin.center();
  mainWin.focus();
  const { initCaptureWin } = require("./process-manager/screen-cut-entry");
  initCaptureWin();
});

ipcMain.on("maximize", event => {
  // 窗口最大化
  const operateWin = BrowserWindow.fromWebContents(event.sender);
  waitUntilNotFullscreen(operateWin, () => {
    if (operateWin.isMaximized()) {
      // 已经处于最大化状态
      operateWin.unmaximize();
    } else {
      operateWin.maximize();
    }
    event.sender.send("maximize-change", { status: operateWin.isMaximized() });
  })
});

ipcMain.on("minimize", event => {
  // 窗口最小化
  const operateWin = BrowserWindow.fromWebContents(event.sender);
  waitUntilNotFullscreen(operateWin, () => {
    // 如果允许最小化，判断是否已处于最小化状态，是显示窗口，否最小化
    operateWin.minimizable &&
      (operateWin.isMinimized() ? operateWin.restore() : operateWin.minimize());
  });
});
ipcMain.on("gologin", event => {
  // 回到登陆页面
  let wins = BrowserWindow.getAllWindows();
  try {
    global.ZX_FOCUS_CLOSE_WIN_FLAG = true;
    wins.forEach((win) => {
      if (
        win &&
        !win.isDestroyed() &&
        processWin.showMedia &&
        processWin.showMedia.id === win.id
      ) {
        win.hide();
      } else if (win && mainWin && mainWin.id !== win.id) {
        win.close();
      }
    });
    mainWin.unmaximize();
  } catch (error) {
  } finally {
    delete global.ZX_FOCUS_CLOSE_WIN_FLAG;
  }

  mainWin.resizable = false; // 禁止页面改变大小
  mainWin.setContentSize(860, 640);
  mainWin.setMinimumSize(860, 640);
  mainWin.center();
  mainWin.focus();
  event.sender.send("go-login");
  TopNotice.close();
});

/**
 * 获取焦点
 */
ipcMain.on("get-focus", event => {
  const operateWin = BrowserWindow.fromWebContents(event.sender);
  operateWin.focus();
});

// 退出应用
ipcMain.on("exit-app", () => {
  app.exit();
  mainWin = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("activate-win", () => {
  AppTray.showWindow();
});

ipcMain.handle("open-information-dialog", async (event, opt) => {
  if (isShowUpdateDialog) {
    return;
  }
  isShowUpdateDialog = true;
  const options = {
    type: "info",
    ...opt
  };
  let result = await dialog.showMessageBox(mainWin, options);
  isShowUpdateDialog = false;
  return { index: result.response, checked: result.checkboxChecked };
});

// 图标闪烁
let dockBounceId = null;
ipcMain.on("blink-remind", (event, flag) => {
  try {
    if (flag) {
      mainWin.flashFrame(true);
      appTrayInstance && appTrayInstance.blinkStart();
      if (utils.platform.darwin) {
        dockBounceId = app.dock.bounce("critical");
      }
    } else {
      mainWin.flashFrame(false);
      appTrayInstance && appTrayInstance.blinkStop();
      if (utils.platform.darwin) {
        dockBounceId != null && app.dock.cancelBounce(dockBounceId);
      }
    }
  } catch (error) {
    console.error(error);
  }
});

process.on("uncaughtException", err => {
  console.error("uncaughtException", err);
  Logger.error({ type: "Caught exception", message: util.inspect(err) });
});

// Require each JS file in the main-process dir
// function loadDemos() {
//   const files = glob.sync(path.join(__dirname, "main-process/**/*.js"));
//   files.forEach(file => {
//     require(file);
//   });
// }

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
