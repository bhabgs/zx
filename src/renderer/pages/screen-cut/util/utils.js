const { screen } = require("electron");
const remote = require('@electron/remote');

// screen接口只能用于主线程，渲染线程中需使用remote获取
const RealScreen = process.type.includes("renderer") ? remote.screen : screen;

/**
 * 获取当前屏幕信息
 */
export const getCurrentScreen = () => {
  let currentWindow = remote.getCurrentWindow();
  let { x, y } = currentWindow.getBounds();
  return RealScreen.getAllDisplays().filter(
    d => d.bounds.x === x && d.bounds.y === y
  )[0];
};

/**
 * 判断鼠标是否在当前截图窗口内
 */
export const isCursorInCurrentWindow = () => {
  let currentWindow = remote.getCurrentWindow();
  let { x, y } = RealScreen.getCursorScreenPoint();
  let { x: winX, y: winY, width, height } = currentWindow.getBounds();
  return x >= winX && x <= winX + width && y >= winY && y <= winY + height;
};
