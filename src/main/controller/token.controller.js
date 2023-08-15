const { BrowserWindow, ipcMain } = require("electron");

import Storage from "../modules/temporaryStorage";

const storage = new Storage();

/**
 * 保存token
 * type 1-token 2-刷新token
 */
ipcMain.on("save-token", (event, { type, token }) => {
  let key = "";
  switch (type) {
    case 1:
      key = "token";
      break;
    case 2:
      key = "refresh_token";
      break;
  }
  storage.add(key, token);
});

/**
 * 获取token
 */
ipcMain.on("get-token", (event, type) => {
  let key = "";
  switch (type) {
    case 1:
      key = "token";
      break;
    case 2:
      key = "refresh_token";
      break;
  }
  let token = storage.get(key);
  // event.sender.send(token);
  event.returnValue = token;
});

/**
 * 删除token
 */
ipcMain.on("del-token", (event, { type }) => {
  let keys = [];
  switch (type) {
    case 1:
      keys = ["token"];
      break;
    case 2:
      keys = ["refresh_token"];
      break;
    case 3:
      keys = ["token", "refresh_token"];
      break;
  }
  keys.forEach(key => {
    key && storage.del(key);
  });
});
