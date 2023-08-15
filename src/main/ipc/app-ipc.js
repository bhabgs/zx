/*
 * @Author: lixiaowei
 * @Date: 2020-11-16 15:20:06
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-11-16 15:27:41
 * @Description: 供渲染进程通过IPC通信调用的主进程模块app
 * @FilePath: /zx-client-pc/src/main/ipc/app-ipc.js
 */

import { app, ipcMain } from "electron";

export default function AppIPC() {
  /**
   * 获取系统目录
   * name,目录类型，home、appData、userData、cache、temp、exe、module、desktop、documents、downloads、music、pictures、videos、logs、pepperFlashSystemPlugin
   */
  ipcMain.handle("app-get-path", (e, name) => {
    return app.getPath(name);
  });
}
