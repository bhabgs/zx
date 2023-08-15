/*
 * @Author: lixiaowei
 * @Date: 2020-10-28 13:36:27
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-11-24 10:12:26
 * @Description: 供渲染进程通过IPC通信调用的dialog
 * @FilePath: /zx-client-pc/src/main/ipc/dialog-ipc.js
 */
import { app, ipcMain, dialog } from "electron";
import { readFile } from 'fs/promises';
import path from "path"
import { appDataDir, getHashUrl } from "../../modules/utils";

export default function() {
  /**
   * 文件保存
   */
  ipcMain.handle(
    "save-dialog",
    async (event, { win = null, name, filters = [], ...opt } = {}) => {
      const result = await dialog.showSaveDialog(win, {
        defaultPath: name,
        filters,
        ...opt
      });

      return result;
    }
  );

  /**
   * 消息提示
   */
  ipcMain.handle(
    "message-dialog",
    async (event, { win = null, ...opt } = {}) => {
      const result = await dialog.showMessageBox(win, opt);

      return result;
    }
  );

  /**
   * open dialog
   */
  ipcMain.handle("open-dialog", async (event, { win = null, ...opt } = {}) => {
    const result = await dialog.showOpenDialog(win, opt);

    return result;
  });

  /**
   * 获取合并转发信息
   */
  ipcMain.handle("get-combine-msg-data", async (event, { url }) => {
    const hash = getHashUrl(url);
    const filePath = path.join(appDataDir, "combineMsg", hash);
    let dataStr;
    try{
      dataStr = await readFile(filePath);
    }catch(e){
    }
    return dataStr && JSON.parse(dataStr);
  })
}
