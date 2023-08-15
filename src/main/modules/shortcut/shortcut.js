/*
 * @Author: lixiaowei
 * @Date: 2021-04-19 14:11:07
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-21 09:38:02
 * @Description: 快捷键设置
 * @FilePath: /zx-client-pc/src/main/modules/shortcut/shortcut.js
 */

const { globalShortcut } = require("electron");
const storage = require("electron-json-storage");
const { promisify } = require("util");
const {
  DefaultShortcut,
  step,
  Short2Keyboard
} = require("../../constants/shortcut");

import { showWin } from "../../process-manager/main-view";
import { platform } from "../../../modules/utils";
// import { captureSceen } from "../../process-manager/screen-cut";

storage.get = promisify(storage.get);
storage.set = promisify(storage.set);
storage.getAll = promisify(storage.getAll);
const storageKey = "custom-user-shortcut";
const versionKey = "custom-user-shortcut-version";

class Shortcut {
  static async init() {
    Shortcut.clear();
    let allShortcut = await Shortcut.getShortcutAll();
    await updateVersion(allShortcut);
    const { openMainWindow, screenshort } = allShortcut;
    /**
     * 缺少快捷键冲突提示
     */
    const retOpen = await Shortcut.set(
      "openMainWindow",
      openMainWindow.hotkey,
      Shortcut.openMainWindowHandle
    );
    const retScreenshort = await Shortcut.set(
      "screenshort",
      screenshort.hotkey,
      Shortcut.screenshortHandle
    );
  }
  /**
   * 删除快捷键
   * @param {String} hotkey 快捷键
   * @returns
   */
  static remove(hotkey) {
    if (!hotkey) {
      return;
    }
    globalShortcut.unregister(hotkey);
  }
  /**
   * 设置快捷键
   * @param {String} hotkey
   * @returns
   */
  static async set(name, hotkey, event) {
    if (!hotkey) {
      return;
    }
    Shortcut.remove(hotkey); // 注册之前进行清理
    // 注册
    const ret = globalShortcut.register(hotkey, () => {
      event && event(name, hotkey);
    });
    if (ret) {
      // 注册成功保存到本地
      const customShortcut = (await storage.get(storageKey)) || {};
      await storage.set(
        storageKey,
        {
          ...customShortcut,
          [name]: {
            hotkey,
            status: ret
          }
        },
        { prettyPrinting: true }
      );
    }
    return ret;
  }

  /**
   * 查询快捷键的注册状态
   * @param {String} hotkey
   * @returns {Boolean}
   */
  static check(hotkey) {
    return globalShortcut.isRegistered(hotkey);
  }
  /**
   * 清除注册的所有快捷键
   */
  static clear() {
    globalShortcut.unregisterAll();
  }
  /**
   * 获取所有快捷键
   * @returns {Object} {}
   */
  static async getShortcutAll() {
    const customShortcut = (await storage.get(storageKey)) || {};
    const allShortcut = { ...DefaultShortcut, ...customShortcut };
    for (const key in allShortcut) {
      const item = allShortcut[key];
      item.status = Shortcut.check(item.hotkey); // 添加快捷键注册状态
      if (item.hotkey) {
        // 添加快捷键展示名称
        const temp_map = platform.darwin
          ? Short2Keyboard.macos
          : Short2Keyboard.window;
        const temp_setp = platform.darwin ? step.macos : step.window;
        item.showName = item.hotkey
          .split("+")
          .map(key => (temp_map[key] ? temp_map[key] : key))
          .join(temp_setp);
      }
    }
    return allShortcut;
  }

  static openMainWindowHandle() {
    showWin();
  }

  static async screenshortHandle() {
    let allShortcut = await Shortcut.getShortcutAll();
    const { captureScreen } = require("../../process-manager/screen-cut-entry");
    captureScreen(allShortcut.screenshort.hotkey);
  }
}

/**
 * 根据版本对目前系统的快捷键进行更新
 * @param {*} allShortcut
 */
async function updateVersion(allShortcut) {
  const currVersion = await storage.get(versionKey);
  switch (currVersion.version) {
    case undefined:
      // 初始版本需要升级截屏快捷键
      if (allShortcut.screenshort.hotkey === "CommandOrControl+Shift+A") {
        allShortcut.screenshort.hotkey = "Alt+X";
        allShortcut.screenshort.showName = "Alt + X";
      }
      if (allShortcut.screenshort.hotkey === "CommandOrControl+Shift+A") {
        allShortcut.screenshort.hotkey = "Alt+X";
        allShortcut.screenshort.showName = "⌥ X";
      }
    case "1.0.0":
    default:
      break;
  }

  // 当前快捷键版本为1.0.0
  if (currVersion.version !== "1.0.0") {
    await storage.set(versionKey, {
      version: "1.0.0"
    });
  }
}

export default Shortcut;
