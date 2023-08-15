const { screen } = require("electron");
const remote = require('@electron/remote');

// screen接口只能用于主线程，渲染线程中需使用remote获取
const RealScreen = process.type.includes("renderer") ? remote.screen : screen;

/**
 * 通过 rect 获取所属显示器 rect
 */
 export const getDisplayRectByRect = (rect) => {
  const display = remote.screen.getDisplayMatching(rect);
  return display.bounds;
}
/**
 * 获取当前屏幕信息
 */
export const getCurrentScreen = () => {
  let currentWindow = remote.getCurrentWindow();
  let { x, y } = currentWindow.getBounds();
  return RealScreen.getAllDisplays()[0];
  // return RealScreen.getAllDisplays().filter(
  //   d => d.bounds.x === x && d.bounds.y === y
  // )[0];
};

/**
 * 获取所有屏幕大小
 */
export const getAllDisplaysArea = () => {
  const displays = remote.screen.getAllDisplays()
  const area = [[0, 0], [0, 0]]
  displays.forEach(({bounds:{x,y,width,height}})=> {
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
  })
  return area
}

/**
 * 判断鼠标是否在当前截图窗口内
 */
export const isCursorInCurrentWindow = () => {
  let currentWindow = remote.getCurrentWindow();
  let { x, y } = RealScreen.getCursorScreenPoint();
  let { x: winX, y: winY, width, height } = currentWindow.getBounds();
  return x >= winX && x <= winX + width && y >= winY && y <= winY + height;
};
