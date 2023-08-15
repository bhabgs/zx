const {
  BrowserWindow,
  app,
  Menu,
  MenuItem,
  clipboard,
  shell,
  ipcMain
} = require("electron");
const path = require("path");
const url = require("url");
import { baseViewOpt, mainViewOpt } from "../config";
import { getrule } from "../../lib/base-menuitem";
import { crashHandle } from "./process-crash";
import { loadErrorPage } from "../plugin/load-error";

const { platform } = process;

const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

let mainWin = null;
export default appTrayInstance => {
  mainWin = new BrowserWindow(baseViewOpt);
  require("@electron/remote/main").enable(mainWin.webContents);

  BrowserWindow.mainWindow = mainWin;

  crashHandle(mainWin, { handle: "relaunch", message: "主程序因异常崩溃" });

  mainWin.loadURL(winURL);

  mainWin.once("ready-to-show", () => {
    mainWin.show();
    mainWin.focus();
    if (global.debugMode) {
      mainWin.openDevTools(); // 调试代码
    }
  });
  mainWin.on("closed", () => {
    // app.quit();
    process.emit("main-win-closed");
    mainWin = null;
  });

  mainWin.on("focus", event => {
    appTrayInstance && appTrayInstance.blinkStop();
  });

  mainWin.on("show", event => {
    event.sender.send("main-win-visible", { status: true });
  });

  mainWin.on("hide", event => {
    event.sender.send("main-win-visible", { status: false });
  });

  mainWin.on("minimize", event => {
    event.sender.send("main-win-visible", { status: false });
  });

  mainWin.on("maximize", event => {
    event.sender.send("main-win-visible", { status: true });
  });

  mainWin.on("restore", event => {
    event.sender.send("main-win-visible", { status: true });
  });

  mainWin.webContents.on(
    "new-window",
    (event, url, frameName, disposition, options = {}, additionalFeatures) => {
      event.preventDefault();
      let newOptions = {
        title: baseViewOpt.title,
        modal: true,
        width: mainViewOpt.width,
        height: mainViewOpt.height,
        minWidth: mainViewOpt.minWidth,
        minHeight: mainViewOpt.minHeight,
        opacity: 1,
        show: true,
        thickFrame: true,
        resizable: true,
        frame: true,
        useContentSize: true,
        icon: path.join(__static, "/appicon/icon.ico"),
        webPreferences: {
          nodeIntegration: false,
          webviewTag: false,
          nodeIntegrationInSubFrames: false
        }
      };
      let sWin = new BrowserWindow(newOptions);
      sWin.webContents.on('will-prevent-unload', (event) => {
        console.log('will-prevent-unload', 'new window')
        event.preventDefault()
      })
      if (global.debugMode) {
        sWin.webContents.openDevTools();
      }
      require("@electron/remote/main").enable(sWin.webContents);

      sWin.webContents.on(
        "did-fail-load",
        (e, errCode, errDes, validate, isMain, frameId, frameRoutingId) => {
          console.log(
            e,
            errCode,
            errDes,
            validate,
            isMain,
            frameId,
            frameRoutingId
          );

          if (errCode === -312) {
            validate && sWin.setTitle(validate);
            sWin.webContents.executeJavaScript(loadErrorPage(validate, errDes));
          }
        }
      );

      sWin.once("ready-to-show", () => {
        sWin.show();
        // sWin.maximize();
      });
      sWin.loadURL(url);
      event.newGuest = sWin;
    }
  );
  const menuitem = getrule(
    ["cut", "copy", "paste", "delete", "selectAll"],
    mainWin.webContents
  );
  const menu = new Menu();
  menuitem.forEach(item => menu.append(item.menu));

  mainWin.webContents.on("context-menu", (e, params) => {
    const { isEditable, editFlags, inputFieldType } = params;
    if (isEditable) {
      menuitem.forEach(item => {
        let key = `can${item.type.replace(/^.{1}/, val =>
          val.toLocaleUpperCase()
        )}`;
        let flag = editFlags[key];
        if (item.type === "paste" && !flag && inputFieldType === "none") {
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
          filePath && (flag = true);
        }
        item.menu.enabled = flag;
      });
      let option = {
        window: mainWin,
        callback(optional) {}
      };
      menu.popup(option);
    }
  });

  return mainWin;
};

export const showWin = () => {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.isMinimized() && mainWin.restore();
    if (!mainWin.isVisible()) {
      mainWin.show();
      mainWin.setSkipTaskbar(false);
    }
    mainWin.moveTop();
    mainWin.focus();
  }
};

ipcMain.on("show-main-win", showWin);