const { ipcMain } = require("electron");
const childProcess = require('child_process');
const path = require("path");

import Storage from "../modules/temporaryStorage";

const storage = new Storage();
let child = null;

class ServerTimeController {
  static start() {
    storage.add("server-time", null);

    if (!child) {
      child = childProcess.fork(path.join(__static, '/plugin/servertime.js'), {
        silent: false
      });

      child.on('message', function (m) {
        storage.add("server-time", m.serverTime);
      });
    }

    child.send({ timeServerUrl: process.env.BASE_URL });

    /**
     * 获取服务器时间
     */
    ipcMain.on("get-server-time", (event, type) => {
      let time = storage.get("server-time");
      event.returnValue = time;
    });
  }

  static stop() {
    if (child) {
      child.kill();
      child = null;
    }
  }
}

export default ServerTimeController;