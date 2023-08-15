const { BrowserWindow, ipcMain, globalShortcut, screen,ipcRenderer } = require("electron");
const os = require("os");
const path = require("path");
const url = require("url");
const { crashHandle } = require("./process-crash");
const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "screen-cut.html")
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/screen-cut.html`
    : formatUrl;
let captureWins = [];
let screenCutHotKey = "";

const captureScreen = (e, args) => {
  if (captureWins.length > 0) {
    return;
  }
  if(e) {
    screenCutHotKey = e;
    // 截屏时注销截屏快捷键
    globalShortcut.unregister(screenCutHotKey);
  }
  globalShortcut.register("Esc", () => {
    if (captureWins) {
      globalShortcut.register(screenCutHotKey, () => {
        captureScreen(screenCutHotKey)}
      );
      captureWins.forEach(win => win.destroy());
      captureWins = [];
    }
  });

  let displays = screen.getAllDisplays(); // 获取所有显示器信息
  // let displays = [screen.getAllDisplays()[0]]; // 获取所有显示器信息
  let appInfo = global.appInfo;
  captureWins = displays.map((display, index) => {
    // 根据显示器信息生产对应截图处理窗口
    let captureWin = new BrowserWindow({
      // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
      title: appInfo.productName,
      show: true,
      fullscreen: os.platform() === "win32" || undefined, // 窗口是否全屏
      width: display.bounds.width,
      height: display.bounds.height,
      x: display.bounds.x,
      y: display.bounds.y,
      transparent: true,
      frame: false,
      movable: false,
      resizable: false,
      minimizable: false,
      opacity: 0,
      enableLargerThanScreen: true, // 使窗口的大小比屏幕大。只适用于macOS
      hasShadow: false,
      webPreferences: {
        // 网页功能的设置
        // devTools: false, // 禁用调试工具
        allowRunningInsecureContent: true,
        nodeIntegration: true, // 是否启用node集成
        contextIsolation: false,  // for electron 12+ https://github.com/electron/electron/issues/23506
      }
    });

    require("@electron/remote/main").enable(captureWin.webContents);
    if (global.debugMode) {
      captureWin.webContents.openDevTools();
    } else {
      captureWin.setAlwaysOnTop(true, "screen-saver"); // 设置窗口置顶
    }
    crashHandle(captureScreen, { handle: "close" });

    captureWin.setVisibleOnAllWorkspaces(true); // 设置窗口在所有工作空间可见
    // captureWin.setFullScreenable(false); // 设置点击最大化按钮不可以全屏或最大化窗口
    captureWin.fullScreenable = false;

    // 加载页面
    captureWin.loadURL(winURL);

    let { x, y } = screen.getCursorScreenPoint(); // 获取当前鼠标的绝对位置。
    if (
      x >= display.bounds.x &&
      x <= display.bounds.x + display.bounds.width &&
      y >= display.bounds.y &&
      y <= display.bounds.y + display.bounds.height
    ) {
      captureWin.focus();
    } else {
      captureWin.blur();
    }

    /**
     * 窗口关闭事件处理
     * 窗口关闭后清理传递事件的窗口，之后遍历截图窗口列表清理
     */
    captureWin.on("closed", () => {
      let index = captureWins.indexOf(captureWin);
      if (index !== -1) {
        captureWins.splice(index, 1);
      }
      captureWins.forEach(win => win.destroy());
      globalShortcut.unregister("Esc");
    });
    if (displays.length === index + 1) {
      const mainWin = BrowserWindow.mainWindow;
      mainWin && mainWin.webContents.send("capture-complete", { type: "show" });
    }
    return captureWin;
  });
};

const closeCapture = () => {
  globalShortcut.register(screenCutHotKey, () => {
    captureScreen(screenCutHotKey)}
  );
  setTimeout(() => {
    captureWins.forEach(win => {
      win && !win.isDestroyed() && win.close();
    });
  }, 200);
};

const useCapture = () => {
  /**
   * 截图进程通信处理
   */
  ipcMain.on(
    "capture-screen",
    (e, { type = "start", screenId, operate = "", hotKey = "" } = {}) => {
      switch (type) {
        case "start":
          // 开始截图
          captureScreen(hotKey);
          break;

        case "complete":
          // 输出完成
          if (operate === "paste") {
            // 后续操作为粘贴
            const mainWin = BrowserWindow.mainWindow;
            mainWin &&
              !mainWin.isDestroyed() &&
              mainWin.webContents.send("capture-complete", { type: "paste" });
          }
          closeCapture();
          break;

        case "select":
          // 开始选取
          captureWins.forEach(win =>
            win.webContents.send("capture-screen", { type: "select", screenId })
          );
          break;

        case "close":
          closeCapture();
          break;

        default:
          break;
      }
    }
  );
};

exports.useCapture = useCapture;
exports.captureScreen = captureScreen;
exports.initCaptureWin = () => {}
