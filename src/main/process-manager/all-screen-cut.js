const { BrowserWindow, ipcMain, globalShortcut, screen } = require("electron");
const os = require("os");
const path = require("path");
const url = require("url");
const formatUrl = url.format({
  protocol: "file",
  slashes: true,
  pathname: path.join(__dirname, "all-screen-cut.html"),
});
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/all-screen-cut.html`
    : formatUrl;

let captureWin;
let screenCutHotKey = "";

// ipcMain.on("show-capture", () => {
//   if (captureWin) {
//     // captureWin.show();
//     captureWin.setOpacity(1);
//   }
// });
const initCaptureWin = () => {
  if (captureWin) {
    // captureWin.show()
    return;
  }
  captureWin = new BrowserWindow({
    show: false,
    // fullscreen: os.platform() === "win32" || undefined, // 窗口是否全屏
    transparent: true,

    x: 0,
    y: 0,
    frame: false,
    movable: false,
    resizable: false,
    minimizable: false,
    thickFrame: false,
    enableLargerThanScreen: true, // 使窗口的大小比屏幕大。只适用于macOS
    hasShadow: false,

    alwaysOnTop: global.debugMode ? false : true,
    webPreferences: {
      // 网页功能的设置
      // devTools: false, // 禁用调试工具
      // offscreen: true,
      allowRunningInsecureContent: true,
      nodeIntegration: true, // 是否启用node集成
      contextIsolation: false, // for electron 12+ https://github.com/electron/electron/issues/23506
    },
  });

  require("@electron/remote/main").enable(captureWin.webContents);
  captureWin.loadURL(winURL);

  // captureWin.webContents.openDevTools();

  captureWin.on("show", () => {
    captureWin.webContents.send("show");
  });
  captureWin.on("hide", () => {
    captureWin.webContents.send("hide");
    globalShortcut.unregister("Esc");
  });
  captureWin.on("closed", () => {
    captureWin = null;
  });
};
const captureScreen = (e, args) => {
  console.log("截屏快捷键", e);
  if(e) {
    screenCutHotKey = e;
    // 截屏时注销截屏快捷键
    globalShortcut.unregister(screenCutHotKey);
  }
  globalShortcut.register("Esc", () => {
    if (captureWin) {
      // captureWin.webContents.send('hide')
      // setTimeout(() => {
        console.log("重新注册",screenCutHotKey);
        globalShortcut.register(screenCutHotKey, () => {
          captureScreen(screenCutHotKey)}
        );
        captureWin.hide();
      // }, 300);
    }
  });

  const area = [
    [0, 0],
    [0, 0],
  ];
  const displays = screen.getAllDisplays();
  displays.forEach((display) => {
    const {
      bounds: { x, y, width, height },
    } = display;
    console.log("display", { x, y, width, height });
    if (x < area[0][0]) {
      area[0][0] = x;
    }
    if (y < area[0][1]) {
      area[0][1] = y;
    }
    if (x + width > area[1][0]) {
      area[1][0] = x + width;
    }
    if (y + height > area[1][1]) {
      area[1][1] = y + height;
    }
  });
  initCaptureWin();

  // captureWin.setSize(area[1][0] - area[0][0], area[1][1] - area[0][1], false);
  console.log(area, {
    x: area[0][0],
    y: area[0][1],
    width: area[1][0] - area[0][0],
    height: area[1][1] - area[0][1],
  });
  captureWin.setBounds(
    {
      x: area[0][0],
      y: area[0][1],
      width: area[1][0] - area[0][0],
      height: area[1][1] - area[0][1],
    },
    false
  );
  captureWin.setOpacity(0)
  captureWin.show();

  // captureWin.webContents.send('do-capture')

  const mainWin = BrowserWindow.mainWindow;
  mainWin && mainWin.webContents.send("capture-complete", { type: "show" });
};

const closeCapture = () => {
  console.log("重新注册",screenCutHotKey);
  globalShortcut.register(screenCutHotKey, () => {
    captureScreen(screenCutHotKey)}
  );
  captureWin && !captureWin.isDestroyed() && captureWin.hide();
};
const useCapture = () => {
  /**
   * 截图进程通信处理
   */
  ipcMain.on(
    "capture-screen",
    (e, { type = "start", screenId, operate = "", hotKey="" } = {}) => {
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
          captureWin.webContents.send("capture-screen", {
            type: "select",
            screenId,
          });
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
exports.initCaptureWin = initCaptureWin;
exports.captureScreen = captureScreen;
