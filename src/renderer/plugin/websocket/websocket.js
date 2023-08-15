import NSUtil from "../../../lib/namespace";
const Socket = require("ws");
import { ipcRenderer } from "electron";
import { WSPushDispose } from "../push-dispose";
import util from "util";
const emptyFn = function() {};

class PulsarClient {
  isErr = false;
  timeout = null;
  reconnectTime = [5000, 5000, 5000, 5000, 10000, 20000, 30000];
  reconnectTimeCurrent = 0;
  constructor(id, wsurl) {
    this._id = id;
    this.wsurl = wsurl;
    this.heartCheck = PulsarClient.heartCheck();
    PulsarClient.init.call(this, { id });
  }

  static init({ id }) {
    if (!this.instance || this.instance.readyState === 3) {
      const namespace = NSUtil.initNs(id);
      const url = `${this.wsurl}/${namespace}/${id}/${id}`;

      let token = ipcRenderer.sendSync("get-token", 1);
      token = `Bearer ${token}`;

      const ws = new Socket(url, {
        headers: { Authorization: token },
        timeout: 300000
      });
      this.instance = ws;
      this.instance.onopen = this._SocketOpen.bind(this);
      this.instance.onclose = this._SocketClose.bind(this);
      this.instance.onerror = this._SocketError.bind(this);
      this.instance.onmessage = this._SocketMessage.bind(this);
      this.reconnect = this._Reconnect.bind(this);
    }
    console.log(this.instance);
  }

  closeWS() {
    try {
      this.instance.close(4000, "Quit");
    } catch (error) {
      console.error(error);
    }
    clearTimeout(this.timeout);
  }

  _SocketOpen(event) {
    console.log("WebSocket 建立连接", event);
    this.heartCheck.start(this.instance);
    this.reconnectTimeCurrent = 0;
  }
  _SocketClose(event) {
    console.log("WebSocket 关闭连接", event);
    window.Logger.error({ type: "pulsar close", error: event });
    this.heartCheck.stop();
    const code = typeof event === "number" ? event : event.code;
    if (code !== 4000) {
      this._Reconnect.call(this);
    }
    switch (code) {
      case 1001:
        break;

      default:
        break;
    }
  }
  _SocketError(event) {
    console.log("WebSocket 发生错误");
    window.Logger.error({ type: "pulsar error", error: util.inspect(event) });
    console.error(event);
    console.dir(event);
    this.heartCheck.stop();
    this.isErr = true;
  }
  _Reconnect() {
    clearTimeout(this.timeout);
    console.log("reconnect");
    const time = this.reconnectTime[this.reconnectTimeCurrent];
    window.Logger.log({ type: "pulsar reconnect" });
    this.timeout = setTimeout(() => {
      PulsarClient.init.call(this, { id: this._id });
    }, time);
    this.reconnectTimeCurrent < this.reconnectTime.length - 1 &&
      ++this.reconnectTimeCurrent;
  }

  _SocketMessage(event) {
    this.heartCheck.reset(this.instance);
    const { data } = event;
    if (data) {
      try {
        const dataJson = JSON.parse(data);
        const payloadData = Buffer.from(dataJson.payload, "base64").toString();
        dataJson.payloadJson = JSON.parse(payloadData);
        window.Logger.log({
          type: "pulsar message",
          data: {
            messageId: dataJson.messageId,
            publishTime: dataJson.publishTime
          }
        });
        console.log("_SocketMessage", dataJson);
        WSPushDispose(dataJson);

        this.instance.send(JSON.stringify({ messageId: dataJson.messageId })); // 确认消费
      } catch (error) {
        console.error(error);
      }
    }
  }

  static heartCheck() {
    return {
      timeout: 240000,
      timeoutObj: null,
      reset(socket) {
        clearInterval(this.timeoutObj);
        this.start(socket);
      },
      start(socket) {
        this.timeoutObj = setInterval(() => {
          if (socket.readyState == 1) {
            let a = socket.ping("ping");
            console.log("ping: ", a);
            window.Logger.log({ type: "pulsar ping" });
          }
        }, this.timeout);
      },
      stop() {
        clearInterval(this.timeoutObj);
      }
    };
  }
}

export default PulsarClient;
