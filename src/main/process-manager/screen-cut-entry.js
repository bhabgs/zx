const { screen, ipcMain, BrowserWindow} = require("electron");
const {
  useCapture: allUseCapture,
  initCaptureWin: allInitCaptureWin,
  captureScreen: allCaptureScreen,
} = require("./all-screen-cut");
const { useCapture, initCaptureWin, captureScreen } = require("./screen-cut");

const displays = screen.getAllDisplays();

const oneScaleFactor = displays[0].scaleFactor;

const hasDiffScaleFactor = displays.some(
  (display) => display.scaleFactor !== oneScaleFactor
);

displays.forEach(({ bounds, scaleFactor }) =>
  console.log({ bounds, scaleFactor })
);

if (
  displays.length === 1 ||
  (process.platform !== "darwin" && !hasDiffScaleFactor)
) {
  console.log("use new capture");
  exports.useCapture = allUseCapture;
  exports.initCaptureWin = allInitCaptureWin;
  exports.captureScreen = allCaptureScreen;
} else {
  console.log("use old capture");
  exports.useCapture = useCapture;
  exports.initCaptureWin = initCaptureWin;
  exports.captureScreen = captureScreen;
}

screen.on("display-metrics-changed", () => {
  // todo: 显示器（增减）调整后处理
  console.log('display-metrics-changed')
})
ipcMain.on("show-capture", (e) => {
  const webContents = e.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setOpacity(1);
});