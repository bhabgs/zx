import { ipcMain, BrowserWindow, Menu, webContents } from "electron";
import path from "path";

let popupURL, preloadPopupWin;
const winPool = [];
global.winPool = winPool;
const popupWindowObj = {};
const windowKeyMap = new Map();
const popupDataObj = {};
// webview webcontentsId -> [ browserwindow, ... ]
const appPopupMap = {};
global.appPopupMap = appPopupMap;


const POPUP_MAX_COUNT = 5;

let mailWebContents;

const winOpts = {
  frame: false,
  // transparent: true,
  maximizable: true,
  resizable: true,
  hasShadow: true,
  thickFrame: true,
  offscreen: true,
  show: false,
  minWidth: 860,
  minHeight: 600,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true,
    preload: preloadFile(),
    webSecurity: false,
  },
};

function getEmptyMailPopup() {
  const win = new BrowserWindow(winOpts);
  require("@electron/remote/main").enable(win.webContents);
  win.webContents.on("context-menu", contextMenuHandler);
  ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"].forEach(
    (type) => {
      win.on(type, () => win.webContents.send("window-state-change", type));
    }
  );
  win.on("closed", handleClosed);
  if(!appPopupMap[mailWebContents.id]){
    appPopupMap[mailWebContents.id] = [win.webContents.id];
  } else {
    appPopupMap[mailWebContents.id].push(win.webContents.id);
  }
  return win;
}
// setInterval(() => {
//   if (
//     // mailPopupURL &&
//     // winPool.length + Object.keys(windowKeyMap).length < POPUP_MAX_COUNT &&
//     winPool.length === 0
//   ) {
//     winPool.push(getEmptyMailPopup());
//   }
// }, 5000);

global.popupWindowObj = popupWindowObj;

function contextMenuHandler({ sender: webview }, params) {
  // const { params, target: webview } = event;
  const { x, y, selectionText, isEditable, editFlags } = params;
  const { canCopy, canPaste, canDelete, canSelectAll } = editFlags;
  let template = [];
  canCopy && template.push({ label: "复制", click: () => webview.copy() }); // 复制
  canPaste && template.push({ label: "粘贴", click: () => webview.paste() }); // 粘贴
  if (isEditable) {
    canDelete &&
      template.push({ label: "删除", click: () => webview.delete() }); // 可编辑状态下删除
    canSelectAll &&
      template.push({ label: "全选", click: () => webview.selectAll() }); // 可编辑状态下全选
  }
  if (template.length) {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ x, y });
  }
}

function handleClosed(e) {
  const win = e.sender;
  const key = windowKeyMap.get(win);
  global.closedKey = key;
  if (popupWindowObj[key]) {
    delete popupWindowObj[key];
  }
}

// preloadURL -> preload
// https://github.com/electron/electron/pull/33228
// https://github.com/bavulapati/electron/commit/7c5cdd64247e7a2961d57a33b12048ba6438df29#diff-2f4877fd5c41f15d6791c4619963abeeebc5aaad88b24b9947f67f6f6949dc94L52
function preloadFile() {
  let fileUrl = `${path.resolve(__dirname, "static/plugin/webview.js")}`;

  if (process.env.NODE_ENV === "development") {
    fileUrl = `${path.resolve("static/plugin/webview.js")}`;
  }
  return fileUrl;
}

// ipcMain.handle("set-mail-popup-url", (e, url) => (mailPopupURL = url));

ipcMain.handle("eventhub-emit", (e, ...args) => {
  mailWebContents.executeJavaScript(
    `window.doEventHubEmit.apply(null, ${JSON.stringify(args)})`
  );
});
ipcMain.handle("can-popup", () => {
  return Object.keys(popupWindowObj).length >= POPUP_MAX_COUNT
    ? { error: `打开窗口过多，请先关闭部分窗口后重试。` }
    : {};
});

ipcMain.handle("popup", async (e, url, key, data, options) => {
  mailWebContents = e.sender;
  if (popupWindowObj[key]) {
    popupWindowObj[key].show();
    return { success: true };
  }
  if (Object.keys(popupWindowObj).length >= POPUP_MAX_COUNT) {
    return { error: `打开窗口过多，请先关闭部分窗口后重试。` };
  }
  let win;
  popupWindowObj[key] = win = preloadPopupWin;
  // 设置配置项
  if (options) {
    if (options.size) {
      win.setContentSize(options.size.width, options.size.height);
    }
    if (options.minSize) {
      win.setMinimumSize(options.minSize.width, options.minSize.height);  
    }
    win.center();
  }
  preloadPopupWin = getEmptyMailPopup();
  preloadPopupWin.loadURL(popupURL, {
    extraHeaders: "pragma: no-cache\n",
  });
  // win.webContents.openDevTools();
  win.loadURL(url, {
    extraHeaders: "pragma: no-cache\n",
  });
  // win.on("ready-to-show", () => win.show());
  win.webContents.executeJavaScript(`
    window.browserwindow_id="${key}";
    window.ipcTargetWebContentsId=${mailWebContents.id};
    window.myWebContentsId=${win.webContents.id}
  `);

  // win.webContents.send("load-storage", key);

  windowKeyMap.set(win, key);
  popupDataObj[win.webContents.id] = data;
  return { success: true };
});

ipcMain.on("popup-data-ready", (e) => {
  const webContents = e.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) {
    win.show();
  }
});

ipcMain.handle("get-my-popup-data", (e) => {
  const webContents = e.sender;
  const data = popupDataObj[webContents.id];
  delete popupDataObj[webContents.id];
  return data;
});

ipcMain.handle("set-mail-popup-url", (e, url) => {
  mailWebContents = e.sender;
  popupURL = url;
  preloadPopupWin = getEmptyMailPopup();
  preloadPopupWin.loadURL(popupURL);
  // preloadPopupWin.webContents.openDevTools();
});

// 创建行动中心独立弹窗
let operationWin
ipcMain.handle("create-operation-win", () => {
  const win = new BrowserWindow(winOpts);
  global.operationWin = operationWin = win;
  require("@electron/remote/main").enable(win.webContents);
  // win.webContents.on("context-menu", contextMenuHandler);
  ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"].forEach(
    (type) => {
      win.on(type, () => win.webContents.send("window-state-change", type));
    }
  );
  win.loadURL(process.env.APP_ACTIONCENTER + "/empty", {
    extraHeaders: "pragma: no-cache\n",
  });

  win.webContents.executeJavaScript(`
    window.ipcTargetIsWin=true;
    window.ipcTargetWebContentsId=${BrowserWindow.mainWindow.webContents.id};`)
  // todo token
  win.on("close", (e) => {
    win.hide();
    if (!global.ZX_FOCUS_CLOSE_WIN_FLAG && !global.realQuit) {
      e.preventDefault();
    }
  });
});
ipcMain.handle('open-operation-page',(e, payload)=>{
  operationWin.webContents.send('open-page', payload.data)
  operationWin.show()
  operationWin.setSkipTaskbar(false);
  operationWin.focus()
  // operationWin.webContents.openDevTools();
})
ipcMain.on("popup-ready", (e, key) => {
  popupWindowObj[key].show();
});
ipcMain.on("close-popup", (e, key) => {
  // popupWindowObj[key].hide();
  // winPool.push(popupWindowObj[key]);
  popupWindowObj[key].close();
  delete popupWindowObj[key];
});

ipcMain.handle('close-app-popups', (e, webviewWebcontentsId) => {
  const popupList = appPopupMap[webviewWebcontentsId]
  popupList.forEach(id => {
    console.log(webContents.fromId(id))
    BrowserWindow.fromWebContents(webContents.fromId(id)).close()
  })
  delete appPopupMap[webviewWebcontentsId]
})