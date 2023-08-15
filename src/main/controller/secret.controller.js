const { ipcMain } = require("electron");

import Storage from "../modules/temporaryStorage";

const storage = new Storage();

export default function SecretController() {
  /**
   * 保存secret
   */
  ipcMain.handle("save-secret", (event, secrets) => {
    secrets.forEach(item => {
      if (item.current) {
        storage.add("current", item);
      }
      storage.add(item.uuid, item);
    });
  });

  /**
   * 获取secret
   */
  ipcMain.handle("get-secret", (event, key) => {
    let data = storage.get(key);
    return data;
  });

  ipcMain.handle("get-current-secret", () => {
    return storage.get("current");
  });
}
