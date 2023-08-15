/*
 * @Author: lixiaowei
 * @Date: 2021-01-04 21:29:18
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-16 10:18:49
 * @Description: file content
 * @FilePath: /zx-client-pc/src/main/ipc/upgrade-ipc.js
 */
import { ipcMain, BrowserWindow } from "electron";
import Upgrade from "../process-manager/upgrade";
const {
  create: createUpgradeWin,
  send: sendUpgradeWin,
  close: closeupgrade
} = Upgrade;

export default function(mainWin) {
  ipcMain.handle("upgrade-version", async (e, { url, closeOther }) => {
    console.log("发送更新事件");
    createUpgradeWin({ url, closeOther });
  });

  ipcMain.on("upgrade-close", e => {
    const mainWin = BrowserWindow.mainWindow;
    !mainWin.isDestroyed() && mainWin.webContents.send("upgrade-close");
    closeupgrade();
  });
}
