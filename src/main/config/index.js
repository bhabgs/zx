const path = require("path");
const builderConfig = require("../../../electron-builder.yml");
const { nsis } = builderConfig;
const shortcutName = nsis.shortcutName;
const dbname = {
  base: Buffer.from(process.env.DB_BASE, "utf-8").toString("base64"),
  contact: Buffer.from(process.env.DB_CONTACT, "utf-8").toString("base64"),
  group: Buffer.from(process.env.DB_GROUP, "utf-8").toString("base64"),
  fileCache: Buffer.from(process.env.DB_FILECACHE, "utf-8").toString("base64"),
  fileDown: Buffer.from(process.env.DB_FILEDOWN, "utf-8").toString("base64"),
};

const baseViewOpt = {
  title: shortcutName,
  width: 860, // 窗口的宽度
  height: 640, // 窗口的高度
  minHeight: 640, // 窗口的最小高度
  minWidth: 860, // 窗口的最小宽度
  frame: false, // 设置为 false 时可以创建一个Frameless Window
  show: false, // 窗口创建的时候是否显示
  thickFrame: true, // -对 Windows 上的无框窗口使用WS_THICKFRAME 样式，会增加标准窗口框架。 设置为 false 时将移除窗口的阴影和动画
  icon: path.join(__static, "/appicon/icon.ico"), // 窗口的图标. 在 Windows 上推荐使用 ICO 图标来获得最佳的视觉效果, 默认使用可执行文件的图标.
  resizable: false, // 窗口是否可以改变尺寸
  minimizable: true, // 窗口是否可以最小化
  maximizable: true, // 窗口是否可以最大化
  closable: true, // 窗口是否可以关闭
  focusable: true, // 窗口是否可以聚焦
  // hasShadow: true, // 窗口是否有阴影. 仅在 macOS 上支持
  useContentSize: true, // width 和 height 将设置为 web 页面的尺寸(译注: 不包含边框), 这意味着窗口的实际尺寸将包括窗口边框的大小，稍微会大一点
  offscreen: true, // 是否绘制和渲染可视区域外的窗口
  movable: true,
  // transparent: true,
  webPreferences: {
    // 网页功能的设置
    nodeIntegration: true, // 是否启用node集成
    nodeIntegrationInWorker: true, // 是否在Web工作器中启用了Node集成
    enableRemoteModule: true, //  是否启用 Remote 模块
    allowRunningInsecureContent: true, // 允许一个 https 页面运行 http url 里的资源，包括 JavaScript, CSS 或 plugins
    minimumFontSize: 0, // 最小字体限制
    webviewTag: true, // 是否启用 <webview> tag标签
    enableBlinkFeatures: "CSSVariables,KeyboardEventKey", // 需要启用的特性列表
    navigateOnDragDrop: false, // 将文件或链接拖放到页面上时是否触发页面跳转
    contextIsolation: false, // for electron 12+ https://github.com/electron/electron/issues/23506
  },
};

const mainViewOpt = {
  width: 960,
  height: 600,
  minWidth: 860,
  minHeight: 600,
};

export { baseViewOpt, mainViewOpt, dbname };
