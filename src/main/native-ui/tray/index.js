const path = require("path");
const { app, Menu, Tray, nativeImage, BrowserWindow } = require("electron");
const builderConfig = require("./../../../../electron-builder.yml");
const { nsis } = builderConfig;
const shortcutName = nsis.shortcutName;
import utils from "../../../modules/utils";

if (process.env.NODE_ENV !== "development") {
  global.__static = path.join(__dirname, "/static").replace(/\\/g, "\\\\");
}

const appIconPath = path.join(__static, "/appicon");
const logoIconPath = path.join(appIconPath, "/logo.png");
const emptyIconPath = path.join(appIconPath, "/ex.png");
const logoIcon = nativeImage.createFromPath(logoIconPath).resize({
  width: 16,
  height: 16
});

const emptyIcon = nativeImage.createFromPath(emptyIconPath).resize({
  width: 16,
  height: 16
});

export default class AppTray {
  appTray = null;
  timeoutObj = null;
  isEmptyIcon = false;
  constructor() {
    let self = this;
    this.appTray = new Tray(logoIcon);

    const MenuMap = [
      {
        label: `退出${shortcutName}`,
        click() {
          app.quit();
          BrowserWindow.mainWindow = null;
          self.appTray.destroy();
        }
      }
    ];

    if (utils.platform.darwin) {
      MenuMap.unshift({
        label: `打开${shortcutName}`,
        click() {
          AppTray.showWindow();
        }
      });
    }

    const contextMenu = Menu.buildFromTemplate(MenuMap);
    this.appTray.setToolTip(shortcutName);
    if (process.env.NODE_ENV === "development") {
      this.appTray.setToolTip(`${shortcutName}(test)`);
    }
    this.appTray.setContextMenu(contextMenu);
    this.appTray.on("click", () => {
      // 模拟桌面程序点击通知区图标实现打开关闭应用的功能
      AppTray.showWindow();
    });
    app.on("window-all-closed", () => {
      if (this.appTray) this.appTray.destroy();
    });
  }

  blinkStart() {
    this.timeoutObj && clearInterval(this.timeoutObj);
    this.timeoutObj = setInterval(() => {
      if (this.isEmptyIcon) {
        this.appTray.setImage(logoIcon);
        this.isEmptyIcon = false;
      } else {
        this.appTray.setImage(emptyIcon);
        this.isEmptyIcon = true;
      }
    }, 500);
  }

  blinkStop() {
    clearInterval(this.timeoutObj);
    this.isEmptyIcon = false;
    this.appTray.setImage(logoIcon);
  }

  static showWindow() {
    const mainWin = BrowserWindow.mainWindow;
    if (mainWin) {
      if (!mainWin.isDestroyed()) {
        mainWin.isMinimized() && mainWin.restore();
        if (!mainWin.isVisible()) {
          mainWin.show();
          mainWin.setSkipTaskbar(false);
        }
        mainWin.moveTop();
        mainWin.focus();
      }
    }
  }
}
