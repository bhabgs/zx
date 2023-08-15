/*
 * @Author: lixiaowei
 * @Date: 2021-04-15 10:56:55
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-20 17:32:03
 * @Description: 快捷键IPC交互
 * @FilePath: /zx-client-pc/src/main/ipc/setting-ipc.js
 */

import { BrowserWindow, ipcMain } from "electron";
import Shortcut from "../modules/shortcut/shortcut";

import {
  create,
  show,
  send,
  close
} from "../process-manager/setting-panel.main";

ipcMain.on("open-setting-panel", e => {
  show();
});

ipcMain.handle("get-shortcut", async () => {
  const list = await Shortcut.getShortcutAll();
  return list;
});

ipcMain.handle("register-global-shortcut", async (e, { key, hotkey }) => {
  let result = null;
  switch (key) {
    case "openMainWindow":
      result = await Shortcut.set(key, hotkey, Shortcut.openMainWindowHandle);
      break;

    case "screenshort":
      result = await Shortcut.set(key, hotkey, Shortcut.screenshortHandle);
      break;
  }

  return result;
});

ipcMain.handle("unregister-global-shortcut", (e, hotkey) => {
  let result = null;
  result = Shortcut.remove(hotkey);

  return result;
});

ipcMain.handle("set-theme-bg", (e, bg) => {
  global.themeBg = bg;
});

ipcMain.handle("get-theme-bg", (e, bg) => {
  return global.themeBg;
});

ipcMain.handle("set-theme", (e, theme) => {
  global.themeName = theme;
  BrowserWindow.mainWindow.webContents.send("set-theme", theme);
});

ipcMain.handle("get-theme", (e) => {
  return global.themeName || "normal";
});
