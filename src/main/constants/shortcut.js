/*
 * @Author: lixiaowei
 * @Date: 2021-04-19 14:47:19
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-21 13:58:05
 * @Description: 快捷键设置常量
 * @FilePath: /zx-client-pc/src/main/constants/shortcut.js
 */

module.exports = {
  DefaultShortcut: {
    screenshort: { hotkey: "Alt+X" },
    openMainWindow: { hotkey: "CommandOrControl+Shift+O" }
  },
  Keyboard2KeyCode: {
    esc: 27,
    enter: 13,
    tab: 9,
    CapsLock: 20,
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    MetaLeft: 91,
    MetaRight: 93,
    Backspace: 8
  },
  Keyboard2Short: {
    macos: { "⇧": "Shift", "⌃": "Ctrl", "⌘": "CommandOrControl", "⌥": "Alt" },
    window: { Ctrl: "CommandOrControl", Shift: "Shift", Alt: "Alt" }
  },
  Short2Keyboard: {
    macos: { Shift: "⇧", Ctrl: "⌃", CommandOrControl: "⌘", Alt: "⌥", Command: "⌘" },
    window: { CommandOrControl: "Ctrl", Shift: "Shift", Alt: "Alt", Ctrl: "Ctrl", }
  },
  step: { macos: " ", window: " + " }
};
