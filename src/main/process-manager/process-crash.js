import { app, dialog, BrowserWindow } from "electron";
import Logger from "../../modules/logger";
import { inspect } from "util";
import { dataType } from "../../modules/utils";

/**
 * 进程crash事件处理
 * @param {BrowserWindow} win 需要监听crashed事件的窗口实例
 * @param {function|string} handle 处理类型，为函数时当做自定义处理，crash时直接执行handle，为字符串时选择默认处理行为，默认为主程序重启，relaunch--主程序重启，close--当前窗口关闭
 * @param {string} title
 * @param {string} message
 */
export function crashHandle(win, { handle, title, message } = {}) {
  if (win && win.webContents) {
    win.webContents.on("crashed", evt => {
      console.dir(evt);
      console.error(evt);
      Logger.error({ type: "crashed", message: inspect(evt) });
      const handleType = dataType(handle);
      if (handleType === "string") {
        // 选择默认处理行为
        switch (handle) {
          case "close":
            win && !win.isDestroyed() && win.destroy();
          break;
          case "relaunch":
          default:
            crashedExitOrRelaunch({ win, title, message });
            break;
        }
      } else if (handle === "function") {
        handle();
      } else {
        crashedExitOrRelaunch({ win, title, message });
      }
    });
  }
}

/**
 * 以退出程序或重启程序的方式处理进程崩溃
 * @param {string} type 弹框类型
 * @param {string} title 弹框标题
 * @param {string} message 弹框内容
 * @param {object} win 弹框父窗口，默认为主窗口
 */
export function crashedExitOrRelaunch({
  type = "info",
  title = "程序崩溃",
  message = "当前页面崩溃",
  win = null
} = {}) {
  const opt = {
    type,
    title,
    message,
    buttons: ["退出", "重新打开"]
  };
  win = win || BrowserWindow.mainWindow;
  dialog.showMessageBox(win, opt).then(({ response, checkboxChecked }) => {
    if (response === 1) {
      // 重新打开
      Logger.log({ type: "app action", message: "app relaunch" });
      app.relaunch();
    } else {
      // 推出
    }
    app.exit();
  });
}
